// version-00.02.01
const express = require('express');
const bcrypt = require('bcrypt');
const cors = require('cors');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); // 允许前端访问
app.use(express.json());

// 注册接口
app.post('/signup', async (req, res) => {
  const { email, password, confirmPassword } = req.body;

  if (!email || !password || !confirmPassword) {
    return res.status(400).json({ error: '所有字段均为必填' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: '两次输入的密码不一致' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  db.run(
    'INSERT INTO users (email, password) VALUES (?, ?)',
    [email, hashedPassword],
    function (err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint')) {
          return res.status(400).json({ error: '该邮箱已注册' });
        }
        return res.status(500).json({ error: '服务器内部错误，请稍后再试' });
      }
      res.status(201).json({ message: '注册成功！' });
    }
  );
});

// 删除用户接口
app.delete('/closeaccount', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: '缺少邮箱或密码' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) return res.status(500).json({ error: '数据库错误' });
    if (!user) return res.status(404).json({ error: '用户不存在' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: '密码错误，删除失败' });

    db.run('DELETE FROM users WHERE email = ?', [email], (err) => {
      if (err) return res.status(500).json({ error: '删除失败' });
      res.json({ message: '用户已删除' });
    });
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server is running at http://localhost:${PORT}`);
});