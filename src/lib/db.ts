/*
 * Copyright (c) 2026 Ayon Sarkar. All Rights Reserved.
 *
 * This source code is licensed under the terms found in the
 * LICENSE file in the root directory of this source tree.
 *
 * USE FOR EVALUATION ONLY. NO PRODUCTION USE OR COPYING PERMITTED.
 */

import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'stockexchange',
  user: process.env.DB_USER || 'myuser',
  password: process.env.DB_PASSWORD || 'mypassword',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export default pool;
