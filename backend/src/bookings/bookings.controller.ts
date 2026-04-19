import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { BookingsService } from './bookings.service';
import { CreateBookingDto, RescheduleBookingDto } from './dto/booking.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Bookings')
@Controller('bookings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a booking (customer)' })
  create(@Body() dto: CreateBookingDto, @CurrentUser() user: { sub: string }) {
    return this.bookingsService.create(dto, user.sub);
  }

  @Get('mine')
  @ApiOperation({ summary: 'Get my bookings' })
  findMine(@CurrentUser() user: { sub: string }) {
    return this.bookingsService.findMine(user.sub);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'List all bookings (admin)' })
  findAll() {
    return this.bookingsService.findAll();
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a booking' })
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { sub: string; role: Role },
  ) {
    return this.bookingsService.cancel(id, user.sub, user.role === Role.ADMIN);
  }

  @Post(':id/reschedule')
  @ApiOperation({ summary: 'Reschedule a booking to a new slot' })
  reschedule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RescheduleBookingDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.bookingsService.reschedule(id, dto, user.sub);
  }
}
