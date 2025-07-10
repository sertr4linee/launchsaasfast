/**
 * Simple test script to verify Redis client functionality
 * Run with: npx tsx scripts/test-redis.ts
 */
import { redis } from '../lib/redis';

async function testRedisClient() {
  console.log('🔧 Testing Redis client...');

  try {
    // Test basic connectivity
    console.log('1. Testing ping...');
    const pingResult = await redis.ping();
    console.log('✅ Ping result:', pingResult);

    // Test basic set/get
    console.log('2. Testing set/get...');
    await redis.set('test:key', 'test-value', 60);
    const value = await redis.get('test:key');
    console.log('✅ Set/Get result:', value);

    // Test sorted set operations for rate limiting
    console.log('3. Testing sorted set operations...');
    const now = Date.now();
    await redis.zadd('test:zset', now, `member-${now}`);
    const count = await redis.zcard('test:zset');
    console.log('✅ ZADD/ZCARD result:', count);

    // Test cleanup
    console.log('4. Testing cleanup...');
    await redis.del('test:key', 'test:zset');
    console.log('✅ Cleanup completed');

    // Test health status
    console.log('5. Testing health status...');
    const health = redis.getHealthStatus();
    console.log('✅ Health status:', health);

    console.log('🎉 All Redis tests passed!');
  } catch (error) {
    console.error('❌ Redis test failed:', error);
    throw error;
  }
}

if (require.main === module) {
  testRedisClient()
    .then(() => {
      console.log('✅ Test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test failed:', error);
      process.exit(1);
    });
}
