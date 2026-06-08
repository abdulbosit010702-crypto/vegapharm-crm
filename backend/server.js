require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Bot } = require('grammy');

const app = express();
app.use(cors());
app.use(express.json());

// Подключение к нашей базе данных PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Проверка подключения к базе при старте
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Ошибка подключения к базе данных:', err.stack);
  }
  console.log('Бэкенд успешно подключился к базе данных PostgreSQL!');
  release();
});

// Настройка Телеграм-бота
const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);

// Команда /start для бота
bot.command("start", (ctx) => {
  ctx.reply("Добро пожаловать в VegaPharm CRM", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "Открыть кабинет", web_app: { url: "https://google.com" } }] 
        // Вместо google.com потом вставим адрес нашего Mini App
      ]
    }
  });
});

// Запуск бота в фоновом режиме
bot.start().catch(err => console.error('Ошибка запуска Телеграм-бота:', err));

// --- НАШИ API МАРШРУТЫ (ЭНДПОИНТЫ) ---

// 1. Вход в систему (Авторизация)
app.post('/api/auth/login', async (req, res) => {
  const { login, password } = req.body;
  try {
    const userRes = await pool.query(
      `SELECT u.*, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.username = $1`, 
      [login]
    );
    if (userRes.rows.length === 0) return res.status(400).json({ message: 'Пользователь не найден' });
    
    const user = userRes.rows[0];
    // Проверка пароля (в базе он хранится в зашифрованном виде)
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ message: 'Неверный пароль' });

    const token = jwt.sign({ id: user.id, role: user.role_name }, process.env.JWT_SECRET, { expiresIn: '12h' });
    
    res.json({
      token,
      user: {
        id: user.id,
        fio: user.fio,
        role: user.role_name,
        region_id: user.region_id,
        city_id: user.city_id,
        product_group_id: user.product_group_id
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Получение списка аптек для конкретного медпреда
app.get('/api/pharmacies', async (req, res) => {
  const userId = req.query.userId;
  try {
    const data = await pool.query('SELECT * FROM pharmacies WHERE user_id = $1', [userId]);
    res.json(data.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Получение списка препаратов по группе медпреда
app.get('/api/products', async (req, res) => {
  const groupId = req.query.groupId;
  try {
    const data = await pool.query('SELECT * FROM products WHERE group_id = $1 AND stock > 0', [groupId]);
    res.json(data.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Запуск самого веб-сервера
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Сервер бэкенда запущен и слушает порт ${PORT}`));