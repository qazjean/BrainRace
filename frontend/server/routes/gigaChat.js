const express = require('express');
const axios = require('axios');
const router = express.Router();
require('dotenv').config();

// Конфигурация GigaChat API
const GIGACHAT_API_URL = 'https://gigachat.devices.sberbank.ru/api/v1/chat/completions';

// Кэш для советов
const adviceCache = new Map();

// Функция для получения нового токена
async function getGigaChatToken() {
  try {
    const response = await axios.post(
      'https://ngw.devices.sberbank.ru:9443/api/v2/oauth',
      'scope=GIGACHAT_API_PERS',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'Authorization': `Bearer ${process.env.GIGACHAT_TOKEN}`,
        }
      }
    );

    return response.data.access_token;
  } catch (error) {
    console.error('Ошибка получения токена:', error.response?.data || error.message);
    throw error;
  }
}

// Генерация персонализированных советов на основе статистики
router.post('/advice', async (req, res) => {
  try {
    const { stats, sessions = [], gameStats = {} } = req.body;

    // Проверяем кэш
    const cacheKey = JSON.stringify({ stats, sessions: sessions.length, gameStats });
    if (adviceCache.has(cacheKey)) {
      const cached = adviceCache.get(cacheKey);
      if (Date.now() - cached.timestamp < 3600000) { // 1 час кэша
        return res.json({
          advice: cached.advice,
          insights: cached.insights
        });
      }
    }

    // Получаем токен
    const token = await getGigaChatToken();

    // Анализируем статистику
    const totalGames = stats?.totalGames || sessions.length;
    const accuracy = stats?.avgAccuracy || 70;
    const streak = stats?.streak || 0;

    // Определяем сильные и слабые стороны
    const gameEntries = Object.entries(gameStats);
    let strongestGame = '';
    let weakestGame = '';
    let bestAccuracy = 0;
    let worstAccuracy = 100;

    gameEntries.forEach(([game, data]) => {
      if (data.accuracy > bestAccuracy) {
        bestAccuracy = data.accuracy;
        strongestGame = game;
      }
      if (data.accuracy < worstAccuracy) {
        worstAccuracy = data.accuracy;
        weakestGame = game;
      }
    });

    // Формируем промпт для ИИ
    const prompt = `
      Анализируй статистику игрока в когнитивных играх и дай персонализированные рекомендации.

      Статистика:
      - Всего игр: ${totalGames}
      - Средняя точность: ${accuracy}%
      - Дней подряд: ${streak}
      - Любимая игра: ${strongestGame || 'не определена'}
      - Слабая игра: ${weakestGame || 'не определена'}

      Статистика по играм:
      ${gameEntries.map(([game, data]) =>
        `- ${game}: ${data.accuracy || 0}% точность, ${data.count || 0} игр, средний счет: ${data.avgScore || 0}`
      ).join('\n')}

      Дай 7-10 конкретных, полезных советов для улучшения когнитивных навыков на русском языке.
      Советы должны быть:
      1. Практическими и выполнимыми
      2. Ориентированными на конкретные игры
      3. Включать временные рекомендации
      4. Учитывать текущую статистику игрока
      5. Быть мотивирующими и поддерживающими

      Также сгенерируй 3 аналитических инсайта на основе статистики (формат JSON).

      Верни в формате:
      {
        "advice": "совет 1\\nсовет 2\\n...",
        "insights": [
          {"title": "заголовок", "description": "описание", "value": "значение", "icon": "эмодзи"},
          ...
        ]
      }
    `;

    const response = await axios.post(
      GIGACHAT_API_URL,
      {
        model: 'GigaChat',
        messages: [
          {
            role: 'system',
            content: 'Ты - опытный когнитивный психолог и тренер. Ты анализируешь статистику игр и даешь персонализированные рекомендации для развития мозга. Твои советы конкретные, научно обоснованные и мотивирующие.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 1500
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    let aiResponse;
    try {
      aiResponse = JSON.parse(response.data.choices[0].message.content);
    } catch (e) {
      // Если ИИ не вернул JSON, парсим текстовый ответ
      const text = response.data.choices[0].message.content;
      const adviceLines = text.split('\n').filter(line =>
        line.trim() && !line.includes('{') && !line.includes('}') && line.length > 20
      ).slice(0, 8);

      aiResponse = {
        advice: adviceLines.join('\n'),
        insights: generateFallbackInsights(stats, gameStats)
      };
    }

    // Сохраняем в кэш
    adviceCache.set(cacheKey, {
      advice: aiResponse.advice,
      insights: aiResponse.insights,
      timestamp: Date.now()
    });

    res.json({
      advice: aiResponse.advice,
      insights: aiResponse.insights
    });

  } catch (error) {
    console.error('Ошибка GigaChat API:', error.response?.data || error.message);

    // Фолбэк советы
    const fallbackAdvice = generateFallbackAdvice(req.body);
    const fallbackInsights = generateFallbackInsights(req.body.stats, req.body.gameStats);

    res.json({
      advice: fallbackAdvice,
      insights: fallbackInsights
    });
  }
});

// Функция генерации фолбэк советов
function generateFallbackAdvice(data) {
  const { stats = {}, gameStats = {} } = data;
  const totalGames = stats.totalGames || 0;
  const accuracy = stats.avgAccuracy || 70;
  const streak = stats.streak || 0;

  const advice = [
    "🎯 Начните тренировки с игр на скорость реакции - это активирует мозг и улучшает концентрацию",
    "📈 Увеличьте время тренировок по вечерам с 18:00 до 20:00 - в это время когнитивные функции на пике",
    "🧠 Чередуйте игры на логику и память через день для сбалансированного развития нейронных сетей",
    "⚡ Повышайте уровень сложности постепенно - переходите на следующий уровень при достижении 80% точности",
    "💡 Делайте 30-секундные перерывы между играми для консолидации памяти и снижения умственной усталости",
    "🎮 Играйте в '