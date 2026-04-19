import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: { user: { findUnique: jest.Mock; findMany: jest.Mock; count: jest.Mock; update: jest.Mock } };

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn(), findMany: jest.fn(), count: jest.fn(), update: jest.fn() },
    };

    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  describe('findMe', () => {
    it('returns user when found', async () => {
      const user = { id: 'u-1', email: 'a@b.com', name: 'Test' };
      prisma.user.findUnique.mockResolvedValue(user);

      expect(await service.findMe('u-1')).toEqual(user);
    });

    it('throws NotFoundException when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.findMe('u-x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('returns paginated results', async () => {
      prisma.user.findMany.mockResolvedValue([{ id: 'u-1' }]);
      prisma.user.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result).toEqual({ data: [{ id: 'u-1' }], total: 1, page: 1, limit: 10 });
      expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 0, take: 10 }));
    });
  });

  describe('updateMe', () => {
    it('updates and returns user', async () => {
      const updated = { id: 'u-1', name: 'New Name' };
      prisma.user.update.mockResolvedValue(updated);

      expect(await service.updateMe('u-1', { name: 'New Name' })).toEqual(updated);
    });
  });
});
