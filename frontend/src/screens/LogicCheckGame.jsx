import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfessorAvatar from '../components/ProfessorAvatar';
import ProfessorReaction from '../components/ProfessorReaction';
import { GradientBackground } from '../ui/Backgrounds';
import { motion } from 'framer-motion';
import axios from 'axios';

// Система уровней сложности
const difficultyLevels = [
  { id: 1, name: 'Начинающий', time: 20, points: 10, color: '#10b981' },
  { id: 2, name: 'Студент', time: 16, points: 15, color: '#3b82f6' },
  { id: 3, name: 'Аналитик', time: 13, points: 20, color: '#f59e0b' },
  { id: 4, name: 'Логик', time: 10, points: 25, color: '#8b5cf6' },
  { id: 5, name: 'Философ', time: 8, points: 30, color: '#dc2626' }
];

// Реплики профессора
const professorPhrases = {
  gameStart: [
    "Привет, логик! Давай проверим твое мышление! 🧠",
    "Готов к логическим битвам? Покажи, на что способен твой разум! ⚔️",
    "Искусство логики требует ясности ума. Начнем тренировку! 📚"
  ],
  correct: [
    "Блестяще! Твоя логика не знает изъянов! ✨",
    "Идеально! Ты разгадал этот силлогизм как истинный логик! 🎯",
    "Восхитительно! Твое аналитическое мышление на высоте! 🏆",
    "Точно в цель! Ты видишь логические связи как никто другой! 🔗",
    "Феноменально! Профессор гордится твоим умом! 👨‍🎓"
  ],
  incorrect: [
    "Интересный подход! Но давай разберем эту логическую цепочку вместе! 🤔",
    "Не переживай! Даже Аристотель иногда ошибался! 📜",
    "Это была сложная задача! Давай проанализируем ошибку! 🔍",
    "Каждая ошибка - шаг к совершенству! Главное - понять причину! 🚀",
    "Запутанная логика! Давай вместе разберемся в этом парадоксе! 🌀"
  ],
  levelUp: [
    "Вау! Ты перешел на новый уровень логического мышления! ⬆️",
    "Превосходно! Твоя логика стала еще острее! 🔪",
    "Теперь задачи станут сложнее, но я верю в тебя! 💪"
  ],
  combo: [
    "🔥 Горячая серия! Ты на правильном пути!",
    "🎯 Идеальная точность! Продолжай в том же духе!",
    "⚡ Невероятная скорость мышления!",
    "🧩 Ты собираешь логические пазлы как мастер!"
  ],
  timeout: [
    "Время вышло! Быстрота ума - тоже важный навык! ⏰",
    "Нужно думать быстрее! Логика любит скорость! 🏃‍♂️",
    "Таймер подгоняет! Следующий раз будь проворнее! ⚡"
  ],
  gameEnd: [
    "Великолепная тренировка логики! Ты стал сильнее! 💪",
    "Игра окончена! Твои логические способности впечатляют! 🎮",
    "Замечательная работа! Профессор доволен твоим прогрессом! 👨‍🏫"
  ]
};

// Генератор логических вопросов с прогрессивной сложностью
const generateLogicQuestion = (level) => {
  const questions = {
    // Уровень 1: Базовые силлогизмы
    level1: [
      {
        id: 1,
        text: 'Все квадраты - прямоугольники. Все прямоугольники имеют четыре стороны. Значит, все квадраты имеют четыре стороны.',
        correct: true,
        type: 'Категорический силлогизм',
        explanation: 'Это правильный силлогизм: если все квадраты - прямоугольники, а все прямоугольники имеют 4 стороны, то квадраты наследуют это свойство.'
      },
      {
        id: 2,
        text: 'Все птицы умеют летать. Пингвин - птица. Значит, пингвин умеет летать.',
        correct: false,
        type: 'Ложное обобщение',
        explanation: 'Первая посылка неверна: не все птицы умеют летать (пример: пингвины, страусы).'
      },
      {
        id: 3,
        text: 'Если идет дождь, то улицы мокрые. Улицы мокрые. Значит, идет дождь.',
        correct: false,
        type: 'Ошибка утверждения консеквента',
        explanation: 'Улицы могут быть мокрыми по другим причинам (полив, разлив воды и т.д.).'
      }
    ],

    // Уровень 2: Кванторы и отрицания
    level2: [
      {
        id: 4,
        text: 'Некоторые студенты любят математику. Петр - студент. Значит, Петр любит математику.',
        correct: false,
        type: 'Ошибка квантора',
        explanation: '"Некоторые" не означает "все", поэтому нельзя делать вывод о конкретном человеке.'
      },
      {
        id: 5,
        text: 'Ни один кот не умеет лаять. Мурзик - кот. Значит, Мурзик не умеет лаять.',
        correct: true,
        type: 'Отрицательный силлогизм',
        explanation: 'Правильное применение отрицательного квантора.'
      },
      {
        id: 6,
        text: 'Все рыбы живут в воде. Кит живет в воде. Значит, кит - рыба.',
        correct: false,
        type: 'Ошибка обратного следования',
        explanation: 'Из "все А есть Б" не следует "все Б есть А".'
      }
    ],

    // Уровень 3: Парадоксы и софизмы
    level3: [
      {
        id: 7,
        text: 'Это высказывание ложно. Значит, оно истинно.',
        correct: true,
        type: 'Парадокс лжеца',
        explanation: 'Классический логический парадокс: если высказывание ложно, то оно говорит правду о своей ложности.'
      },
      {
        id: 8,
        text: 'Все люди смертны. Сократ - человек. Значит, Сократ смертен.',
        correct: true,
        type: 'Дедуктивный вывод',
        explanation: 'Правильный пример дедуктивного рассуждения по Аристотелю.'
      },
      {
        id: 9,
        text: 'Не бывает абсолютной истины. Это утверждение - абсолютная истина. Значит, оно ложно.',
        correct: true,
        type: 'Парадокс релятивизма',
        explanation: 'Если нет абсолютных истин, то это утверждение не может быть абсолютно истинным.'
      }
    ],

    // Уровень 4: Формальная логика
    level4: [
      {
        id: 10,
        text: 'Если A ⊆ B и B ⊆ C, то A ⊆ C. Известно, что X ⊆ Y и Y ⊆ Z. Следовательно, X ⊆ Z.',
        correct: true,
        type: 'Транзитивность включения',
        explanation: 'Свойство транзитивности множественного включения.'
      },
      {
        id: 11,
        text: 'p → q, ¬q, следовательно ¬p. Это правило модус толленс.',
        correct: true,
        type: 'Модус толленс',
        explanation: 'Правильная форма логического вывода: отрицание следствия ведет к отрицанию основания.'
      },
      {
        id: 12,
        text: '(p → q) ∧ p → q. Это тавтология.',
        correct: true,
        type: 'Модус поненс',
        explanation: 'Классическое правило вывода в пропозициональной логике.'
      }
    ],

    // Уровень 5: Комплексные логические задачи
    level5: [
      {
        id: 13,
        text: 'Если яблоко красное, то оно спелое. Это яблоко спелое. Значит, оно красное.',
        correct: false,
        type: 'Ошибка утверждения консеквента',
        explanation: 'Из "если красное, то спелое" не следует "если спелое, то красное". Спелые яблоки могут быть зелеными или желтыми.'
      },
      {
        id: 14,
        text: 'Все четные числа делятся на 2. Число 4 делится на 2. Значит, 4 - четное число.',
        correct: true,
        type: 'Дефиниция',
        explanation: 'Это определение четного числа, поэтому вывод корректен.'
      },
      {
        id: 15,
        text: 'Ни один ложный аргумент не является убедительным. Некоторые убедительные аргументы неверны. Значит, некоторые неверные аргументы убедительны.',
        correct: false,
        type: 'Квадрат противоположностей',
        explanation: 'Из "ни один ложный не убедителен" следует "все убедительные истинны", поэтому вторая посылка противоречит первой.'
      }
    ]
  };

  // Дополнительные сложные вопросы для каждого уровня
  const extraQuestions = {
    level3: [
      {
        id: 16,
        text: 'Я всегда лгу. Это высказывание является истинным.',
        correct: false,
        type: 'Парадокс Эпименида',
        explanation: 'Если говорящий всегда лжет, то это утверждение должно быть ложным, но тогда он говорит правду - парадокс.'
      }
    ],
    level4: [
      {
        id: 17,
        text: '∀x(P(x) → Q(x)), ∃x(P(x) ∧ ¬Q(x)) - это противоречие.',
        correct: true,
        type: 'Предикатная логика',
        explanation: 'Второе утверждение отрицает первое, создавая противоречие.'
      }
    ],
    level5: [
      {
        id: 18,
        text: 'Если бы этот ключ подошел, дверь бы открылась. Дверь открылась. Значит, ключ подошел.',
        correct: false,
        type: 'Контрфактическое умозаключение',
        explanation: 'Дверь могла открыться другим способом (открыл кто-то изнутри, другой ключ и т.д.).'
      }
    ]
  };

  // вопросы в зависимости от уровня
  let pool = [];

  for (let i = 1; i <= level; i++) {
    pool = [...pool, ...questions[`level${i}`]];
  }

  // дополнительные вопросы для уровней 3-5
  if (level >= 3) pool = [...pool, ...extraQuestions.level3];
  if (level >= 4) pool = [...pool, ...extraQuestions.level4];
  if (level >= 5) pool = [...pool, ...extraQuestions.level5];

  // Удаляем дубликаты по id
  const uniquePool = [...new Map(pool.map(item => [item.id, item])).values()];

  return uniquePool[Math.floor(Math.random() * uniquePool.length)];
};

// Расчет очков с учетом сложности и скорости
const calculatePoints = (isCorrect, reactionTime, level, questionType) => {
  if (!isCorrect) return 0;

  const levelConfig = difficultyLevels.find(l => l.id === level) || difficultyLevels[0];
  let basePoints = levelConfig.points;

  // Бонус за сложность типа вопроса
  let typeBonus = 0;
  if (questionType.includes('парадокс')) typeBonus = 8;
  else if (questionType.includes('формальн')) typeBonus = 6;
  else if (questionType.includes('квантор')) typeBonus = 4;

  // Бонус за скорость
  let speedMultiplier = 1;
  const maxTime = levelConfig.time;
  const speedPercent = Math.max(0, Math.min(1, (maxTime - reactionTime) / maxTime));

  if (speedPercent > 0.8) speedMultiplier = 1.6;
  else if (speedPercent > 0.6) speedMultiplier = 1.4;
  else if (speedPercent > 0.4) speedMultiplier = 1.2;
  else if (speedPercent > 0.2) speedMultiplier = 1.1;

  return Math.round((basePoints + typeBonus) * speedMultiplier);
};

// Получение случайной фразы профессора
const getProfessorPhrase = (type) => {
  const phrases = professorPhrases[type];
  return phrases ? phrases[Math.floor(Math.random() * phrases.length)] : '';
};

export default function LogicCheckGame() {
  const navigate = useNavigate();
  const [question, setQuestion] = useState(generateLogicQuestion(1));
  const [timeLeft, setTimeLeft] = useState(20);
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
    avgReactionTime: 0
  });
  const [showReaction, setShowReaction] = useState(false);
  const [reactionType, setReactionType] = useState('correct');
  const [level, setLevel] = useState(1);
  const [round, setRound] = useState(1);
  const [combo, setCombo] = useState(0);
  const [gameActive, setGameActive] = useState(true);
  const [reactionTime, setReactionTime] = useState(0);
  const [professorMessage, setProfessorMessage] = useState('');
  const [showExplanation, setShowExplanation] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);

  const timerRef = useRef(null);
  const questionStartTimeRef = useRef(null);
  const correctStreakRef = useRef(0);
  const reactionTimesRef = useRef([]);

  useEffect(() => {
    startNewRound();

    // Приветственное сообщение профессора
    setTimeout(() => {
      setProfessorMessage(getProfessorPhrase('gameStart'));
      setShowReaction(true);
      setTimeout(() => setShowReaction(false), 2000);
    }, 500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (timeLeft <= 0 && gameActive) {
      handleTimeout();
    }
  }, [timeLeft, gameActive]);

  const startNewRound = () => {
    const newQuestion = generateLogicQuestion(level);
    setQuestion(newQuestion);
    setTimeLeft(difficultyLevels.find(l => l.id === level)?.time || 15);
    setSelected(null);
    setShowReaction(false);
    setShowExplanation(false);
    setHintUsed(false);
    questionStartTimeRef.current = Date.now();
    const botBaseDelay = 1000;
    const levelPenalty = (level - 1) * 200;
    const randomVariance = Math.random() * 500;
    const botDelay = botBaseDelay + levelPenalty + randomVariance;

    setTimeout(() => {
      const botAccuracy = Math.max(0.6, 0.95 - (level * 0.07));
      const botChoice = Math.random() < botAccuracy ? newQuestion.correct : !newQuestion.correct;

      const botPoints = calculatePoints(botChoice === newQuestion.correct, botDelay/1500, level, newQuestion.type);
      setBotScore(prev => prev + botPoints);
      setProfState(botChoice === newQuestion.correct ? 'correct' : 'incorrect');

      setTimeout(() => setProfState('thinking'), 1000);
    }, botDelay);

    // Запуск таймера
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

  const handleAnswer = async (answer) => {
    if (selected !== null || !gameActive) return;

    clearInterval(timerRef.current);
    setSelected(answer);

    const currentTime = Date.now();
    const reactionTimeMs = currentTime - questionStartTimeRef.current;
    const reactionTimeSec = reactionTimeMs / 1000;
    setReactionTime(reactionTimeSec);

    // время реакции для статистики
    reactionTimesRef.current.push(reactionTimeSec);

    const isCorrect = answer === question.correct;

    // Обработка комбо
    if (isCorrect) {
      correctStreakRef.current++;
      setCombo(prev => prev + 1);

      if (correctStreakRef.current > gameStats.maxStreak) {
        setGameStats(prev => ({ ...prev, maxStreak: correctStreakRef.current }));
      }

      // Сообщение о комбо
      if (combo >= 3) {
        setTimeout(() => {
          setProfessorMessage(getProfessorPhrase('combo'));
          setShowReaction(true);
          setTimeout(() => setShowReaction(false), 1500);
        }, 500);
      }
    } else {
      correctStreakRef.current = 0;
      setCombo(0);
    }

    // Расчет очков
    const points = calculatePoints(isCorrect, reactionTimeSec, level, question.type);

    if (isCorrect) {
      setPlayerScore(prev => prev + points);
    }

    setGameStats(prev => ({
      ...prev,
      correct: prev.correct + (isCorrect ? 1 : 0),
      incorrect: prev.incorrect + (isCorrect ? 0 : 1),
      total: prev.total + 1,
      streak: correctStreakRef.current,
      avgReactionTime: reactionTimesRef.current.reduce((a, b) => a + b, 0) / reactionTimesRef.current.length
    }));

    // Реакция профессора
    setReactionType(isCorrect ? 'correct' : 'incorrect');
    setShowReaction(true);
    setProfState(isCorrect ? 'correct' : 'incorrect');
    setProfessorMessage(getProfessorPhrase(isCorrect ? 'correct' : 'incorrect'));

    // Показ объяснения
    setTimeout(() => {
      setShowExplanation(true);
    }, 800);

    // Сохранение результата
    try {
      await axios.post('http://localhost:4000/api/profile/session', {
        game: 'logic',
        score: isCorrect ? points : 0,
        correct: isCorrect ? 1 : 0,
        incorrect: isCorrect ? 0 : 1,
        level: level,
        reactionTime: reactionTimeSec,
        questionType: question.type,
        combo: combo
      });
    } catch (error) {
      console.error('Ошибка сохранения:', error);
    }

    // Проверка на повышение уровня
    if (isCorrect && gameStats.correct % 7 === 6 && level < 5) {
      setTimeout(() => {
        setLevel(prev => {
          const newLevel = prev + 1;
          setProfessorMessage(getProfessorPhrase('levelUp'));
          setShowReaction(true);
          return newLevel;
        });
      }, 1200);
    }

    // Переход к следующему раунду
    setTimeout(() => {
      setShowReaction(false);
      setShowExplanation(false);
      setRound(prev => prev + 1);

      if (gameActive) {
        startNewRound();
      }
    }, 2500);
  };

  const handleTimeout = () => {
    setGameStats(prev => ({
      ...prev,
      incorrect: prev.incorrect + 1,
      total: prev.total + 1
    }));

    setProfessorMessage(getProfessorPhrase('timeout'));
    setShowReaction(true);

    setTimeout(() => {
      setShowReaction(false);
      if (gameActive) {
        startNewRound();
      }
    }, 1500);
  };

  const useHint = () => {
    if (hintUsed || selected !== null) return;

    setHintUsed(true);
    setPlayerScore(prev => Math.max(0, prev - 10));

    // Подсказка: убираем один неправильный вариант (если возможно)
    setProfessorMessage("💡 Подсказка: проанализируй структуру аргумента");
    setShowReaction(true);
    setTimeout(() => setShowReaction(false), 1500);
  };

  const endGame = async () => {
    setGameActive(false);
    clearInterval(timerRef.current);

    setProfState(playerScore > botScore ? 'correct' : 'incorrect');
    setProfessorMessage(getProfessorPhrase('gameEnd'));
    setShowReaction(true);

    // Сохранение итогов
    const total = gameStats.correct + gameStats.incorrect;
    const accuracy = total > 0 ? Math.min(100, Math.round((gameStats.correct / total) * 100)) : 0;
    const avgReactionTime = reactionTimesRef.current.length > 0
      ? reactionTimesRef.current.reduce((a, b) => a + b, 0) / reactionTimesRef.current.length
      : 0;

    try {
      await axios.post('http://localhost:4000/api/profile/session', {
        game: 'logic',
        score: playerScore,
        correct: gameStats.correct,
        incorrect: gameStats.incorrect,
        accuracy: accuracy,
        duration: 20,
        level: level,
        maxStreak: gameStats.maxStreak,
        avgReactionTime: avgReactionTime,
        questionTypes: question.type,
        final: true,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Ошибка сохранения:', error);
    }
  };

  const getLevelColor = () => {
    const levelConfig = difficultyLevels.find(l => l.id === level);
    return levelConfig?.color || '#10b981';
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <GradientBackground>
      <div className="container" style={{ maxWidth: '500px' }}>
        {/* Верхняя панель с таймером и аватаром */}
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
            <div style={{ fontSize: 12, color: '#6b7280' }}>Время на ответ</div>
          </div>

          <div style={{ position: 'relative' }}>
            {showReaction && (
              <>
                <ProfessorReaction type={reactionType} />
                {professorMessage && (
                  <div style={{
                    position: 'absolute',
                    top: -40,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'white',
                    padding: '8px 16px',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#111827',
                    whiteSpace: 'nowrap',
                    zIndex: 100
                  }}>
                    {professorMessage}
                  </div>
                )}
              </>
            )}
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
                Раунд: <strong>{round}</strong>
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
            </div>
          </div>

          {/* Карточка с вопросом */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: 24,
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            marginBottom: 16,
            position: 'relative'
          }}>
            {/* Тип вопроса */}
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
              {question.type}
            </div>

            <div style={{
              fontSize: 16,
              fontWeight: 600,
              marginBottom: 16,
              color: '#6b7280',
              marginTop: 8
            }}>
              Определи, верно ли утверждение:
            </div>

            <div style={{
              fontSize: 18,
              fontWeight: '600',
              color: '#111827',
              margin: '16px 0',
              lineHeight: 1.5,
              textAlign: 'left',
              padding: '16px',
              background: '#f8fafc',
              borderRadius: '12px',
              borderLeft: '4px solid #4f46e5'
            }}>
              "{question.text}"
            </div>

            <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 8 }}>
              {gameActive ? 'Выбери верный или неверный вариант' : 'Игра завершена!'}
            </div>
          </div>

          {/* Объяснение (показывается после ответа) */}
          {showExplanation && question.explanation && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: '#f0f9ff',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '16px',
                borderLeft: '4px solid #3b82f6'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 8,
                color: '#1e40af'
              }}>
                <span style={{ fontSize: '18px' }}>📚</span>
                <span style={{ fontWeight: 600, fontSize: '14px' }}>Объяснение:</span>
              </div>
              <div style={{ fontSize: '13px', color: '#1e40af', lineHeight: 1.5 }}>
                {question.explanation}
              </div>
            </motion.div>
          )}
        </div>

        {/* Кнопки ответов */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          <motion.button
            whileTap={{ scale: selected !== null ? 1 : 0.95 }}
            onClick={() => handleAnswer(true)}
            disabled={selected !== null || !gameActive}
            style={{
              padding: '20px',
              fontSize: '18px',
              fontWeight: '700',
              border: 'none',
              borderRadius: '12px',
              cursor: selected !== null || !gameActive ? 'default' : 'pointer',
              background: selected === true
                ? (question.correct === true
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : 'linear-gradient(135deg, #ef4444, #dc2626)')
                : 'linear-gradient(135deg, #4f46e5, #4338ca)',
              color: 'white',
              transition: 'all 0.2s ease',
              opacity: (!gameActive || selected !== null) && selected !== true ? 0.5 : 1,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            ✓ Верное утверждение
            {selected === true && question.correct === true && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px'
                }}
              />
            )}
          </motion.button>

          <motion.button
            whileTap={{ scale: selected !== null ? 1 : 0.95 }}
            onClick={() => handleAnswer(false)}
            disabled={selected !== null || !gameActive}
            style={{
              padding: '20px',
              fontSize: '18px',
              fontWeight: '700',
              border: 'none',
              borderRadius: '12px',
              cursor: selected !== null || !gameActive ? 'default' : 'pointer',
              background: selected === false
                ? (question.correct === false
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : 'linear-gradient(135deg, #ef4444, #dc2626)')
                : 'linear-gradient(135deg, #4f46e5, #4338ca)',
              color: 'white',
              transition: 'all 0.2s ease',
              opacity: (!gameActive || selected !== null) && selected !== false ? 0.5 : 1,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            ✗ Неверное утверждение
            {selected === false && question.correct === false && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px'
                }}
              />
            )}
          </motion.button>
        </div>

        {/* Кнопка подсказки */}
        {!hintUsed && selected === null && gameActive && (
          <div style={{ marginBottom: 16, textAlign: 'center' }}>
            <button
              onClick={useHint}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                color: '#92400e',
                border: 'none',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              💡 Получить подсказку (-10 очков)
            </button>
          </div>
        )}

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
              <div style={{ fontSize: 11, color: '#6b7280' }}>Верно</div>
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

          {/* Информация о времени реакции */}
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
                <span>Время размышления:</span>
                <span style={{ fontWeight: 600 }}>{reactionTime.toFixed(2)} сек</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Текущая серия:</span>
                <span style={{ fontWeight: 600 }}>{correctStreakRef.current}</span>
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
          ) : (
            <>
              <button
                onClick={() => navigate('/results', {
                  state: {
                    gameStats,
                    playerScore,
                    botScore,
                    gameName: 'Логическая проверка',
                    duration: 20,
                    level: level,
                    maxStreak: gameStats.maxStreak
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
      </div>
    </GradientBackground>
  );
}