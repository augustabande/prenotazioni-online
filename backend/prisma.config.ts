import path from 'node:path';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  earlyAccess: true,
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),
  datasource: {
    url: process.env['DATABASE_URL'] ?? 'postgresql://kite:kite@localhost:5432/kite_booking',
  },
  migrations: {
    seed: 'npx ts-node --compiler-options {"module":"CommonJS"} backend/prisma/seed.ts',
  },
});
