import { APP_CONFIG } from '../config.js';
import { ApiErrorHandler } from '../utils/error-handler.js';

// API call counter for debugging
let apiCallCounter = 0;
const apiCallLog: Array<{
  id: number;
  url: string;
  timestamp: number;
  stack?: string;
}> = [];

// Core API request function
export async function fetchData(
  url: string,
  responseType: 'json' | 'blob' = 'json'
) {
  const fullUrl = `${APP_CONFIG.API_URL}${url}`;

  // Track API call
  apiCallCounter++;
  const callId = apiCallCounter;
  const timestamp = Date.now();

  // Capture stack trace for debugging
  const stack = APP_CONFIG.DEBUG ? new Error().stack : undefined;

  apiCallLog.push({
    id: callId,
    url: fullUrl,
    timestamp,
    stack,
  });

  console.log(`[API-${callId}] 🌐 API Call: ${url}`);
  console.log(`[API-${callId}] 📊 Total API calls so far: ${apiCallCounter}`);

  if (APP_CONFIG.DEBUG && stack) {
    console.log(`[API-${callId}] 📍 Call stack:`, stack);
  }

  // Check if API is configured
  if (!APP_CONFIG.isConfigured()) {
    throw new Error(
      'API configuration is missing. Please configure your API key and base URL.'
    );
  }

  const response = await fetch(fullUrl, {
    headers: {
      Authorization: `Bearer ${APP_CONFIG.BEARER_TOKEN}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    console.error(`API request failed with status ${response.status}: ${text}`);

    // Analyze the error to provide better user feedback
    const errorDetails = ApiErrorHandler.analyzeError(
      response.status,
      text,
      fullUrl
    );

    if (errorDetails.isAddonError) {
      ApiErrorHandler.showAddonError('api');
    } else if (errorDetails.errorType === 'auth') {
      ApiErrorHandler.displayErrorMessage(
        'Invalid API key. Please check your configuration and try again.',
        'error'
      );
    } else {
      ApiErrorHandler.displayErrorMessage(errorDetails.message, 'error');
    }

    throw new Error(errorDetails.message);
  }

  if (responseType === 'json') {
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error(
        `API returned non-JSON response with content-type: ${contentType || 'none'}, body: ${text}`
      );
      throw new Error('API returned non-JSON response');
    }
    const data = await response.json();
    console.log(
      `[API-${callId}] ✅ Success: ${response.status} - ${Object.keys(data).length} keys in response`
    );

    if (!data || data.s === 'error') {
      console.error(
        'API response is an error:',
        data.errmsg || 'Unknown error'
      );
      throw new Error('API response is an error');
    }
    return data;
  } else if (responseType === 'blob') {
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('image')) {
      const text = await response.text();
      console.error(
        `API returned non-image response with content-type: ${contentType || 'none'}, body: ${text}`
      );
      throw new Error('API returned non-image response');
    }
    const blob = await response.blob();
    console.log(
      `[API-${callId}] ✅ Success: ${response.status} - Blob size: ${blob.size} bytes`
    );
    return blob;
  } else {
    throw new Error('Invalid responseType');
  }
}

// API debugging utilities
export function getApiCallSummary() {
  const summary = {
    totalCalls: apiCallCounter,
    callsByEndpoint: {} as Record<string, number>,
    recentCalls: apiCallLog.slice(-10),
    allCalls: apiCallLog,
  };

  // Count calls by endpoint
  apiCallLog.forEach(call => {
    const endpoint = call.url.split('?')[0]; // Remove query params for grouping
    summary.callsByEndpoint[endpoint] =
      (summary.callsByEndpoint[endpoint] || 0) + 1;
  });

  return summary;
}

export function logApiCallSummary() {
  const summary = getApiCallSummary();
  console.group('📊 API Call Summary');
  console.log(`Total API calls: ${summary.totalCalls}`);
  console.log('Calls by endpoint:', summary.callsByEndpoint);
  console.log('Recent calls:', summary.recentCalls);
  console.groupEnd();
  return summary;
}

export function resetApiCallCounter() {
  apiCallCounter = 0;
  apiCallLog.length = 0;
  console.log('🔄 API call counter reset');
}

export async function getGroups() {
  const data = await fetchData('/api/v1/groups');
  return data.d.groups.map((group: { id: string }) => group.id);
}

export async function getSymbolInfo(group: string) {
  return await fetchData(`/api/v1/symbol_info?group=${group}`);
}

export async function fetchHistoricalData(
  symbol: string,
  resolution: string,
  from: number,
  to: number
) {
  const url = `/api/v1/history?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&include_tvl=true`;
  return await fetchData(url);
}

export async function fetchCurrentTokenData(
  policyId: string,
  assetName: string
) {
  const policy = `${policyId}${assetName}`;
  return await fetchData(`/api/v1/tokens/current?policy=${policy}`);
}

export async function fetchTokenLogo(
  policyId: string,
  assetName: string
): Promise<Blob> {
  const policy = `${policyId}${assetName}`;
  return await fetchData(`/api/v1/tokens/logo/${policy}`, 'blob');
}
