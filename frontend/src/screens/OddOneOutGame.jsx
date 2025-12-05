import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfessorAvatar from '../components/ProfessorAvatar';
import ProfessorReaction from '../components/ProfessorReaction';
import { GradientBackground } from '../ui/Backgrounds';
import { motion } from 'framer-motion';
import axios from 'axios';

// Система уровней сложности
const difficultyLevels = [
  { id: 1, name: 'Легкий', time: 15, basePoints: 10, color: '#10b981' },
  { id: 2, name: 'Средний', time: 12, basePoints: 15, color: '#f59e0b' },
  { id: 3, name: 'Сложный', time: 10, basePoints: 20, color: '#ef4444' },
  { id: 4, name: 'Эксперт', time: 8, basePoints: 25, color: '#7c3aed' },
  { id: 5, name: 'Гений', time: 6, basePoints: 30, color: '#dc2626' }
];

// Система очков
const calculatePoints = (isCorrect, reactionTime, level, complexity) => {
  if (!isCorrect) return 0;

  const levelConfig = difficultyLevels.find(l => l.id === level) || difficultyLevels[0];
  let basePoints = levelConfig.basePoints;

  // Бонус за сложность вопроса
  const complexityBonus = complexity * 2;

  // Бонус за скорость
  let speedMultiplier = 1;
  const maxTime = levelConfig.time;
  const speedPercent = Math.max(0, Math.min(1, (maxTime - reactionTime) / maxTime));

  if (speedPercent > 0.8) speedMultiplier = 1.5;
  else if (speedPercent > 0.6) speedMultiplier = 1.3;
  else if (speedPercent > 0.4) speedMultiplier = 1.2;
  else if (speedPercent > 0.2) speedMultiplier = 1.1;

  return Math.round((basePoints + complexityBonus) * speedMultiplier);
};

// Генератор вопросов с разной сложностью
const generateQuestion = (level) => {
  // Определяем сложность вопроса (1-5)
  const complexity = Math.min(5, Math.floor(level / 1.2) + 1);

  // Все возможные категории вопросов
  const allQuestions = {
    easy: [
      {
        items: ['Яблоко', 'Банан', 'Груша', 'Морковь'],
        answer: 'Морковь',
        category: 'Фрукты/Овощи',
        explanation: 'Морковь - овощ, остальные фрукты',
        complexity: 1
      },
      {
        items: ['Кошка', 'Собака', 'Лев', 'Стол'],
        answer: 'Стол',
        category: 'Животные/Мебель',
        explanation: 'Стол - неживой предмет, остальные животные',
        complexity: 1
      },
      {
        items: ['Роза', 'Тюльпан', 'Дуб', 'Лилия'],
        answer: 'Дуб',
        category: 'Растения',
        explanation: 'Дуб - дерево, остальные цветы',
        complexity: 1
      },
      {
        items: ['Автомобиль', 'Автобус', 'Мотоцикл', 'Самолет'],
        answer: 'Самолет',
        category: 'Транспорт',
        explanation: 'Самолет летает, остальные ездят по земле',
        complexity: 1
      },
      {
        items: ['Январь', 'Февраль', 'Среда', 'Март'],
        answer: 'Среда',
        category: 'Время',
        explanation: 'Среда - день недели, остальные месяцы',
        complexity: 1
      }
    ],
    medium: [
      {
        items: ['Квадрат', 'Круг', 'Треугольник', 'Куб'],
        answer: 'Куб',
        category: 'Геометрия',
        explanation: 'Куб - объемная фигура (3D), остальные плоские (2D)',
        complexity: 2
      },
      {
        items: ['Моцарт', 'Бетховен', 'Чайковский', 'Пикассо'],
        answer: 'Пикассо',
        category: 'Искусство',
        explanation: 'Пикассо - художник, остальные композиторы',
        complexity: 2
      },
      {
        items: ['Вода', 'Молоко', 'Сок', 'Хлеб'],
        answer: 'Хлеб',
        category: 'Пища',
        explanation: 'Хлеб - твердая пища, остальные жидкости',
        complexity: 2
      },
      {
        items: ['Глаз', 'Ухо', 'Нос', 'Палец'],
        answer: 'Палец',
        category: 'Части тела',
        explanation: 'Палец - не орган чувств',
        complexity: 2
      },
      {
        items: ['Кит', 'Акула', 'Дельфин', 'Осьминог'],
        answer: 'Акула',
        category: 'Морские обитатели',
        explanation: 'Акула - рыба, остальные млекопитающие',
        complexity: 2
      }
    ],
    hard: [
      {
        items: ['Гипотеза', 'Теория', 'Закон', 'Мнение'],
        answer: 'Мнение',
        category: 'Наука',
        explanation: 'Мнение - не научный термин',
        complexity: 3
      },
      {
        items: ['Глагол', 'Существительное', 'Прилагательное', 'Буква'],
        answer: 'Буква',
        category: 'Лингвистика',
        explanation: 'Буква - не часть речи',
        complexity: 3
      },
      {
        items: ['Параллелограмм', 'Ромб', 'Квадрат', 'Окружность'],
        answer: 'Окружность',
        category: 'Математика',
        explanation: 'Окружность - не многоугольник',
        complexity: 3
      },
      {
        items: ['Водород', 'Кислород', 'Углерод', 'Железо'],
        answer: 'Железо',
        category: 'Химия',
        explanation: 'Железо - металл, остальные неметаллы',
        complexity: 3
      },
      {
        items: ['Ньютон', 'Эйнштейн', 'Тесла', 'Шекспир'],
        answer: 'Шекспир',
        category: 'История',
        explanation: 'Шекспир - писатель, остальные ученые',
        complexity: 3
      }
    ],
    expert: [
      {
        items: ['Серотонин', 'Дофамин', 'Адреналин', 'Инсулин'],
        answer: 'Инсулин',
        category: 'Биология',
        explanation: 'Инсулин - гормон поджелудочной железы, остальные - нейромедиаторы',
        complexity: 4
      },
      {
        items: ['Java', 'Python', 'HTML', 'JavaScript'],
        answer: 'HTML',
        category: 'Программирование',
        explanation: 'HTML - язык разметки, остальные - языки программирования',
        complexity: 4
      },
      {
        items: ['Импрессионизм', 'Кубизм', 'Сюрреализм', 'Барокко'],
        answer: 'Барокко',
        category: 'Искусство',
        explanation: 'Барокко - стиль в архитектуре и искусстве XVII-XVIII веков, остальные - направления в живописи',
        complexity: 4
      },
      {
        items: ['Меркурий', 'Венера', 'Марс', 'Луна'],
        answer: 'Луна',
        category: 'Астрономия',
        explanation: 'Луна - спутник, остальные планеты',
        complexity: 4
      },
      {
        items: ['Альпы', 'Гималаи', 'Анды', 'Сахара'],
        answer: 'Сахара',
        category: 'География',
        explanation: 'Сахара - пустыня, остальные горные системы',
        complexity: 4
      }
    ],
    genius: [
      {
        items: ['Квант', 'Протон', 'Электрон', 'Фотон'],
        answer: 'Квант',
        category: 'Физика',
        explanation: 'Квант - общее понятие квантовой механики, остальные - конкретные частицы',
        complexity: 5
      },
      {
        items: ['Сонет', 'Ода', 'Поэма', 'Проза'],
        answer: 'Проза',
        category: 'Литература',
        explanation: 'Проза - не стихотворная форма',
        complexity: 5
      },
      {
        items: ['Гедонизм', 'Стоицизм', 'Экзистенциализм', 'Утилитаризм'],
        answer: 'Экзистенциализм',
        category: 'Философия',
        explanation: 'Экзистенциализм - философское направление XX века, остальные - более ранние школы',
        complexity: 5
      },
      {
        items: ['Хроматография', 'Центрифугирование', 'Диализ', 'Кристаллизация'],
        answer: 'Кристаллизация',
        category: 'Химия',
        explanation: 'Кристаллизация - метод очистки веществ, остальные - методы разделения смесей',
        complexity: 5
      },
      {
        items: ['Симфония', 'Концерт', 'Соната', 'Опера'],
        answer: 'Опера',
        category: 'Музыка',
        explanation: 'Опера - включает пение и театральное действие, остальные - инструментальные формы',
        complexity: 5
      }
    ]
  };

  // какие категории вопросов доступны для данного уровня
  let availableQuestions = [];

  if (complexity >= 1) availableQuestions = [...availableQuestions, ...allQuestions.easy];
  if (complexity >= 2) availableQuestions = [...availableQuestions, ...allQuestions.medium];
  if (complexity >= 3) availableQuestions = [...availableQuestions, ...allQuestions.hard];
  if (complexity >= 4) availableQuestions = [...availableQuestions, ...allQuestions.expert];
  if (complexity >= 5) availableQuestions = [...availableQuestions, ...allQuestions.genius];

  // Выбираем случайный вопрос из доступных
  const question = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];

  return {
    ...question,
    items: [...question.items].sort(() => Math.random() - 0.5),
    complexity
  };
};

// Система подсказок
const getHint = (level, category, complexity) => {
  const hints = [
    `Категория: ${category}`,
    `Подумай о классификации...`,
    `Ищи семантическую связь`,
    `Обрати внимание на общие признаки`,
    `Что объединяет три из четырех?`,
    `Попробуй исключить по очереди`,
    `Сравни по нескольким критериям`,
    `Ищи противопоставление`,
    `Подумай о более широкой категории`,
    `Обрати внимание на исключение из правил`
  ];

  // Чем выше сложность, тем менее очевидная подсказка
  let hintIndex = Math.floor(Math.random() * Math.max(1, 6 - complexity));

  // На высоких уровнях более абстрактные подсказки
  if (level >= 4) {
    hintIndex = Math.min(hints.length - 1, hintIndex + 3);
  }

  return hints[hintIndex];
};

export default function OddOneOutGame() {
  const navigate = useNavigate();
  const [question, setQuestion] = useState(generateQuestion(1));
  const [timeLeft, setTimeLeft] = useState(60);
  const [playerScore, setPlayerScore] = useState(0);
  const [botScore, setBotScore] = useState(0);
  const [profState, setProfState] = useState('thinking');
  const [selected, setSelected] = useState(null);
  const [gameStats, setGameStats] = useState({
    correct: 0,
    incorrect: 0,
    total: 0,
    streak: 0,
    maxStreak: 0,
    hintsUsed: 0
  });
  const [showReaction, setShowReaction] = useState(false);
  const [reactionType, setReactionType] = useState('correct');
  const [level, setLevel] = useState(1);
  const [hint, setHint] = useState('');
  const [gameActive, setGameActive] = useState(true);
  const [reactionTime, setReactionTime] = useState(0);
  const [combo, setCombo] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [powerUps, setPowerUps] = useState({
    extraHint: 3,
    timeFreeze: 2,
    skipQuestion: 1
  });
  const [showExplanation, setShowExplanation] = useState(false);

  const timerRef = useRef(null);
  const questionStartTimeRef = useRef(null);
  const correctStreakRef = useRef(0);

  useEffect(() => {
    startNewRound();
    startTimer();

    // Приветствие от профессора
    setTimeout(() => {
      setReactionType('gameStart');
      setShowReaction(true);
      setTimeout(() => setShowReaction(false), 1500);
    }, 500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (timeLeft <= 0 && gameActive) {
      endGame();
    }
  }, [timeLeft, gameActive]);

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startNewRound = () => {
    const newQuestion = generateQuestion(level);
    setQuestion(newQuestion);
    setTimeLeft(difficultyLevels.find(l => l.id === level)?.time || 12);
    setSelected(null);
    setShowReaction(false);
    setShowExplanation(false);
    questionStartTimeRef.current = Date.now();

    // Генерация подсказки
    const newHint = getHint(level, newQuestion.category, newQuestion.complexity);
    setHint(newHint);

    // Бот думает
    const botDelay = Math.max(300, 2000 - (level * 200));
    setTimeout(() => {
      const botAccuracy = Math.max(0.4, 0.95 - (level * 0.1));
      const botChoice = Math.random() < botAccuracy
        ? newQuestion.answer
        : newQuestion.items.filter(item => item !== newQuestion.answer)[0];

      const isBotCorrect = botChoice === newQuestion.answer;
      const botPoints = calculatePoints(isBotCorrect, botDelay/1000, level, newQuestion.complexity);
      setBotScore(prev => prev + botPoints);
      setProfState(isBotCorrect ? 'correct' : 'incorrect');

      setTimeout(() => setProfState('thinking'), 1000);
    }, botDelay);
  };

  const handleSelect = async (item) => {
    if (selected !== null || !gameActive) return;

    setSelected(item);
    const currentTime = Date.now();
    const reactionTimeMs = currentTime - questionStartTimeRef.current;
    const reactionTimeSec = reactionTimeMs / 1000;
    setReactionTime(reactionTimeSec);

    const isCorrect = item === question.answer;

    // Обработка комбо
    if (isCorrect) {
      correctStreakRef.current++;
      if (correctStreakRef.current > gameStats.maxStreak) {
        setGameStats(prev => ({ ...prev, maxStreak: correctStreakRef.current }));
      }
      setCombo(prev => prev + 1);

      // Реакция на комбо
      if (correctStreakRef.current >= 3) {
        setReactionType('combo');
        setShowReaction(true);
        setTimeout(() => setShowReaction(false), 1000);
      }
    } else {
      correctStreakRef.current = 0;
      setCombo(0);
    }

    // Расчет очков
    let points = calculatePoints(isCorrect, reactionTimeSec, level, question.complexity);

    // Бонус за комбо
    if (isCorrect && combo >= 3) {
      points = Math.round(points * (1 + combo * 0.1));
    }

    if (isCorrect) {
      setPlayerScore(prev => prev + points);
    }

    setGameStats(prev => ({
      ...prev,
      correct: prev.correct + (isCorrect ? 1 : 0),
      incorrect: prev.incorrect + (isCorrect ? 0 : 1),
      total: prev.total + 1,
      streak: correctStreakRef.current
    }));

    // Реакция профессора
    setReactionType(isCorrect ? 'correct' : 'incorrect');
    setShowReaction(true);
    setProfState(isCorrect ? 'correct' : 'incorrect');

    // Показать объяснение
    setShowExplanation(true);

    setQuestionsAnswered(prev => prev + 1);

    // Проверка на повышение уровня
    if (isCorrect && gameStats.correct % 5 === 4 && level < 5) {
      setTimeout(() => {
        setLevel(prev => {
          const newLevel = prev + 1;
          setReactionType('levelUp');
          setShowReaction(true);
          // Добавляем время за повышение уровня
          setTimeLeft(prevTime => prevTime + 10);
          return newLevel;
        });
      }, 300);
    }

    // Сохранение результата
    try {
      await axios.post('http://localhost:4000/api/profile/session', {
        game: 'odd',
        score: points,
        correct: isCorrect ? 1 : 0,
        incorrect: isCorrect ? 0 : 1,
        level: level,
        reactionTime: reactionTimeSec,
        complexity: question.complexity,
        combo: combo,
        category: question.category
      });
    } catch (error) {
      console.error('Ошибка сохранения:', error);
    }

    setTimeout(() => {
      setShowReaction(false);
      setProfState('thinking');
      if (gameActive) {
        startNewRound();
      }
    }, 2000);
  };

  const usePowerUp = (type) => {
    if (powerUps[type] > 0) {
      setPowerUps(prev => ({ ...prev, [type]: prev[type] - 1 }));
      setGameStats(prev => ({ ...prev, hintsUsed: prev.hintsUsed + 1 }));

      switch(type) {
        case 'extraHint':
          // Даем дополнительную подсказку
          const extraHints = [
            `Правильный ответ начинается с буквы "${question.answer[0]}"`,
            `Правильный ответ содержит ${question.answer.length} букв`,
            `Это связано с областью: ${question.category}`,
            `Попробуй искать по противопоставлению`
          ];
          const extraHint = extraHints[Math.floor(Math.random() * extraHints.length)];
          setHint(prev => `${prev} | ${extraHint}`);
          break;

        case 'timeFreeze':
          // Замораживаем время на 5 секунд
          clearInterval(timerRef.current);
          setTimeout(() => startTimer(), 5000);
          break;

        case 'skipQuestion':
          // Пропускаем вопрос
          startNewRound();
          break;
      }
    }
  };

  const handleTimeout = () => {
    setGameStats(prev => ({ ...prev, incorrect: prev.incorrect + 1, total: prev.total + 1 }));
    setReactionType('timeout');
    setShowReaction(true);
    setTimeout(() => {
      setShowReaction(false);
      if (gameActive) {
        startNewRound();
      }
    }, 1000);
  };

  const endGame = async () => {
    setGameActive(false);
    clearInterval(timerRef.current);

    setProfState(playerScore > botScore ? 'correct' : 'incorrect');

    // Финальная реплика
    setTimeout(() => {
      setReactionType('gameEnd');
      setShowReaction(true);
    }, 500);

    // Сохранение итогов
    const total = gameStats.correct + gameStats.incorrect;
    const accuracy = total > 0 ? Math.min(100, Math.round((gameStats.correct / total) * 100)) : 0;

    try {
      await axios.post('http://localhost:4000/api/profile/session', {
        game: 'odd',
        score: playerScore,
        correct: gameStats.correct,
        incorrect: gameStats.incorrect,
        accuracy: accuracy,
        duration: 60,
        level: level,
        maxStreak: gameStats.maxStreak,
        hintsUsed: gameStats.hintsUsed,
        categories: question.category,
        final: true,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Ошибка сохранения:', error);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getLevelColor = () => {
    const levelConfig = difficultyLevels.find(l => l.id === level);
    return levelConfig?.color || '#10b981';
  };

  return (
    <GradientBackground>
      <div className="container" style={{ maxWidth: '500px' }}>
        {/* Заголовок игры */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
          position: 'relative'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: '800', color: '#4f46e5' }}>
              {formatTime(timeLeft)}
            </div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Осталось</div>
          </div>

          <div style={{ position: 'relative' }}>
            {showReaction && <ProfessorReaction type={reactionType} />}
            <ProfessorAvatar state={profState} size={60} />
          </div>
        </div>

        {/* Информационная панель */}
        <div style={{ marginBottom: 20 }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
            flexWrap: 'wrap',
            gap: 8
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <div style={{ fontSize: 14, color: '#6b7280' }}>
                Вопрос: <strong>{questionsAnswered + 1}</strong>
              </div>
              {combo > 2 && (
                <div style={{
                  padding: '2px 8px',
                  background: '#fbbf24',
                  color: '#92400e',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 600
                }}>
                  🔥 x{combo}
                </div>
              )}
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <div style={{
                padding: '4px 12px',
                background: getLevelColor(),
                color: 'white',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 600
              }}>
                {difficultyLevels.find(l => l.id === level)?.name || `Уровень ${level}`}
              </div>
              <div style={{
                padding: '4px 8px',
                background: '#f3f4f6',
                color: '#6b7280',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 600
              }}>
                Сложность: {question.complexity}/5
              </div>
            </div>
          </div>

          {/* Основной блок вопроса */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: 24,
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            marginBottom: 16,
            position: 'relative'
          }}>
            {/* Категория */}
            <div style={{
              position: 'absolute',
              top: -10,
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#f3f4f6',
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: 11,
              color: '#6b7280',
              fontWeight: 600
            }}>
              {question.category}
            </div>

            <div style={{
              fontSize: 20,
              fontWeight: 700,
              marginBottom: 16,
              color: '#111827',
              marginTop: 8
            }}>
              Найди лишнее
            </div>

            <div style={{
              fontSize: 14,
              color: '#6b7280',
              marginBottom: 20
            }}>
              Выбери элемент, который не соответствует остальным
            </div>

            {/* Подсказка */}
            {hint && (
              <div style={{
                padding: '12px',
                background: '#f0f9ff',
                borderRadius: '8px',
                color: '#1e40af',
                fontSize: '13px',
                marginBottom: '20px',
                borderLeft: '4px solid #60a5fa'
              }}>
                💡 {hint}
              </div>
            )}

            {/* Объяснение после ответа */}
            {showExplanation && selected && (
              <div style={{
                padding: '12px',
                background: selected === question.answer ? '#f0fdf4' : '#fef2f2',
                borderRadius: '8px',
                color: selected === question.answer ? '#065f46' : '#991b1b',
                fontSize: '13px',
                marginTop: '16px',
                border: `2px solid ${selected === question.answer ? '#10b981' : '#ef4444'}`
              }}>
                {selected === question.answer ? '✅ Правильно!' : '❌ Неправильно!'}
                <div style={{ marginTop: 8, fontWeight: 600 }}>
                  {question.explanation}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Варианты ответов */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          marginBottom: 24
        }}>
          {question.items.map((item, index) => (
            <motion.button
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleSelect(item)}
              disabled={selected !== null || !gameActive}
              style={{
                padding: '20px',
                fontSize: '18px',
                fontWeight: '700',
                border: 'none',
                borderRadius: '12px',
                cursor: selected !== null || !gameActive ? 'default' : 'pointer',
                background: selected === item
                  ? (item === question.answer
                    ? 'linear-gradient(135deg, #10b981, #059669)'
                    : 'linear-gradient(135deg, #ef4444, #dc2626)')
                  : 'linear-gradient(135deg, #4f46e5, #4338ca)',
                color: 'white',
                transition: 'all 0.2s ease',
                opacity: (!gameActive || selected !== null) && selected !== item ? 0.5 : 1,
                minHeight: '80px',
                position: 'relative',
                overflow: 'hidden'
              }}
              whileHover={{ scale: selected !== null || !gameActive ? 1 : 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {item}
            </motion.button>
          ))}
        </div>

        {/* Бонусы */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: 16,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          marginBottom: 16
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#6b7280' }}>
            Бонусы:
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {powerUps.extraHint > 0 && (
              <button
                onClick={() => usePowerUp('extraHint')}
                style={{
                  padding: '8px 12px',
                  background: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
                  color: '#1e40af',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                💡 Подсказка ({powerUps.extraHint})
              </button>
            )}
            {powerUps.timeFreeze > 0 && (
              <button
                onClick={() => usePowerUp('timeFreeze')}
                style={{
                  padding: '8px 12px',
                  background: 'linear-gradient(135deg, #a78bfa, #8b5cf6)',
                  color: '#5b21b6',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                ❄️ Заморозка ({powerUps.timeFreeze})
              </button>
            )}
            {powerUps.skipQuestion > 0 && (
              <button
                onClick={() => usePowerUp('skipQuestion')}
                style={{
                  padding: '8px 12px',
                  background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                  color: '#92400e',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                ⏭️ Пропуск ({powerUps.skipQuestion})
              </button>
            )}
          </div>
        </div>

        {/* Панель статистики */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: 20,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          marginBottom: 16
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 16
          }}>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: 12, color: '#6b7280' }}>Твой счёт</div>
              <div style={{ fontSize: 32, fontWeight: '800', color: '#4f46e5' }}>
                {playerScore}
              </div>
            </div>
            <div style={{ width: 1, background: '#e5e7eb' }} />
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: 12, color: '#6b7280' }}>Профессор</div>
              <div style={{ fontSize: 32, fontWeight: '800', color: '#6b7280' }}>
                {botScore}
              </div>
            </div>
          </div>

          {/* Детальная статистика */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 8,
            background: '#f8fafc',
            padding: 12,
            borderRadius: '8px',
            marginBottom: selected !== null ? 16 : 0
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, color: '#10b981', fontSize: 18 }}>
                {gameStats.correct}
              </div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>Правильно</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, color: '#ef4444', fontSize: 18 }}>
                {gameStats.incorrect}
              </div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>Ошибки</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, color: '#4f46e5', fontSize: 18 }}>
                {gameStats.total ? Math.min(100, Math.round((gameStats.correct / gameStats.total) * 100)) : 0}%
              </div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>Точность</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, color: '#f59e0b', fontSize: 18 }}>
                {gameStats.maxStreak}
              </div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>Серия</div>
            </div>
          </div>

          {/* Дополнительная информация при выборе ответа */}
          {selected !== null && (
            <div style={{
              marginTop: 16,
              padding: 12,
              background: '#f0f9ff',
              borderRadius: '8px',
              fontSize: 13,
              color: '#1e40af'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>Время ответа:</span>
                <span style={{ fontWeight: 600 }}>{reactionTime.toFixed(2)} сек</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Текущая серия:</span>
                <span style={{ fontWeight: 600 }}>{correctStreakRef.current}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Сложность вопроса:</span>
                <span style={{ fontWeight: 600 }}>{question.complexity}/5</span>
              </div>
            </div>
          )}
        </div>

        {/* Управляющие кнопки */}
        <div style={{
          display: 'flex',
          gap: 12,
          marginTop: 24,
          flexWrap: 'wrap'
        }}>
          {gameActive ? (
            <>
              <button
                onClick={endGame}
                style={{
                  flex: 1,
                  padding: '16px 24px',
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  minWidth: '140px'
                }}
              >
                Завершить игру
              </button>
              <button
                onClick={() => {
                  if (gameActive) {
                    setTimeLeft(prev => prev + 30);
                    setPlayerScore(prev => Math.max(0, prev - 50));
                  }
                }}
                style={{
                  flex: 1,
                  padding: '16px 24px',
                  background: 'linear-gradient(135deg, #6b7280, #4b5563)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  minWidth: '140px',
                  opacity: gameActive ? 1 : 0.5
                }}
                disabled={!gameActive}
              >
                +30 сек (-50 очков)
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate('/results', {
                  state: {
                    gameStats,
                    playerScore,
                    botScore,
                    gameName: 'Лишний предмет',
                    duration: 60,
                    level: level,
                    maxStreak: gameStats.maxStreak,
                    categories: question.category
                  }
                })}
                style={{
                  flex: 1,
                  padding: '16px 24px',
                  background: 'linear-gradient(135deg, #4f46e5, #4338ca)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  minWidth: '140px'
                }}
              >
                Результаты
              </button>
              <button
                onClick={() => navigate('/select')}
                style={{
                  flex: 1,
                  padding: '16px 24px',
                  background: 'linear-gradient(135deg, #6b7280, #4b5563)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  minWidth: '140px'
                }}
              >
                К играм
              </button>
            </>
          )}
        </div>

        {/* Анимационные стили */}
        <style>{`
          @keyframes pulse {
            0% { transform: translateX(-50%) scale(1); }
            50% { transform: translateX(-50%) scale(1.05); }
            100% { transform: translateX(-50%) scale(1); }
          }

          @keyframes correctGlow {
            0% { box-shadow: 0 0 5px #10b981; }
            50% { box-shadow: 0 0 20px #10b981; }
            100% { box-shadow: 0 0 5px #10b981; }
          }

          @keyframes incorrectGlow {
            0% { box-shadow: 0 0 5px #ef4444; }
            50% { box-shadow: 0 0 20px #ef4444; }
            100% { box-shadow: 0 0 5px #ef4444; }
          }
        `}</style>
      </div>
    </GradientBackground>
  );
}