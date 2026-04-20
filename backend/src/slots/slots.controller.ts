import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { SlotsService } from './slots.service';
import { CreateSlotDto, QuerySlotsDto, UpdateSlotStatusDto, CancelDayDto } from './dto/slot.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { OptionalAuthGuard } from '../common/guards/optional-auth.guard';

@ApiTags('Slots')
@Controller('slots')
export class SlotsController {
  constructor(private readonly slotsService: SlotsService) {}

  @Get()
  @UseGuards(OptionalAuthGuard)
  @ApiOperation({ summary: 'List slots with filters (public, hides PENDING for anonymous)' })
  findAll(@Query() dto: QuerySlotsDto, @Req() req: { user?: unknown }) {
    return this.slotsService.findAll(dto, !!req.user);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a slot (admin/instructor)' })
  create(@Body() dto: CreateSlotDto) {
    return this.slotsService.create(dto);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Transition slot status' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSlotStatusDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.slotsService.updateStatus(id, dto, user.sub);
  }

  @Post('cancel-day')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel all slots for a day (admin)' })
  cancelDay(@Body() dto: CancelDayDto, @CurrentUser() user: { sub: string }) {
    return this.slotsService.cancelDay(dto, user.sub);
  }
}
