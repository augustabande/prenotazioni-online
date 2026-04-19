import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JwksClient } from 'jwks-rsa';
import { decode, verify } from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

interface SupabasePayload {
  sub: string;
  email: string;
  user_metadata?: { full_name?: string };
}

@Injectable()
export class AuthService {
  private jwksClient: JwksClient;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {
    const supabaseUrl = this.config.getOrThrow<string>('SUPABASE_URL');
    this.jwksClient = new JwksClient({
      jwksUri: `${supabaseUrl}/auth/v1/.well-known/jwks.json`,
      cache: true,
      rateLimit: true,
    });
  }

  async verify(supabaseToken: string) {
    const payload = await this.validateSupabaseToken(supabaseToken);

    const user = await this.prisma.user.upsert({
      where: { email: payload.email },
      update: { supabaseId: payload.sub },
      create: {
        email: payload.email,
        name: payload.user_metadata?.full_name ?? payload.email.split('@')[0],
        role: Role.CUSTOMER,
        supabaseId: payload.sub,
      },
    });

    const token = await this.jwtService.signAsync(
      { sub: user.id, email: user.email, role: user.role },
      {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
        expiresIn: this.config.get('JWT_EXPIRES_IN', '1d'),
      },
    );

    return { accessToken: token, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
  }

  private async validateSupabaseToken(token: string): Promise<SupabasePayload> {
    try {
      const decoded = decode(token, { complete: true });
      if (!decoded?.header.kid) throw new Error('No kid in token header');

      const key = await this.jwksClient.getSigningKey(decoded.header.kid);
      const payload = verify(token, key.getPublicKey(), {
        algorithms: ['RS256'],
      }) as unknown as SupabasePayload;

      if (!payload.sub || !payload.email) throw new Error('Invalid payload');
      return payload;
    } catch {
      throw new UnauthorizedException('Invalid Supabase token');
    }
  }
}
