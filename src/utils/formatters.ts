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
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (error) {
      console.error('Error detecting user timezone:', error);
      return 'America/Chicago';
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
