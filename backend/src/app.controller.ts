import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

/**
 * Exposes lightweight health-check style application endpoints.
 */
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * Return a base hello response.
   * @returns {string} Hello response
   */
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
