import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfessorAvatar from '../components/ProfessorAvatar';
import ProfessorReaction from '../components/ProfessorReaction';
import { GradientBackground } from '../ui/Backgrounds';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

// Система уровней сложности
const difficultyLevels = [
  {
    id: 1,
    name: 'Новичок',
    sequenceLength: 4,
    symbolsCount: 4,
    showTime: 2000,
    bonusTime: 20,
    color: '#10b981'
  },
  {
    id: 2,
    name: 'Ученик',
    sequenceLength: 5,
    symbolsCount: 5,
    showTime: 1800,
    bonusTime: 18,
    color: '#3b82f6'
  },
  {
    id: 3,
    name: 'Практик',
    sequenceLength: 6,
    symbolsCount: 6,
    showTime: 1600,
    bonusTime: 16,
    color: '#f59e0b'
  },
  {
    id: 4,
    name: 'Мастер',
    sequenceLength: 7,
    symbolsCount: 7,
    showTime: 1400,
    bonusTime: 14,
    color: '#ec4899'
  },
  {
    id: 5,
    name: 'Гений',
    sequenceLength: 8,
    symbolsCount: 8,
    showTime: 1200,
    bonusTime: 12,
    color: '#7c3aed'
  },
  {
    id: 6,
    name: 'Легенда',
    sequenceLength: 9,
    symbolsCount: 9,
    showTime: 1000,
    bonusTime: 10,
    color: '#dc2626'
  },
  {
    id: 7,
    name: 'Титан памяти',
    sequenceLength: 10,
    symbolsCount: 10,
    showTime: 800,
    bonusTime: 8,
    color: '#000000'
  }
];

// Расширенный набор символов
const SYMBOLS = [
  { symbol: '▲', name: 'треугольник', color: '#4f46e5' },
  { symbol: '●', name: 'круг', color: '#ef4444' },
  { symbol: '■', name: 'квадрат', color: '#10b981' },
  { symbol: '★', name: 'звезда', color: '#fbbf24' },
  { symbol: '◆', name: 'ромб', color: '#8b5cf6' },
  { symbol: '♥', name: 'сердце', color: '#ec4899' },
  { symbol: '♣', name: 'крести', color: '#065f46' },
  { symbol: '♦', name: 'бубны', color: '#be123c' },
  { symbol: '⚫', name: 'черный круг', color: '#000000' },
  { symbol: '🔺', name: 'красный треугольник', color: '#dc2626' },
  { symbol: '🔵', name: 'синий круг', color: '#1d4ed8' },
  { symbol: '🟩', name: 'зеленый квадрат', color: '#16a34a' },
  { symbol: '🟨', name: 'желтый квадрат', color: '#ca8a04' },
  { symbol: '🟧', name: 'оранжевый квадрат', color: '#ea580c' },
  { symbol: '🟪', name: 'фиолетовый квадрат', color: '#7c3aed' }
];

// Типы последовательностей
const sequenceTypes = [
  { id: 'simple', name: 'Простая', multiplier: 1 },
  { id: 'color_shift', name: 'Смена цвета', multiplier: 1.2 },
  { id: 'pattern', name: 'Паттерн', multiplier: 1.3 },
  { id: 'alternating', name: 'Чередование', multiplier: 1.4 },
  { id: 'mirror', name: 'Зеркальная', multiplier: 1.5 },
  { id: 'progressive', name: 'Прогрессирующая', multiplier: 1.6 }
];

// Правильная система очков
const calculatePoints = (correct, total, level, sequenceType, timeBonus, combo) => {
  const basePoints = 10;
  const levelBonus = level * 3;
  const accuracy = correct / total;
  const typeMultiplier = sequenceTypes.find(t => t.id === sequenceType)?.multiplier || 1;

  let accuracyBonus = 0;
  if (accuracy === 1) accuracyBonus = 20; // Идеально
  else if (accuracy >= 0.8) accuracyBonus = 10;
  else if (accuracy >= 0.6) accuracyBonus = 5;

  const comboBonus = Math.min(15, combo * 2);
  const speedBonus = timeBonus ? 5 : 0;

  return Math.round(
    (basePoints + levelBonus + accuracyBonus + speedBonus + comboBonus) *
    typeMultiplier *
    accuracy
  );
};

// Генератор сложных последовательностей
function generateSequence(level, sequenceType) {
  const levelConfig = difficultyLevels.find(l => l.id === level) || difficultyLevels[0];
  const symbols = SYMBOLS.slice(0, levelConfig.symbolsCount);
  const length = levelConfig.sequenceLength;

  let sequence = [];

  switch(sequenceType) {
    case 'simple':
      // Простая случайная последовательность
      for (let i = 0; i < length; i++) {
        sequence.push(symbols[Math.floor(Math.random() * symbols.length)]);
      }
      break;

    case 'color_shift':
      // Смена цвета у одного символа
      const baseSymbol = symbols[Math.floor(Math.random() * symbols.length)];
      sequence.push(baseSymbol);
      for (let i = 1; i < length; i++) {
        const newSymbol = {
          ...baseSymbol,
          color: SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].color
        };
        sequence.push(newSymbol);
      }
      break;

    case 'pattern':
      // Повторяющийся паттерн
      const patternLength = Math.min(3, length);
      const pattern = [];
      for (let i = 0; i < patternLength; i++) {
        pattern.push(symbols[Math.floor(Math.random() * symbols.length)]);
      }
      for (let i = 0; i < length; i++) {
        sequence.push(pattern[i % patternLength]);
      }
      break;

    case 'alternating':
      // Чередование двух символов
      const symbol1 = symbols[Math.floor(Math.random() * symbols.length)];
      const symbol2 = symbols[Math.floor(Math.random() * symbols.length)];
      while (symbol1.symbol === symbol2.symbol) {
        symbol2 = symbols[Math.floor(Math.random() * symbols.length)];
      }
      for (let i = 0; i < length; i++) {
        sequence.push(i % 2 === 0 ? symbol1 : symbol2);
      }
      break;

    case 'mirror':
      // Зеркальная последовательность
      const halfLength = Math.ceil(length / 2);
      const halfSequence = [];
      for (let i = 0; i < halfLength; i++) {
        halfSequence.push(symbols[Math.floor(Math.random() * symbols.length)]);
      }
      sequence = [...halfSequence];
      for (let i = length - halfLength - 1; i >= 0; i--) {
        sequence.push(halfSequence[i]);
      }
      break;

    case 'progressive':
      // Прогрессирующая сложность
      const baseSymbols = symbols.slice(0, Math.min(4, symbols.length));
      for (let i = 0; i < length; i++) {
        const symbolIndex = i % baseSymbols.length;
        const symbol = baseSymbols[symbolIndex];
        // Добавляем эффект прогрессии
        if (i >= Math.floor(length * 0.7)) {
          sequence.push({
            ...symbol,
            color: i % 2 === 0 ? '#ef4444' : symbol.color
          });
        } else {
          sequence.push(symbol);
        }
      }
      break;

    default:
      for (let i = 0; i < length; i++) {
        sequence.push(symbols[Math.floor(Math.random() * symbols.length)]);
      }
  }

  return {
    symbols: sequence,
    type: sequenceType,
    length: sequence.length,
    level: level
  };
}

// Реплики профессора
const professorMessages = {
  start: [
    "Давайте проверим вашу память! 🧠",
    "Приготовьтесь запоминать! ⚡",
    "Показываю последовательность, будьте внимательны! 👀",
    "Сейчас будет испытание для вашей памяти! 💾",
    "Готовы проверить свои способности? 🎯"
  ],
  showSequence: [
    "Смотрите внимательно! 👁️",
    "Запоминайте! 📝",
    "Обратите внимание на детали! 🔍",
    "Эта последовательность важна! ⭐",
    "Запомните каждый символ! 🧩"
  ],
  correct: [
    "Отлично! Память работает идеально! 🎉",
    "Потрясающе! Вы настоящий гений памяти! 🧠",
    "Браво! Вы запомнили всё правильно! 🏆",
    "Идеально! Ваша память просто феноменальна! ✨",
    "Великолепно! Вы справляетесь лучше, чем я ожидал! 🌟"
  ],
  incorrect: [
    "Ничего страшного! Память нужно тренировать! 💪",
    "Почти получилось! Попробуйте ещё раз! 🔄",
    "Это сложная последовательность, но вы справитесь! 🛡️",
    "Не переживайте! Ошибки помогают учиться! 📚",
    "Сосредоточьтесь, в следующий раз точно получится! 🎯"
  ],
  levelUp: [
    "Вау! Вы перешли на новый уровень сложности! 🚀",
    "Поздравляю! Ваша память стала ещё лучше! 📈",
    "Отличный прогресс! Готовы к большему? 🏔️",
    "Вы справляетесь прекрасно! Усложняем задачу! ⚡",
    "Ваши способности растут! Новый уровень активирован! 🌟"
  ],
  combo: [
    "Ого! Комбо! Продолжайте в том же духе! 🔥",
    "Невероятно! Вы на волне успеха! 🌊",
    "Фантастика! Комбо растет! ⚡",
    "Вы не останавливаетесь! Продолжайте! 🚀",
    "Удивительная серия правильных ответов! 🎖️"
  ],
  perfect: [
    "Сто процентов! Идеальная память! 💯",
    "Безупречно! Ни одной ошибки! ✨",
    "Абсолютный рекорд! Вы мастер памяти! 👑",
    "Идеальный результат! Профессор восхищен! 🎭",
    "100% точность! Вы машина для запоминания! 🤖"
  ],
  timeBonus: [
    "Отлично! Бонус за скорость! ⚡",
    "Быстро и точно! Дополнительные очки! 🎯",
    "Время - ваш союзник! Бонус получен! ⏱️",
    "Молниеносная реакция! Награда за скорость! ⚡",
    "Вы успели вовремя! Бонусные очки! 🏆"
  ],
  endGame: [
    "Отличная тренировка памяти! 🧠",
    "Вы хорошо поработали! Ваша память стала лучше! 📈",
    "Впечатляющие результаты! Продолжайте тренироваться! 💪",
    "Память как мышца - чем больше тренируете, тем сильнее! 🏋️",
    "Сегодня вы сделали большой шаг в развитии памяти! 🚀"
  ]
};

export default function MemoryFlashGame() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('waiting'); // 'waiting', 'show', 'input', 'result'
  const [sequence, setSequence] = useState(null);
  const [playerInput, setPlayerInput] = useState([]);
  const [timeLeft, setTimeLeft] = useState(20);
  const [playerScore, setPlayerScore] = useState(0);
  const [botScore, setBotScore] = useState(0);
  const [profState, setProfState] = useState('playful');
  const [gameStats, setGameStats] = useState({
    correct: 0,
    incorrect: 0,
    total: 0,
    perfectRounds: 0,
    maxCombo: 0,
    avgAccuracy: 0
  });
  const [showReaction, setShowReaction] = useState(false);
  const [reactionType, setReactionType] = useState('start');
  const [level, setLevel] = useState(1);
  const [round, setRound] = useState(1);
  const [combo, setCombo] = useState(0);
  const [showTime, setShowTime] = useState(0);
  const [sequenceType, setSequenceType] = useState('simple');
  const [currentMessage, setCurrentMessage] = useState('');
  const [gameActive, setGameActive] = useState(true);
  const [difficultyProgression, setDifficultyProgression] = useState(1);
  const [usedSymbols, setUsedSymbols] = useState([]);

  const timerRef = useRef(null);
  const showTimerRef = useRef(null);
  const comboRef = useRef(0);
  const inputStartTime = useRef(null);
  const timeBonusActive = useRef(false);

  useEffect(() => {
    startNewRound();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (showTimerRef.current) clearTimeout(showTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (timeLeft <= 0 && gameActive && mode === 'input') {
      handleTimeout();
    }
  }, [timeLeft, gameActive, mode]);

  const getRandomMessage = (type) => {
    const messages = professorMessages[type] || [];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const startNewRound = () => {
    // Определяем тип последовательности на основе уровня
    let availableTypes = ['simple'];
    if (level >= 2) availableTypes.push('color_shift');
    if (level >= 3) availableTypes.push('pattern');
    if (level >= 4) availableTypes.push('alternating');
    if (level >= 5) availableTypes.push('mirror');
    if (level >= 6) availableTypes.push('progressive');

    const newSequenceType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    setSequenceType(newSequenceType);

    const levelConfig = difficultyLevels.find(l => l.id === level) || difficultyLevels[0];
    const newSequence = generateSequence(level, newSequenceType);

    setSequence(newSequence);
    setPlayerInput([]);
    setMode('waiting');
    setTimeLeft(levelConfig.bonusTime);
    setShowReaction(false);
    timeBonusActive.current = true;
    inputStartTime.current = null;

    // Приветствие от профессора
    setCurrentMessage(getRandomMessage('start'));
    setReactionType('gameStart');
    setShowReaction(true);

    setTimeout(() => {
      setShowReaction(false);
      setCurrentMessage(getRandomMessage('showSequence'));
      setMode('show');
      setShowTime(levelConfig.showTime);

      // Отсчет времени показа
      showTimerRef.current = setTimeout(() => {
        setMode('input');
        setCurrentMessage('Ваша очередь! Повторите последовательность!');
        inputStartTime.current = Date.now();

        // Старт таймера
        timerRef.current = setInterval(() => {
          setTimeLeft(prev => {
            if (prev <= 1) {
              clearInterval(timerRef.current);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        // Бот "запоминает"
        const botDelay = 500 + Math.random() * 1000;
        setTimeout(() => {
          const botAccuracy = 0.6 + (level * 0.05);
          const botCorrect = Math.round(botAccuracy * newSequence.length);
          const botPoints = calculatePoints(
            botCorrect,
            newSequence.length,
            level,
            newSequenceType,
            false,
            0
          );
          setBotScore(prev => prev + botPoints);
          setProfState('thinking');

          setTimeout(() => setProfState('playful'), 1000);
        }, botDelay);

      }, levelConfig.showTime);

    }, 1500);
  };

  const handleSymbolClick = (symbol) => {
    if (mode !== 'input' || !gameActive) return;

    if (!inputStartTime.current) {
      inputStartTime.current = Date.now();
    }

    const newInput = [...playerInput, symbol];
    setPlayerInput(newInput);

    if (newInput.length === sequence.length) {
      clearInterval(timerRef.current);
      evaluateSequence(newInput);
    }
  };

  const evaluateSequence = async (input) => {
    let correct = 0;
    const results = [];

    for (let i = 0; i < sequence.symbols.length; i++) {
      const isCorrect = input[i]?.symbol === sequence.symbols[i]?.symbol;
      if (isCorrect) correct++;
      results.push({ position: i, correct: isCorrect });
    }

    const accuracy = correct / sequence.length;
    const isPerfect = accuracy === 1;

    // Проверка бонуса за время
    const inputTime = Date.now() - inputStartTime.current;
    const levelConfig = difficultyLevels.find(l => l.id === level);
    const timeBonus = inputTime < levelConfig.bonusTime * 1000 * 0.5;

    if (timeBonus) {
      setCurrentMessage(getRandomMessage('timeBonus'));
      setReactionType('timeBonus');
      setShowReaction(true);
    }

    // Обновление комбо
    if (isPerfect || accuracy >= 0.8) {
      comboRef.current++;
      if (comboRef.current >= 3) {
        setCurrentMessage(getRandomMessage('combo'));
        setReactionType('combo');
        setShowReaction(true);
      }
    } else {
      comboRef.current = 0;
    }

    // Расчет очков
    const points = calculatePoints(
      correct,
      sequence.length,
      level,
      sequenceType,
      timeBonus,
      comboRef.current
    );

    setPlayerScore(prev => prev + points);

    // Обновление статистики
    const newStats = {
      ...gameStats,
      correct: gameStats.correct + (accuracy >= 0.7 ? 1 : 0),
      incorrect: gameStats.incorrect + (accuracy < 0.7 ? 1 : 0),
      total: gameStats.total + 1,
      perfectRounds: gameStats.perfectRounds + (isPerfect ? 1 : 0),
      maxCombo: Math.max(gameStats.maxCombo, comboRef.current)
    };

    // Обновление средней точности
    const totalAccuracy = (gameStats.avgAccuracy * gameStats.total + accuracy * 100) / (gameStats.total + 1);
    newStats.avgAccuracy = totalAccuracy;

    setGameStats(newStats);
    setCombo(comboRef.current);

    // Реакция профессора
    if (isPerfect) {
      setCurrentMessage(getRandomMessage('perfect'));
      setReactionType('perfect');
    } else if (accuracy >= 0.8) {
      setCurrentMessage(getRandomMessage('correct'));
      setReactionType('correct');
    } else {
      setCurrentMessage(getRandomMessage('incorrect'));
      setReactionType('incorrect');
    }

    setShowReaction(true);
    setProfState(isPerfect ? 'correct' : accuracy >= 0.8 ? 'correct' : 'incorrect');

    // Проверка на повышение уровня
    const progressToNextLevel = Math.floor((round + 1) / 3);
    if (progressToNextLevel > difficultyProgression && level < difficultyLevels.length) {
      setDifficultyProgression(progressToNextLevel);
      setLevel(prev => prev + 1);
      setCurrentMessage(getRandomMessage('levelUp'));
      setReactionType('levelUp');
      setTimeout(() => {
        setShowReaction(true);
      }, 1000);
    }

    // Сохранение результата
    try {
      await axios.post('http://localhost:4000/api/profile/session', {
        game: 'memory',
        score: points,
        correct: correct,
        incorrect: sequence.length - correct,
        accuracy: accuracy * 100,
        level: level,
        sequenceLength: sequence.length,
        sequenceType: sequenceType,
        combo: comboRef.current,
        timeBonus: timeBonus,
        perfect: isPerfect
      });
    } catch (error) {
      console.error('Ошибка сохранения:', error);
    }

    // Показываем результат на 2 секунды
    setMode('result');

    setTimeout(() => {
      setShowReaction(false);
      setProfState('playful');
      setRound(prev => prev + 1);
      if (gameActive) {
        startNewRound();
      }
    }, 2000);
  };

  const handleTimeout = () => {
    if (mode !== 'input' || !gameActive) return;

    setCurrentMessage("Время вышло! Попробуйте следующий раунд.");
    setReactionType('incorrect');
    setShowReaction(true);

    const newStats = {
      ...gameStats,
      incorrect: gameStats.incorrect + 1,
      total: gameStats.total + 1
    };
    setGameStats(newStats);

    comboRef.current = 0;
    setCombo(0);

    setTimeout(() => {
      setShowReaction(false);
      setRound(prev => prev + 1);
      if (gameActive) {
        startNewRound();
      }
    }, 1500);
  };

  const endGame = async () => {
    setGameActive(false);
    clearInterval(timerRef.current);
    if (showTimerRef.current) clearTimeout(showTimerRef.current);

    // Финальная реплика
    setCurrentMessage(getRandomMessage('endGame'));
    setReactionType('gameEnd');
    setShowReaction(true);
    setProfState(playerScore > botScore ? 'correct' : 'incorrect');

    // Сохранение итогов
    const total = gameStats.correct + gameStats.incorrect;
    const accuracy = total > 0
      ? Math.min(100, Math.round((gameStats.correct / total) * 100))
      : 0;

    try {
      await axios.post('http://localhost:4000/api/profile/session', {
        game: 'memory',
        score: playerScore,
        correct: gameStats.correct,
        incorrect: gameStats.incorrect,
        accuracy: accuracy,
        duration: 60,
        level: level,
        maxCombo: gameStats.maxCombo,
        perfectRounds: gameStats.perfectRounds,
        sequenceTypes: sequenceType,
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

  const getLevelConfig = () => {
    return difficultyLevels.find(l => l.id === level) || difficultyLevels[0];
  };

  const renderSymbol = (symbol, index, showResult = false) => {
    const isCurrent = mode === 'input' && playerInput.length === index;
    const isCorrect = showResult && playerInput[index]?.symbol === sequence?.symbols[index]?.symbol;

    return (
      <motion.div
        key={index}
        initial={mode === 'show' ? { scale: 0, rotate: -180 } : { scale: 1 }}
        animate={mode === 'show' ? {
          scale: 1,
          rotate: 0,
          transition: {
            delay: index * 0.1,
            type: "spring",
            stiffness: 200
          }
        } : {}}
        style={{
          width: 70,
          height: 70,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: isCurrent ? '#4f46e5' :
                    showResult && !isCorrect ? '#fef2f2' :
                    symbol?.color || '#f3f4f6',
          color: isCurrent ? 'white' :
                showResult && !isCorrect ? '#dc2626' : '#1f2937',
          borderRadius: 16,
          fontWeight: 'bold',
          fontSize: 32,
          border: showResult && !isCorrect ? '3px solid #dc2626' :
                 isCurrent ? '3px solid #4f46e5' : '3px solid transparent',
          boxShadow: mode === 'show' ? '0 8px 25px rgba(0,0,0,0.15)' : '0 4px 12px rgba(0,0,0,0.1)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {symbol?.symbol || '?'}
        {showResult && !isCorrect && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(220, 38, 38, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20
          }}>
            ✗
          </div>
        )}
        {showResult && isCorrect && (
          <div style={{
            position: 'absolute',
            top: -5,
            right: -5,
            background: '#10b981',
            color: 'white',
            borderRadius: '50%',
            width: 24,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14
          }}>
            ✓
          </div>
        )}
      </motion.div>
    );
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
            <div style={{ fontSize: 12, color: '#6b7280' }}>
              {mode === 'show' ? 'Запоминайте...' :
               mode === 'input' ? 'Ваша очередь!' : 'Осталось'}
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <AnimatePresence>
              {showReaction && <ProfessorReaction type={reactionType} />}
            </AnimatePresence>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
                  fontWeight: 600,
                  animation: 'pulse 1.5s infinite'
                }}>
                  🔥 x{combo}
                </div>
              )}
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap'
            }}>
              <div style={{
                padding: '4px 12px',
                background: getLevelConfig().color,
                color: 'white',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 600
              }}>
                {getLevelConfig().name}
              </div>
              <div style={{
                padding: '4px 12px',
                background: '#f3f4f6',
                color: '#6b7280',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 600
              }}>
                {sequenceTypes.find(t => t.id === sequenceType)?.name || 'Простая'}
              </div>
            </div>
          </div>

          {/* Сообщение профессора */}
          {currentMessage && (
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: 16,
              marginBottom: 16,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              borderLeft: '4px solid #4f46e5',
              fontSize: 14,
              lineHeight: 1.5,
              color: '#374151'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ fontSize: 20 }}>💭</div>
                <div style={{ flex: 1 }}>{currentMessage}</div>
              </div>
            </div>
          )}

          {/* Основной блок последовательности */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: 24,
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            marginBottom: 16,
            minHeight: '180px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            {mode === 'waiting' && (
              <div style={{ fontSize: 18, color: '#6b7280' }}>
                Приготовьтесь к запоминанию...
              </div>
            )}

            {mode === 'show' && sequence && (
              <>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: '#4f46e5' }}>
                  Запомните последовательность
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 12,
                  flexWrap: 'wrap',
                  marginBottom: 8
                }}>
                  {sequence.symbols.map((symbol, index) => renderSymbol(symbol, index))}
                </div>
                <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 8 }}>
                  Показываю {sequence.length} символов...
                </div>
              </>
            )}

            {mode === 'input' && (
              <>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: '#4f46e5' }}>
                  Повторите последовательность
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 12,
                  flexWrap: 'wrap',
                  marginBottom: 8
                }}>
                  {playerInput.map((symbol, index) => renderSymbol(symbol, index))}
                  {playerInput.length < (sequence?.length || 0) && (
                    <div style={{
                      width: 70,
                      height: 70,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#f3f4f6',
                      color: '#9ca3af',
                      borderRadius: 16,
                      border: '3px dashed #d1d5db',
                      fontSize: 28
                    }}>
                      ?
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 8 }}>
                  Введено {playerInput.length} из {sequence?.length || 0}
                </div>
              </>
            )}

            {mode === 'result' && sequence && (
              <>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: '#4f46e5' }}>
                  Результат
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 12,
                  flexWrap: 'wrap',
                  marginBottom: 8
                }}>
                  {sequence.symbols.map((symbol, index) =>
                    renderSymbol(symbol, index, true)
                  )}
                </div>
                <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 8 }}>
                  {playerInput.filter((s, i) => s?.symbol === sequence.symbols[i]?.symbol).length} из {sequence.length} верно
                </div>
              </>
            )}
          </div>
        </div>

        {/* Панель выбора символов */}
        {(mode === 'input' || mode === 'waiting') && (
          <div style={{ marginBottom: 24 }}>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
              justifyContent: 'center',
              opacity: mode === 'input' ? 1 : 0.5,
              transition: 'opacity 0.3s'
            }}>
              {SYMBOLS.slice(0, getLevelConfig().symbolsCount).map((symbolObj, index) => (
                <motion.button
                  key={index}
                  whileHover={mode === 'input' ? { scale: 1.05 } : {}}
                  whileTap={mode === 'input' ? { scale: 0.95 } : {}}
                  onClick={() => handleSymbolClick(symbolObj)}
                  disabled={mode !== 'input'}
                  style={{
                    width: 70,
                    height: 70,
                    fontSize: 32,
                    padding: 0,
                    background: symbolObj.color,
                    color: 'white',
                    border: 'none',
                    borderRadius: '16px',
                    cursor: mode === 'input' ? 'pointer' : 'default',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {symbolObj.symbol}
                </motion.button>
              ))}
            </div>
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
            borderRadius: '8px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, color: '#10b981', fontSize: 18 }}>
                {gameStats.correct}
              </div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>Успешно</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, color: '#ef4444', fontSize: 18 }}>
                {gameStats.incorrect}
              </div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>Провалено</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, color: '#f59e0b', fontSize: 18 }}>
                {gameStats.maxCombo}
              </div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>Макс. комбо</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, color: '#8b5cf6', fontSize: 18 }}>
                {Math.round(gameStats.avgAccuracy)}%
              </div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>Точность</div>
            </div>
          </div>

          {/* Информация о текущей последовательности */}
          {sequence && (
            <div style={{
              marginTop: 16,
              padding: 12,
              background: '#f0f9ff',
              borderRadius: '8px',
              fontSize: 13,
              color: '#1e40af'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Длина последовательности:</span>
                <span style={{ fontWeight: 600 }}>{sequence.length} символов</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span>Тип последовательности:</span>
                <span style={{ fontWeight: 600 }}>
                  {sequenceTypes.find(t => t.id === sequenceType)?.name || 'Простая'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span>Уровень сложности:</span>
                <span style={{ fontWeight: 600 }}>{getLevelConfig().name}</span>
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
                    gameName: 'Вспышка памяти',
                    duration: 60,
                    level: level,
                    maxCombo: gameStats.maxCombo,
                    perfectRounds: gameStats.perfectRounds
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
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          .symbol-show {
            animation: fadeIn 0.5s ease-in-out;
          }
        `}</style>
      </div>
    </GradientBackground>
  );
}