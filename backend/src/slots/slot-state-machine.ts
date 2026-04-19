import { BadRequestException } from '@nestjs/common';
import { SlotStatus } from '@prisma/client';

const TRANSITIONS: Record<SlotStatus, SlotStatus[]> = {
  [SlotStatus.AVAILABLE]: [SlotStatus.PENDING],
  [SlotStatus.PENDING]: [
    SlotStatus.CONFIRMED,
    SlotStatus.CANCELLED_BY_WEATHER,
    SlotStatus.CANCELLED_BY_SCHOOL,
  ],
  [SlotStatus.CONFIRMED]: [
    SlotStatus.CANCELLED_BY_WEATHER,
    SlotStatus.COMPLETED,
  ],
  [SlotStatus.CANCELLED_BY_WEATHER]: [],
  [SlotStatus.CANCELLED_BY_SCHOOL]: [],
  [SlotStatus.COMPLETED]: [],
};

export class SlotStateMachine {
  static canTransition(from: SlotStatus, to: SlotStatus): boolean {
    return TRANSITIONS[from]?.includes(to) ?? false;
  }

  static assertTransition(from: SlotStatus, to: SlotStatus): void {
    if (!this.canTransition(from, to)) {
      throw new BadRequestException(`Invalid transition: ${from} → ${to}`);
    }
  }
}
