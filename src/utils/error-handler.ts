// Error handling utilities for API and addon-related errors

export interface ApiErrorDetails {
  status: number;
  message: string;
  isAddonError: boolean;
  errorType: 'auth' | 'addon' | 'network' | 'unknown';
}

export class ApiErrorHandler {
  static analyzeError(
    status: number,
    responseText: string,
    url: string
  ): ApiErrorDetails {
    let errorType: 'auth' | 'addon' | 'network' | 'unknown' = 'unknown';
    let isAddonError = false;
    let message = responseText || 'Unknown error occurred';

    // Analyze the error based on status code and response
    if (status === 401) {
      // Check if this is an addon-related error disguised as auth error
      if (
        (url.includes('/stream') || url.includes('/tokens/stream')) &&
        (responseText.toLowerCase().includes('addon') ||
          responseText.toLowerCase().includes('subscription') ||
          responseText.toLowerCase().includes('stream') ||
          responseText.toLowerCase().includes('plan'))
      ) {
        errorType = 'addon';
        isAddonError = true;
        message =
          'Stream access requires a paid addon. Your API key is valid but lacks streaming permissions.';
      } else {
        errorType = 'auth';
        message = 'Invalid API key. Please check your authentication token.';
      }
    } else if (status === 403) {
      // Check if this is an addon-related error
      if (
        url.includes('/stream') ||
        responseText.toLowerCase().includes('addon') ||
        responseText.toLowerCase().includes('subscription') ||
        responseText.toLowerCase().includes('plan')
      ) {
        errorType = 'addon';
        isAddonError = true;
        message =
          'This feature requires a paid addon. Please upgrade your plan to access streaming data.';
      } else {
        errorType = 'auth';
        message = 'Access denied. Please check your API key permissions.';
      }
    } else if (status === 429) {
      errorType = 'network';
      message = 'Rate limit exceeded. Please wait before making more requests.';
    } else if (status >= 500) {
      errorType = 'network';
      message = 'Server error. Please try again later.';
    } else if (status >= 400) {
      errorType = 'network';
      message = `Request failed with status ${status}: ${responseText}`;
    }

    return {
      status,
      message,
      isAddonError,
      errorType,
    };
  }

  static showAddonError(feature: 'streaming' | 'api' = 'streaming'): void {
    const errorMessage =
      feature === 'streaming'
        ? 'No addons detected. If you want to have access to the stream endpoint, make sure to get access to a Token Price SSE Stream available on Hobby and Developer plans.'
        : 'This feature requires a paid addon. Please check your subscription plan.';

    // For streaming, don't show popup - it's handled in the widget
    if (feature !== 'streaming') {
      ApiErrorHandler.displayErrorMessage(errorMessage, 'addon-error');
    }

    // Log to console
    console.warn('Addon Error:', errorMessage);
  }

  static displayErrorMessage(
    message: string,
    type: 'error' | 'addon-error' | 'warning' = 'error'
  ): void {
    // Create or update error notification
    let notification = document.getElementById('api-error-notification');

    if (!notification) {
      notification = document.createElement('div');
      notification.id = 'api-error-notification';
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        max-width: 400px;
        padding: 16px 20px;
        border-radius: 8px;
        font-size: 14px;
        line-height: 1.4;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        transition: all 0.3s ease;
      `;
      document.body.appendChild(notification);
    }

    // Set styling based on error type
    if (type === 'addon-error') {
      notification.style.background = 'rgba(255, 193, 7, 0.1)';
      notification.style.borderLeft = '4px solid #ff9800';
      notification.style.color = '#ff9800';
      notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <strong>Addon Required</strong>
        </div>
        <div>${message}</div>
        <div style="margin-top: 12px;">
          <a href="https://charli3.io/api" target="_blank" rel="noopener noreferrer" 
             style="color: #ff9800; font-weight: 600; text-decoration: none;">
            Learn more about plans and addons
          </a>
        </div>
      `;
    } else if (type === 'warning') {
      notification.style.background = 'rgba(255, 193, 7, 0.1)';
      notification.style.borderLeft = '4px solid #ff9800';
      notification.style.color = '#ff9800';
      notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <strong>Warning:</strong>
          <div>${message}</div>
        </div>
      `;
    } else {
      notification.style.background = 'rgba(248, 81, 73, 0.1)';
      notification.style.borderLeft = '4px solid #f85149';
      notification.style.color = '#f85149';
      notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <strong>Error:</strong>
          <div>${message}</div>
        </div>
      `;
    }

    // Auto-hide after delay (longer for addon errors since they're more informational)
    const hideDelay = type === 'addon-error' ? 10000 : 5000;
    setTimeout(() => {
      if (notification && notification.parentNode) {
        notification.style.opacity = '0';
        setTimeout(() => {
          if (notification && notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }
    }, hideDelay);
  }

  static hideErrorMessage(): void {
    const notification = document.getElementById('api-error-notification');
    if (notification && notification.parentNode) {
      notification.style.opacity = '0';
      setTimeout(() => {
        if (notification && notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }
  }
}
