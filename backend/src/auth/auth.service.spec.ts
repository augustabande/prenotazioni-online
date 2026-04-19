import { Test } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

jest.mock('jwks-rsa', () => ({
  JwksClient: jest.fn().mockImplementation(() => ({
    getSigningKey: jest.fn().mockResolvedValue({ getPublicKey: () => 'mock-key' }),
  })),
}));

jest.mock('jsonwebtoken', () => ({
  decode: jest.fn().mockReturnValue({ header: { kid: 'kid-1' }, payload: {} }),
  verify: jest.fn().mockReturnValue({ sub: 'sup-1', email: 'test@test.com', user_metadata: { full_name: 'Test User' } }),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prisma: { user: { upsert: jest.Mock } };
  let jwt: { signAsync: jest.Mock };

  beforeEach(async () => {
    prisma = { user: { upsert: jest.fn() } };
    jwt = { signAsync: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
        { provide: ConfigService, useValue: { getOrThrow: (k: string) => k === 'SUPABASE_URL' ? 'https://test.supabase.co' : 'jwt-secret', get: () => '1d' } },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('returns accessToken and user on valid supabase token', async () => {
    const mockUser = { id: 'u-1', email: 'test@test.com', name: 'Test User', role: Role.CUSTOMER };
    prisma.user.upsert.mockResolvedValue(mockUser);
    jwt.signAsync.mockResolvedValue('internal-jwt');

    const result = await service.verify('valid-supabase-token');

    expect(prisma.user.upsert).toHaveBeenCalled();
    expect(jwt.signAsync).toHaveBeenCalled();
    expect(result).toEqual({
      accessToken: 'internal-jwt',
      user: { id: 'u-1', email: 'test@test.com', name: 'Test User', role: Role.CUSTOMER },
    });
  });

  it('throws UnauthorizedException on invalid token', async () => {
    const { verify } = require('jsonwebtoken');
    verify.mockImplementationOnce(() => { throw new Error('bad'); });

    await expect(service.verify('bad-token')).rejects.toThrow(UnauthorizedException);
  });
});
