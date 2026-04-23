import { Injectable } from '@nestjs/common';

/**
 * Provides base application service operations.
 */
@Injectable()
export class AppService {
  /**
   * Build hello response for root endpoint.
   * @returns {string} Hello response string
   */
  getHello(): string {
    return 'Hello World!';
  }
}
