import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { RedisStore } from 'cache-manager-redis-store';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);
  private readonly redisStore!: RedisStore;
  constructor(@Inject(CACHE_MANAGER) cache: Cache) {
    this.redisStore = <RedisStore>(<unknown>cache.store);
  }

  /**
   * Get the cache result
   * @param {string} key The key for cache result
   * @returns {Promise<T | null>} The Cache Response
   */
  public async get<T>(key: string): Promise<T | null> {
    const client = this.redisStore.getClient();
    const raw = await client.GET(key);
    return raw ? <T>JSON.parse(raw) : null;
  }

  /**
   * Set the value
   * @param {string} key The key used for cache the value
   * @param {object} value The value to be cache
   * @param [ttl=300] The time to live in seconds for the value.
   * @returns {Promise<boolean>} The Cache Response
   */
  public async set<T extends object>(
    key: string,
    value: T,
    ttl = 300,
  ): Promise<boolean> {
    try {
      const client = this.redisStore.getClient();
      await client.SETEX(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      this.logger.error('Failed to perform set operation on data', error);
      return false;
    }
  }

  /**
   * Hset a value
   * @param {string} key The key of the hset
   * @param {string} field The field of the hset
   * @param {object} value The value to be cached
   * @returns {Promise<boolean>} The Cache Response
   */
  public async hset<T extends object>(
    key: string,
    field: string,
    value: T,
  ): Promise<boolean> {
    try {
      const client = this.redisStore.getClient();
      await client.HSET(key, field, JSON.stringify(value));
      return true;
    } catch (error) {
      this.logger.error('Failed to perform hset operation on data', error);
      return false;
    }
  }

  /**
   * Delete the cache result
   * @param {string} key The key for delete cache result
   * @returns {Promise<boolean>} The Cache Response
   */
  public async delete(key: string): Promise<boolean> {
    try {
      const client = this.redisStore.getClient();
      await client.DEL(key);
      return true;
    } catch (error) {
      this.logger.error('Failed to perform delete operation on data', error);
      return false;
    }
  }

  /**
   * Add one or more members to a sorted set
   * @param {string} key The key of the sorted set
   * @param {number} score The score of the member
   * @param {string} member The member to be added
   * @returns {Promise<number | null>} The number of elements added to the sorted set
   */
  public async zadd(
    key: string,
    score: number,
    member: string,
  ): Promise<number | null> {
    try {
      const client = this.redisStore.getClient();
      return await client.ZADD(key, { score, value: member });
    } catch (error) {
      this.logger.error('Failed to perform zadd operation on data', error);
      return null;
    }
  }

  /**
   * Retrieve a range of members from a sorted set, ordered from the highest to the lowest score
   * @param {string} key The key of the sorted set
   * @param {number} start The start index of the range
   * @param {number} stop The stop index of the range
   * @returns {Promise<string[] | null>} The array of members and their associated scores
   */
  public async zrevrange(
    key: string,
    start: number,
    stop: number,
  ): Promise<string[] | null> {
    try {
      const client = this.redisStore.getClient();
      return await client.ZRANGE(key, start, stop, { REV: true });
    } catch (error) {
      this.logger.error('Failed to perform zrevrange operation on data', error);
      return null;
    }
  }

  /**
   * Check if a cached result is expired
   * @param key The key for checking if the cache exist
   * @returns {Promise<boolean>} The Cache Expiry Response
   */
  public async isExpired<T>(key: string): Promise<boolean> {
    return !(await this.get<T>(key));
  }

  /**
   * Ping redis
   * @returns {Promise<string>} The Redis PIng Response
   */
  public async ping(): Promise<string> {
    const client = this.redisStore.getClient();
    return client.PING();
  }
}
