import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

function extractDbName(url?: string): string {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    return parsed.pathname.replace(/^\//, '').split('?')[0].toLowerCase();
  } catch {
    return '';
  }
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    if (process.env.NODE_ENV === 'test') {
      const testDbUrl = process.env.TEST_DATABASE_URL;
      if (!testDbUrl || testDbUrl.trim().length === 0) {
        throw new Error(
          'FATAL: TEST_DATABASE_URL environment variable is missing or empty. Integration tests must not run against development or production databases.',
        );
      }

      const testDbName = extractDbName(testDbUrl);
      if (testDbName === 'orbit_dev' || testDbName === 'orbit_prod') {
        throw new Error(
          `FATAL: TEST_DATABASE_URL points to protected database '${testDbName}'. Integration tests require a dedicated test database (e.g. orbit_test).`,
        );
      }

      super({
        datasources: {
          db: {
            url: testDbUrl,
          },
        },
      });
    } else {
      super();
    }
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
