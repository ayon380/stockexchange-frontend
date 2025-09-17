import Redis from 'ioredis';
// import dotenv from 'dotenv';

// Load environment variables
// dotenv.config();

const redis = new Redis({
  host:  'localhost',
  port: 6379,
  // password: 'your_redis_password',
  db: 0,
});

async function readRedisKeys() {
  try {
    console.log('🔍 Reading Redis keys from login endpoint...\n');

    // Get all keys
    const allKeys = await redis.keys('*');
    console.log(`📊 Total keys in Redis: ${allKeys.length}\n`);

    // Filter keys related to login endpoint
    const loginKeys = allKeys.filter(key =>
      key.startsWith('trading:') || key.startsWith('user:') && key.includes(':trading')
    );

    console.log(`🔑 Login-related keys found: ${loginKeys.length}\n`);

    if (loginKeys.length === 0) {
      console.log('❌ No login-related keys found in Redis.');
      console.log('💡 Try logging in first to create session data.');
      return;
    }

    // Read each key and its value
    for (const key of loginKeys) {
      try {
        const value = await redis.get(key);
        const ttl = await redis.ttl(key);

        console.log(`🔑 Key: ${key}`);
        console.log(`⏰ TTL: ${ttl} seconds`);

        if (key.startsWith('trading:')) {
          // This key stores user_id (UUID)
          console.log('👤 User ID (UUID):', value);
        } else if (key.startsWith('user:') && key.includes(':trading')) {
          // This key stores trading token
          console.log('🔐 Trading Token:', value);
        } else {
          console.log('📦 Value:', value);
        }

        console.log('─'.repeat(50));
      } catch (error) {
        console.error(`❌ Error reading key ${key}:`, error.message);
      }
    }

    // Summary
    const tradingKeys = loginKeys.filter(key => key.startsWith('trading:'));
    const userKeys = loginKeys.filter(key => key.startsWith('user:') && key.includes(':trading'));

    console.log('\n📈 Summary:');
    console.log(`   Trading token keys: ${tradingKeys.length}`);
    console.log(`   User trading mapping keys: ${userKeys.length}`);

  } catch (error) {
    console.error('❌ Error connecting to Redis:', error.message);
  } finally {
    redis.disconnect();
  }
}

// Run the script
readRedisKeys().catch(console.error);