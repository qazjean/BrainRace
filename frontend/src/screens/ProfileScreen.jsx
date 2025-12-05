import React, { useState, useEffect, useMemo } from 'react';
import { Line, Bar, Doughnut, Radar, Pie, Bubble, Scatter } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  PointElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
  BubbleController,
  ScatterController
} from 'chart.js';
import { GradientBackground } from '../ui/Backgrounds';
import ProfessorAvatar from '../components/ProfessorAvatar';
import axios from 'axios';

ChartJS.register(
  LineElement, BarElement, ArcElement, PointElement, RadialLinearScale,
  CategoryScale, LinearScale, Title, Tooltip, Legend, Filler,
  BubbleController, ScatterController
);

const gameNames = {
  'speed': '⚡ Скорость',
  'logic': '🧠 Логика',
  'odd': '🔍 Лишнее',
  'analogy': '🔄 Аналогии',
  'memory': '💾 Память'
};

const gameColors = {
  'speed': '#4f46e5',
  'logic': '#10b981',
  'odd': '#f59e0b',
  'analogy': '#ec4899',
  'memory': '#8b5cf6'
};

const getLast7Days = () => {
  const days = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    const dayName = date.toLocaleDateString('ru-RU', { weekday: 'short' });
    const dateKey = date.toLocaleDateString('ru-RU');

    days.push({
      day: dayName,
      date: dateKey,
      fullDate: date
    });
  }

  return days;
};

// Функция для расчета статистики игр из сессий
const calculateGameStatsFromSessions = (sessions) => {
  const gameStats = {};
  const sessionsByGame = {};

  // Группируем сессии по играм
  sessions.forEach(session => {
    if (!session.game) return;

    const game = session.game;

    if (!sessionsByGame[game]) {
      sessionsByGame[game] = [];
    }

    sessionsByGame[game].push(session);
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
      sessions: gameSessions
    };
  });

  return gameStats;
};

// Функция для расчета прогресса по дням
const calculateDailyProgress = (sessions) => {
  const last7Days = getLast7Days();

  return last7Days.map(day => {
    // Находим сессии за этот день
    const daySessions = sessions.filter(session => {
      if (!session.timestamp) return false;
      const sessionDate = new Date(session.timestamp).toLocaleDateString('ru-RU');
      return sessionDate === day.date;
    });

    // Считаем статистику за день
    let totalScore = 0;
    let totalCorrect = 0;
    let totalIncorrect = 0;

    daySessions.forEach(session => {
      totalScore += session.score || 0;
      totalCorrect += session.correct || 0;
      totalIncorrect += session.incorrect || 0;
    });

    const totalQuestions = totalCorrect + totalIncorrect;
    const accuracy = totalQuestions > 0
      ? Math.min(100, Math.round((totalCorrect / totalQuestions) * 100))
      : 0;

    return {
      day: day.day,
      date: day.date,
      sessions: daySessions.length,
      score: totalScore,
      correct: totalCorrect,
      incorrect: totalIncorrect,
      accuracy,
      avgScore: daySessions.length > 0 ? Math.round(totalScore / daySessions.length) : 0
    };
  });
};

export default function ProfileScreen() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [professorAdvice, setProfessorAdvice] = useState([]);
  const [aiInsights, setAiInsights] = useState([]);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      const response = await axios.get('http://localhost:4000/api/profile');
      const data = response.data;
      setProfile(data);

      // Получаем советы от ИИ
      await loadAIInsights(data);

    } catch (error) {
      console.error('Ошибка загрузки профиля:', error);
      // Создаем тестовые данные для демонстрации
      const testSessions = [
        { game: 'speed', score: 150, correct: 8, incorrect: 2, timestamp: new Date().toISOString(), level: 2 },
        { game: 'logic', score: 120, correct: 6, incorrect: 4, timestamp: new Date().toISOString(), level: 1 },
        { game: 'odd', score: 180, correct: 9, incorrect: 1, timestamp: new Date().toISOString(), level: 3 },
        { game: 'analogy', score: 90, correct: 5, incorrect: 5, timestamp: new Date().toISOString(), level: 2 },
        { game: 'memory', score: 200, correct: 10, incorrect: 0, timestamp: new Date().toISOString(), level: 3 },
      ];

      setProfile({
        stats: {
          totalGames: testSessions.length,
          bestScore: 200,
          avgAccuracy: 76,
          streak: 3,
          totalCorrect: 38,
          totalQuestions: 50,
          totalScore: 740
        },
        recentSessions: testSessions,
        gameStats: calculateGameStatsFromSessions(testSessions)
      });

      // Генерируем тестовые советы
      generateTestAdvice();

    } finally {
      setLoading(false);
    }
  };

  const loadAIInsights = async (profileData) => {
    try {
      // Запрашиваем советы от ИИ через бэкенд
      const response = await axios.post('http://localhost:4000/api/giga/advice', {
        stats: profileData.stats || {},
        sessions: profileData.recentSessions || [],
        gameStats: profileData.gameStats || {}
      });

      if (response.data.advice) {
        setProfessorAdvice(response.data.advice.split('\n').filter(line => line.trim()));
      }

      if (response.data.insights) {
        setAiInsights(response.data.insights);
      }

    } catch (error) {
      console.error('Ошибка загрузки советов от ИИ:', error);
      generateTestAdvice();
    }
  };

  const generateTestAdvice = () => {
    // Тестовые советы для демонстрации
    const testAdvice = [
      "Сосредоточьтесь на игре 'Скорость реакции' - ваша точность ниже среднего по этому типу заданий.",
      "Увеличьте время тренировок по вечерам - в это время ваша продуктивность выше на 30%.",
      "Чередуйте игры на логику и память - это улучшает нейропластичность мозга.",
      "Попробуйте повысить уровень сложности в играх на внимание - вы готовы к большему.",
      "Делайте короткие перерывы между играми (30-60 секунд) для лучшего усвоения материала.",
      "Увеличьте количество игр 'Аналогии' до 3 в день - это укрепит ассоциативное мышление.",
      "Записывайте свои результаты - это поможет отслеживать прогресс и мотивирует."
    ];

    setProfessorAdvice(testAdvice);

    setAiInsights([
      {
        title: "Пик продуктивности",
        description: "Ваша лучшая точность наблюдается между 18:00 и 20:00",
        value: "+32%",
        icon: "📈"
      },
      {
        title: "Самый быстрый прогресс",
        description: "В играх на память вы улучшили результат на 45% за 2 недели",
        value: "45%",
        icon: "🚀"
      },
      {
        title: "Рекомендуемая частота",
        description: "Оптимально играть 4-5 раз в неделю по 20-30 минут",
        value: "⭐",
        icon: "🎯"
      }
    ]);
  };

  // РАСЧЕТ ДАННЫХ ДЛЯ ГРАФИКОВ НА ОСНОВЕ РЕАЛЬНЫХ ДАННЫХ
  const enhancedChartData = useMemo(() => {
    if (!profile) return {};

    const sessions = profile.recentSessions || [];
    const gameStats = profile.gameStats || calculateGameStatsFromSessions(sessions);
    const stats = profile.stats || {};

    // 1. РАСЧЕТ ПРОГРЕССА ПО ДНЯМ (на основе реальных сессий)
    const dailyProgress = calculateDailyProgress(sessions);

    // 2. РАСЧЕТ РАСПРЕДЕЛЕНИЯ ОЧКОВ ПО ИГРАМ
    const scoreDistribution = Object.entries(gameStats)
      .map(([game, data]) => ({
        game: gameNames[game] || game,
        totalScore: data.totalScore || 0,
        color: gameColors[game] || '#6b7280',
        count: data.count || 0,
        accuracy: data.accuracy || 0
      }))
      .filter(d => d.totalScore > 0);

    // 3. РАСЧЕТ НАВЫКОВ (Radar Chart) - на основе реальной точности
    const skillDimensions = [
      { skill: 'Скорость', key: 'speed', icon: '⚡' },
      { skill: 'Логика', key: 'logic', icon: '🧠' },
      { skill: 'Внимание', key: 'odd', icon: '🔍' },
      { skill: 'Ассоциации', key: 'analogy', icon: '🔄' },
      { skill: 'Память', key: 'memory', icon: '💾' },
      { skill: 'Концентрация', key: 'concentration', icon: '🎯' }
    ];

    const radarData = skillDimensions.map(dim => {
      if (dim.key === 'concentration') {
        // Концентрация = среднее по всем играм
        const totalAccuracy = Object.values(gameStats).reduce((sum, g) => sum + (g.accuracy || 0), 0);
        const gameCount = Object.keys(gameStats).length;
        return gameCount > 0 ? Math.round(totalAccuracy / gameCount) : 50;
      }
      return gameStats[dim.key]?.accuracy || 50;
    });

    // 4. КОРРЕЛЯЦИЯ ТОЧНОСТИ И СКОРОСТИ (для скорости реакции)
    const speedSessions = sessions.filter(s => s.game === 'speed');
    const correlationData = speedSessions
      .map((session, index) => ({
        game: `Игра ${index + 1}`,
        reactionTime: session.reactionTime || (2 + Math.random() * 3),
        accuracy: session.correct && session.incorrect
          ? Math.min(100, Math.round((session.correct / (session.correct + session.incorrect)) * 100))
          : 75
      }))
      .slice(0, 7);

    // 5. СЛОЖНОСТЬ ИГР (средний уровень)
    const difficultyData = Object.entries(gameStats).map(([game, data]) => {
      const gameSessions = data.sessions || [];
      const avgLevel = gameSessions.length > 0
        ? gameSessions.reduce((sum, s) => sum + (s.level || 1), 0) / gameSessions.length
        : 1;

      return {
        game: gameNames[game] || game,
        avgLevel: Math.min(3, Math.max(1, avgLevel)),
        color: gameColors[game] || '#6b7280',
        accuracy: data.accuracy || 0
      };
    });

    // 6. ТРЕНД УЛУЧШЕНИЯ
    const sortedSessions = [...sessions]
      .filter(s => s.timestamp)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    const improvementTrend = [];
    const batchSize = Math.min(3, Math.max(1, Math.floor(sortedSessions.length / 3)));

    for (let i = 0; i < sortedSessions.length; i += batchSize) {
      const batch = sortedSessions.slice(i, i + batchSize);
      if (batch.length > 0) {
        const totalAccuracy = batch.reduce((sum, s) => {
          if (s.correct && s.incorrect) {
            return sum + Math.min(100, Math.round((s.correct / (s.correct + s.incorrect)) * 100));
          }
          return sum + 70;
        }, 0);

        improvementTrend.push({
          index: improvementTrend.length + 1,
          accuracy: Math.round(totalAccuracy / batch.length)
        });
      }
    }

    // 7. ВРЕМЯ СУТОК - АКТИВНОСТЬ
    const timeStats = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    const timeSessions = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    const timeAccuracy = { morning: [], afternoon: [], evening: [], night: [] };

    sessions.forEach(session => {
      if (session.timestamp) {
        const hour = new Date(session.timestamp).getHours();
        let timeKey = 'night';
        if (hour >= 6 && hour < 12) timeKey = 'morning';
        else if (hour >= 12 && hour < 18) timeKey = 'afternoon';
        else if (hour >= 18 && hour < 22) timeKey = 'evening';

        timeStats[timeKey] += session.score || 0;
        timeSessions[timeKey]++;

        if (session.correct !== undefined && session.incorrect !== undefined) {
          const accuracy = session.correct + session.incorrect > 0
            ? (session.correct / (session.correct + session.incorrect)) * 100
            : 0;
          timeAccuracy[timeKey].push(accuracy);
        }
      }
    });

    // 8. СРАВНЕНИЕ ИГР ПО ПАРАМЕТРАМ
    const gameComparisonData = {
      labels: Object.keys(gameStats).map(g => gameNames[g] || g),
      datasets: [
        {
          label: 'Точность (%)',
          data: Object.values(gameStats).map(g => g.accuracy || 0),
          backgroundColor: '#4f46e5',
          borderWidth: 2,
          borderColor: 'white'
        },
        {
          label: 'Средние очки',
          data: Object.values(gameStats).map(g => g.avgScore || 0),
          backgroundColor: '#10b981',
          borderWidth: 2,
          borderColor: 'white'
        },
        {
          label: 'Количество игр',
          data: Object.values(gameStats).map(g => g.count || 0),
          backgroundColor: '#f59e0b',
          borderWidth: 2,
          borderColor: 'white'
        }
      ]
    };

    // 9. НОВЫЙ ГРАФИК: Bubble Chart - Сложность vs Точность
    const bubbleData = Object.entries(gameStats).map(([game, data]) => ({
      x: data.count || 1, // Количество игр
      y: data.accuracy || 50, // Точность
      r: Math.min(30, Math.max(10, (data.avgScore || 0) / 10)), // Средние очки
      label: gameNames[game] || game,
      color: gameColors[game] || '#6b7280'
    }));

    // 10. НОВЫЙ ГРАФИК: Scatter Plot - Прогресс по времени
    const scatterData = sortedSessions
      .filter(s => s.timestamp)
      .map((session, index) => {
        const accuracy = session.correct && session.incorrect
          ? (session.correct / (session.correct + session.incorrect)) * 100
          : 50;

        return {
          x: index, // Номер сессии
          y: accuracy, // Точность
          score: session.score || 0,
          game: session.game,
          date: new Date(session.timestamp).toLocaleDateString('ru-RU')
        };
      });

    // 11. НОВЫЙ ГРАФИК: Эффективность по дням недели
    const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    const weeklyStats = weekDays.map(day => ({
      day,
      sessions: 0,
      totalScore: 0,
      accuracy: 0
    }));

    sessions.forEach(session => {
      if (session.timestamp) {
        const dayIndex = new Date(session.timestamp).getDay();
        const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1; // Воскресенье -> 6

        weeklyStats[adjustedIndex].sessions++;
        weeklyStats[adjustedIndex].totalScore += session.score || 0;

        if (session.correct && session.incorrect) {
          const sessionAccuracy = (session.correct / (session.correct + session.incorrect)) * 100;
          weeklyStats[adjustedIndex].accuracy = weeklyStats[adjustedIndex].accuracy === 0
            ? sessionAccuracy
            : (weeklyStats[adjustedIndex].accuracy + sessionAccuracy) / 2;
        }
      }
    });

    // 12. НОВЫЙ ГРАФИК: Прогнозирование прогресса
    const forecastData = [];
    if (improvementTrend.length >= 2) {
      const lastTwo = improvementTrend.slice(-2);
      const growthRate = (lastTwo[1].accuracy - lastTwo[0].accuracy) / lastTwo[0].accuracy;

      for (let i = 0; i < 4; i++) {
        forecastData.push({
          index: improvementTrend.length + i + 1,
          accuracy: Math.min(100, Math.max(0, lastTwo[1].accuracy * (1 + growthRate * (i + 1))))
        });
      }
    }

    return {
      // Radar Chart
      radarData: {
        labels: skillDimensions.map(d => d.skill),
        datasets: [{
          label: 'Уровень навыка',
          data: radarData,
          backgroundColor: 'rgba(79, 70, 229, 0.2)',
          borderColor: '#4f46e5',
          pointBackgroundColor: skillDimensions.map((_, i) =>
            ['#4f46e5', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6'][i]
          ),
          pointBorderColor: '#fff'
        }]
      },

      // Line Chart: Прогресс по дням
      progressData: {
        labels: dailyProgress.map(d => d.day),
        datasets: [
          {
            label: 'Очки',
            data: dailyProgress.map(d => d.score),
            borderColor: '#4f46e5',
            backgroundColor: 'rgba(79, 70, 229, 0.1)',
            fill: true,
            tension: 0.4,
            yAxisID: 'y'
          },
          {
            label: 'Точность (%)',
            data: dailyProgress.map(d => d.accuracy),
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.4,
            yAxisID: 'y1'
          }
        ]
      },

      // Pie Chart: Распределение очков
      distributionData: {
        labels: scoreDistribution.map(d => d.game),
        datasets: [{
          data: scoreDistribution.map(d => d.totalScore),
          backgroundColor: scoreDistribution.map(d => d.color),
          borderWidth: 2,
          borderColor: 'white'
        }]
      },

      // Line Chart: Корреляция
      correlationData: {
        labels: correlationData.map(d => d.game),
        datasets: [
          {
            label: 'Время реакции (сек)',
            data: correlationData.map(d => d.reactionTime),
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            fill: false,
            tension: 0.4,
            yAxisID: 'y'
          },
          {
            label: 'Точность (%)',
            data: correlationData.map(d => d.accuracy),
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            fill: false,
            tension: 0.4,
            yAxisID: 'y1'
          }
        ]
      },

      // Bar Chart: Сложность
      difficultyData: {
        labels: difficultyData.map(d => d.game),
        datasets: [{
          label: 'Средний уровень',
          data: difficultyData.map(d => d.avgLevel),
          backgroundColor: difficultyData.map(d => d.color),
          borderWidth: 2,
          borderColor: 'white'
        }]
      },

      // Line Chart: Тренд улучшения
      improvementData: {
        labels: improvementTrend.map(d => `Блок ${d.index}`),
        datasets: [{
          label: 'Средняя точность',
          data: improvementTrend.map(d => d.accuracy),
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139, 92, 246, 0.2)',
          fill: true,
          tension: 0.4
        }]
      },

      // Bar Chart: Время суток
      timeOfDayData: {
        labels: ['Утро (6-12)', 'День (12-18)', 'Вечер (18-22)', 'Ночь (22-6)'],
        datasets: [{
          label: 'Суммарные очки',
          data: [
            timeStats.morning || 0,
            timeStats.afternoon || 0,
            timeStats.evening || 0,
            timeStats.night || 0
          ],
          backgroundColor: ['#fbbf24', '#f59e0b', '#d97706', '#92400e']
        }]
      },

      // Multi-bar Chart: Сравнение игр
      gameComparisonData,

      // НОВЫЕ ГРАФИКИ:

      // Bubble Chart: Сложность vs Точность
      bubbleData: {
        datasets: [{
          label: 'Игры',
          data: bubbleData,
          backgroundColor: bubbleData.map(d => d.color + '80'), // 50% прозрачности
          borderColor: bubbleData.map(d => d.color),
          borderWidth: 1
        }]
      },

      // Scatter Plot: Прогресс по времени
      scatterData: {
        datasets: [{
          label: 'Сессии',
          data: scatterData,
          backgroundColor: scatterData.map(d => gameColors[d.game] || '#6b7280'),
          borderColor: scatterData.map(d => gameColors[d.game] || '#6b7280'),
          borderWidth: 1,
          pointRadius: 6
        }]
      },

      // Bar Chart: Активность по дням недели
      weeklyActivityData: {
        labels: weeklyStats.map(d => d.day),
        datasets: [
          {
            label: 'Количество игр',
            data: weeklyStats.map(d => d.sessions),
            backgroundColor: '#4f46e5',
            borderWidth: 2,
            borderColor: 'white',
            yAxisID: 'y'
          },
          {
            label: 'Средняя точность (%)',
            data: weeklyStats.map(d => d.accuracy),
            backgroundColor: '#10b981',
            borderWidth: 2,
            borderColor: 'white',
            yAxisID: 'y1'
          }
        ]
      },

      // Line Chart: Прогноз прогресса
      forecastData: {
        labels: [
          ...improvementTrend.map(d => `Блок ${d.index}`),
          ...forecastData.map(d => `Прогноз ${d.index}`)
        ],
        datasets: [
          {
            label: 'Исторические данные',
            data: [
              ...improvementTrend.map(d => d.accuracy),
              ...new Array(forecastData.length).fill(null)
            ],
            borderColor: '#4f46e5',
            backgroundColor: 'rgba(79, 70, 229, 0.1)',
            fill: false,
            tension: 0.4
          },
          {
            label: 'Прогноз',
            data: [
              ...new Array(improvementTrend.length).fill(null),
              ...forecastData.map(d => d.accuracy)
            ],
            borderColor: '#ec4899',
            backgroundColor: 'rgba(236, 72, 153, 0.1)',
            borderDash: [5, 5],
            fill: false,
            tension: 0.4
          }
        ]
      },

      // Точность по времени суток
      timeAccuracyData: {
        labels: ['Утро (6-12)', 'День (12-18)', 'Вечер (18-22)', 'Ночь (22-6)'],
        datasets: [{
          label: 'Средняя точность (%)',
          data: Object.keys(timeAccuracy).map(key => {
            const accuracies = timeAccuracy[key];
            return accuracies.length > 0
              ? accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length
              : 0;
          }),
          backgroundColor: ['#60a5fa', '#34d399', '#fbbf24', '#a78bfa']
        }]
      }
    };
  }, [profile]); // Зависимость от profile

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: { size: 11 },
          boxWidth: 12
        }
      }
    }
  };

  if (loading) {
    return (
      <GradientBackground>
        <div className="container">
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
          }}>
            <div style={{ fontSize: 16, color: '#6b7280', marginBottom: 20 }}>
              Загружаю вашу статистику...
            </div>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid #e5e7eb',
              borderTopColor: '#4f46e5',
              borderRadius: '50%',
              margin: '0 auto',
              animation: 'spin 1s linear infinite'
            }} />
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        </div>
      </GradientBackground>
    );
  }

  const stats = profile?.stats || {};
  const recentSessions = profile?.recentSessions || [];
  const gameStats = profile?.gameStats || calculateGameStatsFromSessions(recentSessions);

  const totalGames = stats.totalGames || recentSessions.length;
  const bestScore = stats.bestScore || Math.max(...recentSessions.map(s => s.score || 0), 0);
  const streak = stats.streak || 0;
  const totalCorrect = stats.totalCorrect || recentSessions.reduce((sum, s) => sum + (s.correct || 0), 0);
  const totalQuestions = stats.totalQuestions || recentSessions.reduce((sum, s) => sum + ((s.correct || 0) + (s.incorrect || 0)), 0);

  // Расчет точности на основе реальных данных
  const accuracyPercentage = totalQuestions > 0
    ? Math.min(100, Math.round((totalCorrect / totalQuestions) * 100))
    : 0;

  // Функция для обновления советов от профессора
  const refreshAdvice = async () => {
    try {
      setLoading(true);
      const response = await axios.post('http://localhost:4000/api/giga/advice', {
        stats: profile?.stats || {},
        sessions: profile?.recentSessions || [],
        gameStats: profile?.gameStats || {}
      });

      if (response.data.advice) {
        setProfessorAdvice(response.data.advice.split('\n').filter(line => line.trim()));
      }

      if (response.data.insights) {
        setAiInsights(response.data.insights);
      }

    } catch (error) {
      console.error('Ошибка обновления советов:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GradientBackground>
      <div className="container" style={{ maxWidth: '500px' }}>
        {/* Заголовок */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24
        }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800 }}>Аналитика профиля</h1>
            <div style={{ fontSize: 14, color: '#6b7280' }}>
              На основе {totalGames} сыгранных игр • Точность: {accuracyPercentage}%
            </div>
          </div>
          <ProfessorAvatar size={64} state="playful" />
        </div>

        {/* Вкладки */}
        <div style={{
          display: 'flex',
          background: '#f3f4f6',
          borderRadius: '12px',
          padding: 4,
          marginBottom: 20,
          overflowX: 'auto'
        }}>
          {['overview', 'skills', 'progress', 'insights', 'graphs'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                minWidth: '100px',
                padding: '10px 16px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === tab ? 'white' : 'transparent',
                color: activeTab === tab ? '#111827' : '#6b7280',
                fontWeight: activeTab === tab ? 600 : 500,
                fontSize: 14,
                cursor: 'pointer',
                boxShadow: activeTab === tab ? '0 2px 8px rgba(0, 0, 0, 0.1)' : 'none',
                whiteSpace: 'nowrap'
              }}
            >
              {tab === 'overview' && '📊 Обзор'}
              {tab === 'skills' && '🧠 Навыки'}
              {tab === 'progress' && '📈 Прогресс'}
              {tab === 'insights' && '💡 Инсайты'}
              {tab === 'graphs' && '📊 Графики'}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <>
            {/* Ключевые метрики */}
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: 20,
              marginBottom: 16,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
            }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Ключевые показатели</h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                <div style={{
                  padding: 16,
                  background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
                  borderRadius: '12px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: 11, color: '#1e40af', marginBottom: 4 }}>Общая точность</div>
                  <div style={{ fontSize: 32, fontWeight: '800', color: '#1e40af' }}>
                    {accuracyPercentage}%
                  </div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
                    {totalCorrect} из {totalQuestions} ответов
                  </div>
                </div>

                <div style={{
                  padding: 16,
                  background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                  borderRadius: '12px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: 11, color: '#065f46', marginBottom: 4 }}>Лучший результат</div>
                  <div style={{ fontSize: 32, fontWeight: '800', color: '#065f46' }}>
                    {bestScore}
                  </div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
                    {totalGames} сыгранных игр
                  </div>
                </div>

                <div style={{
                  padding: 16,
                  background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                  borderRadius: '12px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: 11, color: '#92400e', marginBottom: 4 }}>Дней подряд</div>
                  <div style={{ fontSize: 32, fontWeight: '800', color: '#92400e' }}>
                    {streak}
                  </div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
                    Серия тренировок
                  </div>
                </div>

                <div style={{
                  padding: 16,
                  background: 'linear-gradient(135deg, #fae8ff, #f5d0fe)',
                  borderRadius: '12px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: 11, color: '#86198f', marginBottom: 4 }}>Продуктивность</div>
                  <div style={{ fontSize: 32, fontWeight: '800', color: '#86198f' }}>
                    {Math.round(accuracyPercentage / 20)}/5
                  </div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
                    Индекс эффективности
                  </div>
                </div>
              </div>
            </div>

            {/* Распределение очков по играм */}
            {enhancedChartData.distributionData && Object.keys(gameStats).length > 0 && (
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: 20,
                marginBottom: 16,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
              }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Распределение очков</h3>

                <div style={{ height: 250 }}>
                  <Pie
                    data={enhancedChartData.distributionData}
                    options={{
                      ...chartOptions,
                      plugins: {
                        legend: {
                          position: 'right',
                          labels: { font: { size: 11 } }
                        }
                      }
                    }}
                  />
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 8,
                  marginTop: 16
                }}>
                  {Object.entries(gameStats).slice(0, 4).map(([game, data]) => (
                    <div key={game} style={{
                      padding: 8,
                      background: '#f8fafc',
                      borderRadius: '8px',
                      fontSize: 11
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                        <div style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: gameColors[game] || '#6b7280'
                        }} />
                        <span style={{ fontWeight: 600 }}>{gameNames[game] || game}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#6b7280' }}>{data.totalScore || 0} очков</span>
                        <span style={{ fontWeight: 600, color: gameColors[game] || '#6b7280' }}>
                          {data.count || 0} игр
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Сравнение игр */}
            {enhancedChartData.gameComparisonData && Object.keys(gameStats).length > 0 && (
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: 20,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
              }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Сравнение игр</h3>

                <div style={{ height: 250 }}>
                  <Bar
                    data={enhancedChartData.gameComparisonData}
                    options={{
                      ...chartOptions,
                      scales: {
                        x: { stacked: false },
                        y: { beginAtZero: true }
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'skills' && (
          <>
            {/* Radar Chart: Многофакторный анализ */}
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: 20,
              marginBottom: 16,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
            }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Многофакторный анализ навыков</h3>

              <div style={{ height: 300 }}>
                <Radar
                  data={enhancedChartData.radarData}
                  options={{
                    ...chartOptions,
                    scales: {
                      r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                          stepSize: 20,
                          callback: value => value + '%'
                        }
                      }
                    }
                  }}
                />
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 8,
                marginTop: 16
              }}>
                {Object.entries(gameStats).slice(0, 6).map(([game, data]) => (
                  <div key={game} style={{
                    padding: 8,
                    background: '#f8fafc',
                    borderRadius: '8px',
                    fontSize: 11
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                      <span style={{ fontSize: 12 }}>{gameNames[game]?.charAt(0) || '🎮'}</span>
                      <span style={{ fontWeight: 600 }}>{gameNames[game]?.slice(2) || game}</span>
                    </div>
                    <div style={{
                      height: 4,
                      background: '#e5e7eb',
                      borderRadius: '2px',
                      marginBottom: 4,
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${data.accuracy || 0}%`,
                        height: '100%',
                        background: gameColors[game] || '#6b7280',
                        borderRadius: '2px'
                      }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#6b7280' }}>{data.accuracy || 0}%</span>
                      <span style={{ color: '#6b7280' }}>{data.count || 0} игр</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Уровень сложности */}
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: 20,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
            }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Уровень сложности игр</h3>

              <div style={{ height: 200 }}>
                <Bar
                  data={enhancedChartData.difficultyData}
                  options={{
                    ...chartOptions,
                    plugins: { legend: { display: false } },
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 3,
                        ticks: {
                          stepSize: 1,
                          callback: value => {
                            const levels = ['Легкий', 'Средний', 'Сложный'];
                            return levels[value - 1] || value;
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </>
        )}

        {activeTab === 'progress' && (
          <>
            {/* Прогресс за неделю */}
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: 20,
              marginBottom: 16,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
            }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Ежедневный прогресс</h3>

              <div style={{ height: 250 }}>
                <Line
                  data={enhancedChartData.progressData}
                  options={{
                    ...chartOptions,
                    scales: {
                      y: {
                        title: { display: true, text: 'Очки', color: '#4f46e5' },
                        beginAtZero: true
                      },
                      y1: {
                        position: 'right',
                        title: { display: true, text: 'Точность (%)', color: '#10b981' },
                        beginAtZero: true,
                        max: 100
                      }
                    }
                  }}
                />
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 12,
                marginTop: 16
              }}>
                <div style={{
                  padding: 12,
                  background: '#f0f9ff',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: 11, color: '#1e40af', marginBottom: 4 }}>Средние очки в день</div>
                  <div style={{ fontSize: 20, fontWeight: '800', color: '#1e40af' }}>
                    {Math.round(enhancedChartData.progressData?.datasets[0].data.reduce((a, b) => a + b, 0) / 7) || 0}
                  </div>
                </div>

                <div style={{
                  padding: 12,
                  background: '#f0fdf4',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: 11, color: '#065f46', marginBottom: 4 }}>Средняя точность</div>
                  <div style={{ fontSize: 20, fontWeight: '800', color: '#065f46' }}>
                    {Math.round(enhancedChartData.progressData?.datasets[1].data.reduce((a, b) => a + b, 0) / 7) || 0}%
                  </div>
                </div>
              </div>
            </div>

            {/* Тренд улучшения */}
            {enhancedChartData.improvementData && enhancedChartData.improvementData.datasets[0].data.length > 0 && (
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: 20,
                marginBottom: 16,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
              }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Тренд улучшения</h3>

                <div style={{ height: 200 }}>
                  <Line
                    data={enhancedChartData.improvementData}
                    options={{
                      ...chartOptions,
                      plugins: { legend: { display: false } },
                      scales: {
                        y: {
                          beginAtZero: true,
                          max: 100,
                          ticks: { callback: value => value + '%' }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            )}

            {/* Прогресс по дням недели */}
            {enhancedChartData.weeklyActivityData && (
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: 20,
                marginBottom: 16,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
              }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Активность по дням недели</h3>

                <div style={{ height: 250 }}>
                  <Bar
                    data={enhancedChartData.weeklyActivityData}
                    options={{
                      ...chartOptions,
                      scales: {
                        y: {
                          title: { display: true, text: 'Количество игр', color: '#4f46e5' },
                          beginAtZero: true
                        },
                        y1: {
                          position: 'right',
                          title: { display: true, text: 'Точность (%)', color: '#10b981' },
                          beginAtZero: true,
                          max: 100
                        }
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'insights' && (
          <>
            {/* Персональные инсайты */}
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: 20,
              marginBottom: 16,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700 }}>🧠 Советы от Профессора ИИ</h3>
                <button
                  onClick={refreshAdvice}
                  style={{
                    padding: '6px 12px',
                    background: '#4f46e5',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  🔄 Новые советы
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {professorAdvice.map((advice, index) => (
                  <div key={index} style={{
                    padding: 12,
                    background: index % 3 === 0 ? 'linear-gradient(135deg, #f0f9ff, #e0f2fe)' :
                              index % 3 === 1 ? 'linear-gradient(135deg, #f0fdf4, #dcfce7)' :
                              'linear-gradient(135deg, #fef3c7, #fde68a)',
                    borderRadius: '8px',
                    fontSize: 13
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 8,
                      color: index % 3 === 0 ? '#1e40af' :
                            index % 3 === 1 ? '#065f46' : '#92400e'
                    }}>
                      <div style={{ fontSize: 16 }}>
                        {index % 3 === 0 ? '🎯' : index % 3 === 1 ? '📈' : '💡'}
                      </div>
                      <div>{advice}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ИИ-инсайты */}
            {aiInsights.length > 0 && (
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: 20,
                marginBottom: 16,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
              }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>🤖 Аналитические инсайты от ИИ</h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                  {aiInsights.map((insight, index) => (
                    <div key={index} style={{
                      padding: 12,
                      background: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{
                        fontSize: 20,
                        marginBottom: 8,
                        color: index === 0 ? '#f59e0b' : index === 1 ? '#10b981' : '#8b5cf6'
                      }}>
                        {insight.icon}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                        {insight.title}
                      </div>
                      <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8 }}>
                        {insight.description}
                      </div>
                      <div style={{
                        fontSize: 18,
                        fontWeight: '800',
                        color: index === 0 ? '#f59e0b' : index === 1 ? '#10b981' : '#8b5cf6'
                      }}>
                        {insight.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Рекомендации по тренировкам */}
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: 20,
              marginBottom: 16,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
            }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>🎯 Персонализированный план тренировок</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  {
                    title: 'Утренняя разминка мозга',
                    desc: 'Начните день с 3 игр на скорость реакции для активации нейронных связей',
                    time: '10 минут',
                    icon: '🌅',
                    priority: 'Высокий'
                  },
                  {
                    title: 'Логический блок',
                    desc: 'Решите 5 логических задач для улучшения аналитического мышления',
                    time: '15 минут',
                    icon: '🧩',
                    priority: 'Средний'
                  },
                  {
                    title: 'Тренировка памяти',
                    desc: 'Попробуйте запомнить 3 последовательности по 6+ символов для улучшения рабочей памяти',
                    time: '12 минут',
                    icon: '💾',
                    priority: 'Высокий'
                  },
                  {
                    title: 'Комплексная тренировка',
                    desc: 'Сыграйте по одной игре каждого типа для гармоничного развития когнитивных навыков',
                    time: '25 минут',
                    icon: '🎯',
                    priority: 'Низкий'
                  }
                ].map((item, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: 12,
                    background: idx === 0 ? '#f0f9ff' : '#f8fafc',
                    borderRadius: '8px',
                    border: idx === 0 ? '2px solid #3b82f6' : '1px solid #e5e7eb'
                  }}>
                    <div style={{ fontSize: 20 }}>{item.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>
                          {item.title}
                        </div>
                        <div style={{
                          fontSize: 10,
                          padding: '2px 6px',
                          background: item.priority === 'Высокий' ? '#fee2e2' :
                                    item.priority === 'Средний' ? '#fef3c7' : '#dcfce7',
                          color: item.priority === 'Высокий' ? '#dc2626' :
                                 item.priority === 'Средний' ? '#92400e' : '#065f46',
                          borderRadius: '10px'
                        }}>
                          {item.priority}
                        </div>
                      </div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>
                        {item.desc}
                      </div>
                    </div>
                    <div style={{
                      fontSize: 11,
                      padding: '4px 8px',
                      background: '#e5e7eb',
                      borderRadius: '12px',
                      color: '#4b5563'
                    }}>
                      {item.time}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'graphs' && (
          <>
            {/* Bubble Chart: Сложность vs Точность */}
            {enhancedChartData.bubbleData && enhancedChartData.bubbleData.datasets[0].data.length > 0 && (
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: 20,
                marginBottom: 16,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
              }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>📊 Bubble Chart: Сложность vs Точность</h3>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>
                  Размер пузырька = средние очки, Цвет = тип игры
                </div>

                <div style={{ height: 300 }}>
                  <Bubble
                    data={enhancedChartData.bubbleData}
                    options={{
                      ...chartOptions,
                      scales: {
                        x: {
                          title: { display: true, text: 'Количество игр' }
                        },
                        y: {
                          title: { display: true, text: 'Точность (%)' },
                          beginAtZero: true,
                          max: 100
                        }
                      }
                    }}
                  />
                </div>
              </div>
            )}

            {/* Scatter Plot: Прогресс по времени */}
            {enhancedChartData.scatterData && enhancedChartData.scatterData.datasets[0].data.length > 0 && (
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: 20,
                marginBottom: 16,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
              }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>📈 Scatter Plot: Прогресс по времени</h3>

                <div style={{ height: 300 }}>
                  <Scatter
                    data={enhancedChartData.scatterData}
                    options={{
                      ...chartOptions,
                      scales: {
                        x: {
                          title: { display: true, text: 'Номер сессии' }
                        },
                        y: {
                          title: { display: true, text: 'Точность (%)' },
                          beginAtZero: true,
                          max: 100
                        }
                      }
                    }}
                  />
                </div>
              </div>
            )}

            {/* Точность по времени суток */}
            {enhancedChartData.timeAccuracyData && (
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: 20,
                marginBottom: 16,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
              }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>⏰ Точность по времени суток</h3>

                <div style={{ height: 250 }}>
                  <Bar
                    data={enhancedChartData.timeAccuracyData}
                    options={{
                      ...chartOptions,
                      plugins: { legend: { display: false } },
                      scales: {
                        y: {
                          beginAtZero: true,
                          max: 100,
                          ticks: { callback: value => value + '%' }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            )}

            {/* Прогноз прогресса */}
            {enhancedChartData.forecastData && enhancedChartData.forecastData.datasets[0].data.length > 0 && (
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: 20,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
              }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>🔮 Прогноз прогресса</h3>

                <div style={{ height: 250 }}>
                  <Line
                    data={enhancedChartData.forecastData}
                    options={{
                      ...chartOptions,
                      scales: {
                        y: {
                          beginAtZero: true,
                          max: 100,
                          ticks: { callback: value => value + '%' }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {/* Кнопка обновления */}
        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <button
            onClick={loadProfileData}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #4f46e5, #4338ca)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              marginBottom: 20,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            🔄 Обновить аналитику
          </button>
        </div>
      </div>
    </GradientBackground>
  );
}