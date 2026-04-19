import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { PrismaService } from '../prisma/prisma.service';

describe('LessonsService', () => {
  let service: LessonsService;
  let prisma: { lessonType: { findMany: jest.Mock; findUnique: jest.Mock; create: jest.Mock; update: jest.Mock } };

  beforeEach(async () => {
    prisma = {
      lessonType: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    };

    const module = await Test.createTestingModule({
      providers: [
        LessonsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(LessonsService);
  });

  describe('findAllActive', () => {
    it('returns only active lesson types', async () => {
      prisma.lessonType.findMany.mockResolvedValue([{ id: 'lt-1', active: true }]);
      const result = await service.findAllActive();
      expect(result).toHaveLength(1);
      expect(prisma.lessonType.findMany).toHaveBeenCalledWith({ where: { active: true } });
    });
  });

  describe('findOne', () => {
    it('returns lesson type when found', async () => {
      prisma.lessonType.findUnique.mockResolvedValue({ id: 'lt-1' });
      expect(await service.findOne('lt-1')).toEqual({ id: 'lt-1' });
    });

    it('throws NotFoundException when not found', async () => {
      prisma.lessonType.findUnique.mockResolvedValue(null);
      await expect(service.findOne('lt-x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates a lesson type', async () => {
      const dto = { code: 'TEST', title: 'Test', description: 'Desc', durationMinutes: 60, minParticipants: 1, maxParticipants: 2, pricePerPerson: 100, requiredWindKnotsMin: 10, requiredWindKnotsMax: 25 };
      prisma.lessonType.create.mockResolvedValue({ id: 'lt-new', ...dto });

      const result = await service.create(dto);
      expect(result.code).toBe('TEST');
    });
  });

  describe('remove', () => {
    it('soft-deletes by setting active to false', async () => {
      prisma.lessonType.findUnique.mockResolvedValue({ id: 'lt-1' });
      prisma.lessonType.update.mockResolvedValue({ id: 'lt-1', active: false });

      const result = await service.remove('lt-1');
      expect(result.active).toBe(false);
      expect(prisma.lessonType.update).toHaveBeenCalledWith({ where: { id: 'lt-1' }, data: { active: false } });
    });
  });
});
