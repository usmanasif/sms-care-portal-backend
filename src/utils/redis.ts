import redis from 'redis';
import { REDIS_URL } from './config';

const redisClient = redis.createClient({
  url: REDIS_URL,
});

redisClient.on('connect', () => {
  console.log('redis client connected');
});

redisClient.on('error', (error) => {
  console.error(error);
});

export const setKey = (key: string, value: string) => new Promise((resolve, reject) => {
  redisClient.set(key, value, (error) => {
    if (error) return reject(error);

    return resolve(null);
  });
});

export const getKey = (key: string) => new Promise((resolve, reject) => {
  redisClient.get(key, (error, value) => {
    if (error) return reject(error);

    return resolve(value);
  });
});

export const setKeyWithExpiry = (key: string, value: string, mode: string, duration: number) => new Promise((resolve, reject) => {
  redisClient.set(key, value, mode, duration, (error) => {
    if (error) return reject(error);

    return resolve(null);
  });
});
