const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const router = express.Router();
const DATA_PATH = path.join(__dirname, '../data/profile.json');

const gameNames = {
  'speed': '⚡ Скорость реакции',
  'logic': '🧠 Логическая проверка',
  'odd': '🔍 Лишний предмет',
  'analogy': '🔄 Охота за аналогиями',
  'memory': '💾 Вспышка памяти'
};

const gameColors = {
  'speed': '#4f46e5',
  'logic': '#10b981',
  'odd': '#f59e0b',
  'analogy': '#ec4899',
  'memory': '#8b5cf6'
};

async function initProfile() {
  const exists = await fs.pathExists(DATA_PATH);
  if (!exists) {
    await fs.writeJson(DATA_PATH, {
      sessions: [],
      stats: {
        totalGames: 0,
        totalScore: 0,
        bestScore: 0,
        avgAccuracy: 0,
        favoriteGame: '',
        streak: 0,
        totalCorrect: 0,
        totalQuestions: 0
      }
    });
  }
}
const normalizeGameName = game => {
  const map = {
    speed: 'speed',
    speed_reaction: 'speed',

    logic: 'logic',
    logic_quiz: 'logic',

    odd: 'odd',
    odd_one_out: 'odd',

    analogy: 'analogy',
    analogies: 'analogy',

    memory: 'memory',
    memory_train: 'memory'
  };

  return map[game] || game;
};

// Расчет статистики по играм (ВСЕ ИГРЫ, не только последние)
function calculateGameStats(sessions) {
  const gameStats = {};

  // Группируем сессии по играм
  const sessionsByGame = {};
  const game = normalizeGameName(session.game);

  if (!sessionsByGame[game]) {
    sessionsByGame[game] = [];
  }
  sessionsByGame[game].push({
    ...session,
    game
  });


  // Рассчитываем статистику для каждой игры
  Object.keys(sessionsByGame).forEach(game => {
    const gameSessions = sessionsByGame[game];
    const totalSessions = gameSessions.length;

    // Считаем правильные и неправильные ответы
    let totalCorrect = 0;
    let totalIncorrect = 0;
    let totalScore = 0;
    let bestScore = 0;

    gameSessions.forEach(session => {
      const correct = session.correct || 0;
      const incorrect = session.incorrect || 0;
      const score = session.score || 0;

      totalCorrect += correct;
      totalIncorrect += incorrect;
      totalScore += score;

      if (score > bestScore) {
        bestScore = score;
      }
    });

    const totalQuestions = totalCorrect + totalIncorrect;
    const accuracy = totalQuestions > 0
      ? Math.min(100, Math.round((totalCorrect / totalQuestions) * 100))
      : 0;
    const avgScore = totalSessions > 0 ? Math.round(totalScore / totalSessions) : 0;

    gameStats[game] = {
      name: gameNames[game] || game,
      count: totalSessions,
      totalScore,
      totalCorrect,
      totalIncorrect,
      accuracy,
      avgScore,
      bestScore,
      sessions: gameSessions // ВСЕ сессии, а не только последние
    };
  });

  return gameStats;
}

// Расчет общей статистики
function calculateOverallStats(sessions, gameStats) {
  const totalGames = sessions.length;
  const totalScore = sessions.reduce((sum, session) => sum + (session.score || 0), 0);
  const bestScore = Math.max(...sessions.map(s => s.score || 0), 0);

  // Считаем общую точность
  let totalCorrect = 0;
  let totalQuestions = 0;

  sessions.forEach(session => {
    totalCorrect += session.correct || 0;
    totalQuestions += (session.correct || 0) + (session.incorrect || 0);
  });

  const avgAccuracy = totalQuestions > 0
    ? Math.min(100, Math.round((totalCorrect / totalQuestions) * 100))
    : 0;

  // Находим любимую игру
  let favoriteGame = '';
  if (Object.keys(gameStats).length > 0) {
    const entries = Object.entries(gameStats);
    favoriteGame = entries.reduce((a, b) =>
      a[1].count > b[1].count ? a : b
    )[0];
  }

  // Рассчитываем серию дней
  const today = new Date().toDateString();
  const uniqueDays = [...new Set(sessions
    .filter(s => s.timestamp)
    .map(s => new Date(s.timestamp).toDateString())
  )].sort((a, b) => new Date(b) - new Date(a));

  let streak = 0;
  let currentDate = new Date();

  for (let i = 0; i < uniqueDays.length; i++) {
    const expectedDate = new Date(currentDate);
    expectedDate.setDate(expectedDate.getDate() - i);

    if (uniqueDays.includes(expectedDate.toDateString())) {
      streak++;
    } else {
      break;
    }
  }

  return {
    totalGames,
    totalScore,
    bestScore,
    avgAccuracy,
    favoriteGame: gameNames[favoriteGame] || favoriteGame,
    streak,
    totalCorrect,
    totalQuestions,
    gamesByType: Object.keys(gameStats).reduce((acc, game) => {
      acc[game] = {
        name: gameNames[game] || game,
        count: gameStats[game].count,
        totalScore: gameStats[game].totalScore,
        accuracy: gameStats[game].accuracy
      };
      return acc;
    }, {})
  };
}

// GET профиль пользователя
router.get('/', async (req, res) => {
  try {
    await initProfile();
    const data = await fs.readJson(DATA_PATH);
    const sessions = profile.allSessions || profile.recentSessions || [];


    // статистика по играм
    const gameStats = calculateGameStats(sessions);

    // общая статистика
    const stats = calculateOverallStats(sessions, gameStats);

    const allSessions = sessions.map(session => ({
      ...session,
      date: session.timestamp
        ? new Date(session.timestamp).toLocaleDateString('ru-RU')
        : 'Сегодня',
      accuracy: session.correct !== undefined && session.incorrect !== undefined
        ? Math.min(100, Math.round((session.correct / (session.correct + session.incorrect)) * 100))
        : 0
    }));

    res.json({
      stats,
      recentSessions: allSessions.slice(-20), // Последние 20 для отображения
      allSessions: allSessions,
      gameStats,
      settings: data.settings || {}
    });

  } catch (err) {
    console.error('Ошибка чтения профиля:', err);
    res.status(500).json({ error: 'Ошибка загрузки профиля' });
  }
});

router.post('/session', async (req, res) => {
  try {
    await initProfile();

    const session = {
      ...req.body,
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleDateString('ru-RU')
    };

    if (session.correct !== undefined) {
      session.correct = Math.max(0, parseInt(session.correct) || 0);
    }

    if (session.incorrect !== undefined) {
      session.incorrect = Math.max(0, parseInt(session.incorrect) || 0);
    }

    if (session.score !== undefined) {
      session.score = Math.max(0, parseInt(session.score) || 0);
    }

    const data = await fs.readJson(DATA_PATH);
    data.sessions.push(session);
    await fs.writeJson(DATA_PATH, data);

    const gameStats = calculateGameStats(data.sessions);
    const stats = calculateOverallStats(data.sessions, gameStats);

    const allSessions = data.sessions.map(s => ({
      ...s,
      date: s.timestamp ? new Date(s.timestamp).toLocaleDateString('ru-RU') : 'Сегодня'
    }));

    res.json({
      success: true,
      message: 'Сессия сохранена',
      session: session,
      updatedStats: {
        stats,
        sessions: gameSessions,
        allSessions: allSessions,
        gameStats
      }
    });

  } catch (err) {
    console.error('Ошибка сохранения:', err);
    res.status(500).json({ error: 'Ошибка сохранения' });
  }
});

router.get('/full-stats', async (req, res) => {
  try {
    await initProfile();
    const data = await fs.readJson(DATA_PATH);
    const sessions = data.sessions || [];

    const gameStats = calculateGameStats(sessions);
    const stats = calculateOverallStats(sessions, gameStats);

    const allSessions = sessions.map(session => ({
      ...session,
      date: session.timestamp
        ? new Date(session.timestamp).toLocaleDateString('ru-RU')
        : 'Сегодня'
    }));

    res.json({
      stats,
      allSessions,
      gameStats,
      dailyStats: calculateDailyStats(sessions),
      weeklyProgress: calculateWeeklyProgress(sessions)
    });

  } catch (err) {
    console.error('Ошибка загрузки полной статистики:', err);
    res.status(500).json({ error: 'Ошибка загрузки статистики' });
  }
});

// Вспомогательные функции для статистики
function calculateDailyStats(sessions) {
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return {
      date: date.toLocaleDateString('ru-RU'),
      day: date.toLocaleDateString('ru-RU', { weekday: 'short' })
    };
  }).reverse();

  return last7Days.map(day => {
    const daySessions = sessions.filter(s => {
      if (!s.timestamp) return false;
      const sessionDate = new Date(s.timestamp).toLocaleDateString('ru-RU');
      return sessionDate === day.date;
    });

    let totalScore = 0;
    let totalCorrect = 0;
    let totalIncorrect = 0;

    daySessions.forEach(s => {
      totalScore += s.score || 0;
      totalCorrect += s.correct || 0;
      totalIncorrect += s.incorrect || 0;
    });

    const total = totalCorrect + totalIncorrect;
    const accuracy = total > 0 ? Math.min(100, Math.round((totalCorrect / total) * 100)) : 0;

    return {
      ...day,
      sessions: daySessions.length,
      score: totalScore,
      correct: totalCorrect,
      incorrect: totalIncorrect,
      accuracy,
      avgScore: daySessions.length > 0 ? Math.round(totalScore / daySessions.length) : 0
    };
  });
}

function calculateWeeklyProgress(sessions) {
  const weeks = [];
  const now = new Date();

  for (let i = 0; i < 4; i++) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - (i * 7) - 6);
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - (i * 7));

    const weekSessions = sessions.filter(s => {
      if (!s.timestamp) return false;
      const sessionDate = new Date(s.timestamp);
      return sessionDate >= weekStart && sessionDate <= weekEnd;
    });

    let weekScore = 0;
    let weekCorrect = 0;
    let weekIncorrect = 0;

    weekSessions.forEach(s => {
      weekScore += s.score || 0;
      weekCorrect += s.correct || 0;
      weekIncorrect += s.incorrect || 0;
    });

    const total = weekCorrect + weekIncorrect;
    const accuracy = total > 0 ? Math.min(100, Math.round((weekCorrect / total) * 100)) : 0;

    weeks.push({
      week: i + 1,
      label: `Неделя ${i + 1}`,
      sessions: weekSessions.length,
      score: weekScore,
      accuracy,
      games: Object.keys(calculateGameStats(weekSessions)).length
    });
  }

  return weeks.reverse();
}

module.exports = router;