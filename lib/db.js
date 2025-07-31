import pg from 'pg';

let cachedClient = null;

export async function getClient() {
  if (cachedClient) return cachedClient;

  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  cachedClient = client;
  return client;
}