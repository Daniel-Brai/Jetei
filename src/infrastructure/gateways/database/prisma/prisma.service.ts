import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Database connection successfully initialized');
    } catch (e) {
      this.logger.error('Database connection failed', {
        message: `${e?.message}`,
      });
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      this.logger.log('Database disconnection successful');
    } catch (e) {
      this.logger.error('Database disconnection failed', {
        message: `${e?.message}`,
      });
    }
  }
}
