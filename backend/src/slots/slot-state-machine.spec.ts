import { SlotStatus } from '@prisma/client';
import { SlotStateMachine } from './slot-state-machine';

describe('SlotStateMachine', () => {
  describe('canTransition', () => {
    it('AVAILABLE → PENDING is valid', () => {
      expect(SlotStateMachine.canTransition(SlotStatus.AVAILABLE, SlotStatus.PENDING)).toBe(true);
    });

    it('PENDING → CONFIRMED is valid', () => {
      expect(SlotStateMachine.canTransition(SlotStatus.PENDING, SlotStatus.CONFIRMED)).toBe(true);
    });

    it('PENDING → CANCELLED_BY_WEATHER is valid', () => {
      expect(SlotStateMachine.canTransition(SlotStatus.PENDING, SlotStatus.CANCELLED_BY_WEATHER)).toBe(true);
    });

    it('PENDING → CANCELLED_BY_SCHOOL is valid', () => {
      expect(SlotStateMachine.canTransition(SlotStatus.PENDING, SlotStatus.CANCELLED_BY_SCHOOL)).toBe(true);
    });

    it('CONFIRMED → COMPLETED is valid', () => {
      expect(SlotStateMachine.canTransition(SlotStatus.CONFIRMED, SlotStatus.COMPLETED)).toBe(true);
    });

    it('CONFIRMED → CANCELLED_BY_WEATHER is valid', () => {
      expect(SlotStateMachine.canTransition(SlotStatus.CONFIRMED, SlotStatus.CANCELLED_BY_WEATHER)).toBe(true);
    });

    it('AVAILABLE → CONFIRMED is invalid', () => {
      expect(SlotStateMachine.canTransition(SlotStatus.AVAILABLE, SlotStatus.CONFIRMED)).toBe(false);
    });

    it('COMPLETED → anything is invalid', () => {
      expect(SlotStateMachine.canTransition(SlotStatus.COMPLETED, SlotStatus.AVAILABLE)).toBe(false);
      expect(SlotStateMachine.canTransition(SlotStatus.COMPLETED, SlotStatus.PENDING)).toBe(false);
    });

    it('CANCELLED_BY_WEATHER → anything is invalid', () => {
      expect(SlotStateMachine.canTransition(SlotStatus.CANCELLED_BY_WEATHER, SlotStatus.AVAILABLE)).toBe(false);
    });

    it('CANCELLED_BY_SCHOOL → anything is invalid', () => {
      expect(SlotStateMachine.canTransition(SlotStatus.CANCELLED_BY_SCHOOL, SlotStatus.PENDING)).toBe(false);
    });
  });

  describe('assertTransition', () => {
    it('throws on invalid transition', () => {
      expect(() =>
        SlotStateMachine.assertTransition(SlotStatus.AVAILABLE, SlotStatus.COMPLETED),
      ).toThrow('Invalid transition');
    });

    it('does not throw on valid transition', () => {
      expect(() =>
        SlotStateMachine.assertTransition(SlotStatus.AVAILABLE, SlotStatus.PENDING),
      ).not.toThrow();
    });
  });
});
