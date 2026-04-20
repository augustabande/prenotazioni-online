import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { OpenMeteoService } from './open-meteo.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Weather')
@Controller('weather')
export class WeatherController {
  constructor(
    private readonly meteo: OpenMeteoService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('forecast')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get 48h wind forecast for primary location' })
  async getForecast(@Query('hours') hours?: string) {
    const location = await this.prisma.location.findFirst();
    if (!location) return [];
    const now = new Date();
    const h = parseInt(hours || '48', 10);
    const to = new Date(now.getTime() + h * 3_600_000);
    return this.meteo.getWindForecast(location.lat, location.lng, now.toISOString(), to.toISOString());
  }
}
