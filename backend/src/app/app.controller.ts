import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService, private readonly prisma: PrismaService) {}

  @Get()
  getData() {
    return this.appService.getData();
  }

  @Get('health')
  async health() {
    try {
      await this.prisma.$queryRawUnsafe('SELECT 1');
      return { status: 'ok', db: 'reachable', timestamp: new Date().toISOString() };
    } catch {
      return { status: 'error', db: 'unreachable', timestamp: new Date().toISOString() };
    }
  }
}
