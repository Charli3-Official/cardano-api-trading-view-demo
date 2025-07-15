import { APP_CONFIG } from '../config.js';

export class APIQueue {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private activeRequests = 0;

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      void this.process();
    });
  }

  private async process() {
    if (
      this.processing ||
      this.activeRequests >= APP_CONFIG.MAX_CONCURRENT_REQUESTS
    )
      return;

    this.processing = true;
    while (
      this.queue.length > 0 &&
      this.activeRequests < APP_CONFIG.MAX_CONCURRENT_REQUESTS
    ) {
      const task = this.queue.shift();
      if (task) {
        this.activeRequests++;
        task()
          .finally(() => {
            this.activeRequests--;
            void this.process();
          })
          .catch(error => {
            console.error('Queue task failed:', error);
          });
      }
    }
    this.processing = false;
  }
}
