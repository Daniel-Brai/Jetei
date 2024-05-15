import { CacheModuleAsyncOptions } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-store';

export const RedisOptions: CacheModuleAsyncOptions = {
  isGlobal: true,
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => {
    const store = await redisStore({
      pingInterval: 5000,
      socket: {
        connectTimeout: 4000,
        host: configService.getOrThrow<string>('REDIS_HOST'),
        port: parseInt(configService.getOrThrow<string>('REDIS_PORT'), 10),
      },
    });
    return {
      store: () => store,
    };
  },
  inject: [ConfigService],
};
