export class Formatters {
  static formatNumber(num: number): string {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
  }

  static formatPrice(price: number): string {
    if (price < 0.00001 && price > 0) {
      return price.toExponential(8);
    }
    if (price < 1 && price > 0) {
      return price.toFixed(8).replace(/\.?0+$/, '');
    }
    return price.toFixed(6).replace(/\.?0+$/, '');
  }

  static formatPercentage(value: number): string {
    const percentage = (value * 100).toFixed(2);
    return `${value >= 0 ? '+' : ''}${percentage}%`;
  }

  static getUserTimezone(): string {
    try {
      const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      console.log('🌍 Auto-detected timezone:', detectedTimezone);

      // Common supported timezones (subset of what's in config.ts)
      const supportedTimezones = [
        'UTC',
        'America/New_York',
        'America/Chicago',
        'America/Denver',
        'America/Phoenix',
        'America/Los_Angeles',
        'America/Anchorage',
        'America/Guayaquil',
        'America/Bogota',
        'America/Lima',
        'America/Mexico_City',
        'America/Sao_Paulo',
        'America/Argentina/Buenos_Aires',
        'Europe/London',
        'Europe/Paris',
        'Europe/Berlin',
        'Europe/Rome',
        'Europe/Madrid',
        'Europe/Amsterdam',
        'Europe/Zurich',
        'Asia/Tokyo',
        'Asia/Shanghai',
        'Asia/Hong_Kong',
        'Asia/Singapore',
        'Asia/Seoul',
        'Asia/Kolkata',
        'Asia/Dubai',
        'Australia/Sydney',
        'Australia/Melbourne',
        'Pacific/Auckland',
      ];

      // Check if detected timezone is in our supported list
      if (supportedTimezones.includes(detectedTimezone)) {
        console.log(
          '✅ Auto-detected timezone is supported:',
          detectedTimezone
        );
        return detectedTimezone;
      } else {
        console.warn(
          '⚠️ Auto-detected timezone not in supported list:',
          detectedTimezone
        );
        // Try to find a reasonable fallback based on detected timezone
        if (detectedTimezone.startsWith('America/')) {
          return 'America/New_York'; // Default to Eastern for American timezones
        } else if (detectedTimezone.startsWith('Europe/')) {
          return 'Europe/London'; // Default to London for European timezones
        } else if (detectedTimezone.startsWith('Asia/')) {
          return 'Asia/Tokyo'; // Default to Tokyo for Asian timezones
        } else {
          return 'UTC'; // Ultimate fallback
        }
      }
    } catch (error) {
      console.error('Error detecting user timezone:', error);
      return 'UTC';
    }
  }

  static parseDateInputToUTC(dateInputValue: string, timezone: string): number {
    try {
      // Parse the input value (format: "2023-12-01T15:30")
      // We need to interpret this as being in the specified timezone, then convert to UTC

      const [datePart, timePart] = dateInputValue.split('T');
      const [year, month, day] = datePart.split('-').map(Number);
      const [hours, minutes] = (timePart || '00:00').split(':').map(Number);

      // Create a date in the target timezone using a workaround
      // We'll create two dates: one interpreted as local, one as UTC, and use the difference

      const localDate = new Date(year, month - 1, day, hours, minutes);
      const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes));

      // Get what this date/time would be in the target timezone
      const targetFormatter = new Intl.DateTimeFormat('sv-SE', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });

      // Create a reference UTC date and see how it appears in the target timezone
      const referenceUTC = utcDate;
      const targetTimeString = targetFormatter.format(referenceUTC);
      const targetAsLocal = new Date(targetTimeString.replace(' ', 'T'));

      // Calculate the offset between UTC and target timezone
      const timezoneOffset = referenceUTC.getTime() - targetAsLocal.getTime();

      // Apply the reverse offset to get the UTC time that would display as our input time in the target timezone
      const correctedUTC = localDate.getTime() + timezoneOffset;
      const utcTimestamp = Math.floor(correctedUTC / 1000);

      console.log('📅 Date conversion:', {
        input: dateInputValue,
        timezone: timezone,
        inputAsLocal: localDate.toLocaleString(),
        utcTimestamp: utcTimestamp,
        utcTime: new Date(utcTimestamp * 1000).toUTCString(),
        shouldDisplayAs: new Date(utcTimestamp * 1000).toLocaleString('en-US', {
          timeZone: timezone,
        }),
      });

      return utcTimestamp;
    } catch (error) {
      console.error('Error parsing date input:', error);
      // Fallback to basic parsing
      return Math.floor(new Date(dateInputValue).getTime() / 1000);
    }
  }

  static formatDateForInput(date: Date, timezone: string): string {
    try {
      const formatter = new Intl.DateTimeFormat('sv-SE', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });

      const parts = formatter.formatToParts(date);
      const year = parts.find(part => part.type === 'year')?.value;
      const month = parts.find(part => part.type === 'month')?.value;
      const day = parts.find(part => part.type === 'day')?.value;
      const hour = parts.find(part => part.type === 'hour')?.value;
      const minute = parts.find(part => part.type === 'minute')?.value;

      return `${year}-${month}-${day}T${hour}:${minute}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hour = String(date.getHours()).padStart(2, '0');
      const minute = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hour}:${minute}`;
    }
  }
}
