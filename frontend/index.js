const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const generateTask = require('./routes/generateTask');
const analyzeResults = require('./routes/analyzeResults');
const profile = require('./routes/profile');
const gigaChat = require('./routes/gigaChat');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/generate-task', generateTask);
app.use('/api/analyze-results', analyzeResults);
app.use('/api/profile', profile);
app.use('/api/giga', gigaChat);

// Статистика
app.get('/api/stats', (req, res) => {
  res.json({
    totalUsers: 1234,
    activeToday: 89,
    totalGames: 5678,
    avgScore: 245
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Что-то пошло не так!' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`🔗 http://localhost:${PORT}`);
});