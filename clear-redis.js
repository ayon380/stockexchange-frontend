/*
 * Copyright (c) 2026 Ayon Sarkar. All Rights Reserved.
 *
 * This source code is licensed under the terms found in the
 * LICENSE file in the root directory of this source tree.
 *
 * USE FOR EVALUATION ONLY. NO PRODUCTION USE OR COPYING PERMITTED.
 */

import Redis from 'ioredis';

// --- Configuration ---
// For a local Redis server, you might not need any arguments: new Redis()
// For a remote server or specific credentials, use a connection string.
const redis = new Redis('redis://127.0.0.1:6379');

async function clearAllData() {
  console.log('Connecting to Redis...');

  redis.on('error', (err) => {
    console.error('Redis connection error:', err);
  });

  try {
    await redis.ping(); // Check if the connection is alive
    console.log('Connection successful. Sending FLUSHALL command...');

    // To delete keys from ALL databases:
    await redis.flushall();

    // To delete keys from ONLY the current database, use this instead:
    // await redis.flushdb();

    console.log('✅ Success! All keys have been cleared from the Redis server.');

  } catch (error) {
    console.error('❌ An error occurred:', error);
  } finally {
    // Close the connection
    redis.disconnect();
    console.log('Connection closed.');
  }
}

clearAllData();