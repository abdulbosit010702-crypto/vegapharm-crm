require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
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

// Автоматически определяем адрес нашего приложения на Render
// Если переменная RENDER_EXTERNAL_URL не задана, используем заглушку
const APP_URL = process.env.RENDER_EXTERNAL_URL || "https://vegapharm-crm.onrender.com";

// Команда /start для бота — теперь ведет на наш реальный экран входа!
bot.command("start", (ctx) => {
  ctx.reply("Добро пожаловать в VegaPharm CRM. Нажмите кнопку ниже, чтобы войти в личный кабинет.", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "Открыть кабинет", web_app: { url: APP_URL } }] 
      ]
    }
  });
});

// Запуск бота в фоновом режиме
bot.start().catch(err => console.error('Ошибка запуска Телеграм-бота:', err));

// --- РАЗДАЧА ИНТЕРФЕЙСА (ФРОНТЕНД) ---

// Заставляем сервер отдавать файл index.html, который лежит в папке backend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});


// --- НАШИ API МАРШРУТЫ (ЭНДПОИНТЫ) ---

// API для создания нового медицинского представителя из панели администратора
app.post('/api/create-user', async (req, res) => {
  const { name, login, pass, group } = req.body;
  
  try {
    // Хешируем (шифруем) пароль сотрудника для безопасности
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(pass, salt);

    // Вставляем сотрудника в базу данных PostgreSQL
    // (Убедись, что структура таблиц в БД соответствует этим колонкам)
    await pool.query(
      `INSERT INTO users (fio, username, password_hash, product_group_name) VALUES ($1, $2, $3, $4)`,
      [name, login, passwordHash, group]
    );

    res.status(201).json({ success: true, message: 'Сотрудник успешно создан!' });
  } catch (err) {
    console.error('Ошибка при создании пользователя:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 1. Вход в систему (Авторизация обычных медпредов)
app.post('/api/auth/login', async (req, res) => {
  const { login, password } = req.body;
  try {
    const userRes = await pool.query(
      `SELECT * FROM users WHERE username = $1`, 
      [login]
    );
    if (userRes.rows.length === 0) return res.status(400).json({ message: 'Пользователь не найден' });
    
    const user = userRes.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ message: 'Неверный пароль' });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'SECRET_KEY', { expiresIn: '12h' });
    
    res.json({
      token,
      user: {
        id: user.id,
        fio: user.fio,
        group: user.product_group_name
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

// Запуск веб-сервера
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Сервер бэкенда запущен и слушает порт ${PORT}`));
