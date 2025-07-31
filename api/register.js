import { getClient } from '../lib/db.js';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body;

  try {
    const client = await getClient();

    // 自动创建 users 表（如果不存在）
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const existing = await client.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: '该邮箱已注册' });
    }

    const hashed = await bcrypt.hash(password, 10);

    await client.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2)',
      [email, hashed]
    );

    return res.status(200).json({ message: '注册成功' });
  } catch (error) {
    console.error('注册错误:', error);
    return res.status(500).json({ error: '服务器错误，请稍后再试' });
  }
}