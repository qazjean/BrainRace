import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfessorAvatar from '../components/ProfessorAvatar';
import ProfessorReaction from '../components/ProfessorReaction';
import { GradientBackground } from '../ui/Backgrounds';
import { motion } from 'framer-motion';
import axios from 'axios';

// Система уровней сложности с постепенным усложнением
const difficultyLevels = [
  {
    id: 1,
    name: 'Новичок',
    time: 15,
    basePoints: 10,
    color: '#10b981',
    minQuestions: 0,
    maxQuestions: 5,
    description: 'Простые примеры'
  },
  {
    id: 2,
    name: 'Ученик',
    time: 12,
    basePoints: 15,
    color: '#f59e0b',
    minQuestions: 6,
    maxQuestions: 12,
    description: 'Двузначные числа'
  },
  {
    id: 3,
    name: 'Опытный',
    time: 10,
    basePoints: 20,
    color: '#ef4444',
    minQuestions: 13,
    maxQuestions: 20,
    description: 'Дроби и проценты'
  },
  {
    id: 4,
    name: 'Эксперт',
    time: 8,
    basePoints: 25,
    color: '#7c3aed',
    minQuestions: 21,
    maxQuestions: 30,
    description: 'Алгебра и корни'
  },
  {
    id: 5,
    name: 'Гений',
    time: 6,
    basePoints: 30,
    color: '#dc2626',
    minQuestions: 31,
    maxQuestions: Infinity,
    description: 'Сложные комбинации'
  }
];

// Правильная система очков с учетом сложности и скорости
const calculatePoints = (isCorrect, reactionTime, level, questionType) => {
  if (!isCorrect) return 0;

  const levelConfig = difficultyLevels.find(l => l.id === level) || difficultyLevels[0];
  let basePoints = levelConfig.basePoints;

  // Бонус за тип вопроса (постепенно увеличивается с уровнем)
  let typeBonus = 0;
  if (questionType === 'fraction') typeBonus = level * 0.5;
  if (questionType === 'percentage') typeBonus = level * 0.7;
  if (questionType === 'algebra') typeBonus = level * 1;
  if (questionType === 'sqrt') typeBonus = level * 0.8;
  if (questionType === 'mixed') typeBonus = level * 0.6;
  if (questionType === 'complex_fraction') typeBonus = level * 1.2;

  // Бонус за скорость (чем быстрее, тем больше)
  let speedMultiplier = 1;
  const maxTime = levelConfig.time;
  const speedPercent = Math.max(0, Math.min(1, (maxTime - reactionTime) / maxTime));

  if (speedPercent > 0.9) speedMultiplier = 2.0; // Сверхбыстрый ответ
  else if (speedPercent > 0.8) speedMultiplier = 1.8;
  else if (speedPercent > 0.7) speedMultiplier = 1.6;
  else if (speedPercent > 0.6) speedMultiplier = 1.4;
  else if (speedPercent > 0.5) speedMultiplier = 1.3;
  else if (speedPercent > 0.4) speedMultiplier = 1.2;
  else if (speedPercent > 0.3) speedMultiplier = 1.1;

  // Комбо-бонус (накапливается с каждым уровнем)
  const comboBonus = Math.min(20, level * 3);

  return Math.round((basePoints + typeBonus + comboBonus) * speedMultiplier);
};

// Функция для определения весов типов вопросов на каждом уровне
const getQuestionTypeWeights = (level, questionsAnswered) => {
  const weights = {
    basic: 30,
    double_digit: 25,
    triple_digit: 15,
    fraction: 10,
    percentage: 8,
    exponent: 5,
    sqrt: 3,
    algebra: 2,
    mixed: 1,
    complex_fraction: 1,
    power: 0,
    radical: 0
  };

  // Постепенное увеличение веса сложных типов
  const progress = questionsAnswered / 50; // 0-1 на основе ответов

  if (level >= 2) {
    weights.double_digit += progress * 10;
    weights.triple_digit += progress * 5;
  }

  if (level >= 3) {
    weights.fraction += progress * 15;
    weights.percentage += progress * 10;
    weights.exponent += progress * 5;
  }

  if (level >= 4) {
    weights.sqrt += progress * 8;
    weights.algebra += progress * 6;
    weights.mixed += progress * 4;
  }

  if (level >= 5) {
    weights.complex_fraction += progress * 5;
    weights.power += progress * 3;
    weights.radical += progress * 2;
  }

  // Нормализация весов
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  Object.keys(weights).forEach(key => {
    weights[key] = Math.round((weights[key] / totalWeight) * 100);
  });

  return weights;
};

// Функция для выбора типа вопроса на основе весов
const selectQuestionType = (weights) => {
  const random = Math.random() * 100;
  let cumulative = 0;

  for (const [type, weight] of Object.entries(weights)) {
    cumulative += weight;
    if (random <= cumulative) {
      return type;
    }
  }

  return 'basic';
};

// Генератор выражений с постепенным усложнением
function generateExpression(level, questionsAnswered) {
  const weights = getQuestionTypeWeights(level, questionsAnswered);
  const type = selectQuestionType(weights);

  let expression, result, displayExpression, questionType;
  const progressFactor = Math.min(1, questionsAnswered / 50);

  switch(type) {
    case 'basic': {
      // Начальный уровень: простые числа 1-9
      // Сложность увеличивается: 1-9 → 1-12 → 1-15
      const maxNumber = Math.floor(9 + progressFactor * 6);
      const a = Math.floor(Math.random() * maxNumber) + 1;
      const b = Math.floor(Math.random() * maxNumber) + 1;
      const ops = ['+', '-'];
      const op = ops[Math.floor(Math.random() * ops.length)];
      result = op === '+' ? a + b : a - b;
      expression = `${a} ${op} ${b}`;
      displayExpression = expression;
      questionType = 'basic';
      break;
    }

    case 'double_digit': {
      // Уровень 2+: двузначные числа
      const min = Math.floor(10 + progressFactor * 10);
      const max = Math.floor(20 + progressFactor * 30);
      const a = Math.floor(Math.random() * (max - min + 1)) + min;
      const b = Math.floor(Math.random() * (max - min + 1)) + min;
      const ops = ['+', '-'];
      const op = ops[Math.floor(Math.random() * ops.length)];
      result = op === '+' ? a + b : a - b;
      expression = `${a} ${op} ${b}`;
      displayExpression = expression;
      questionType = 'double_digit';
      break;
    }

    case 'triple_digit': {
      // Уровень 3+: трехзначные числа
      const min = Math.floor(100 + progressFactor * 100);
      const max = Math.floor(200 + progressFactor * 200);
      const a = Math.floor(Math.random() * (max - min + 1)) + min;
      const b = Math.floor(Math.random() * (min / 2)) + 50;
      const op = Math.random() > 0.5 ? '+' : '-';
      result = op === '+' ? a + b : a - b;
      expression = `${a} ${op} ${b}`;
      displayExpression = expression;
      questionType = 'triple_digit';
      break;
    }

    case 'fraction': {
      // Постепенное усложнение дробей
      const maxDenominator = Math.floor(5 + progressFactor * 8);
      const denominator1 = Math.floor(Math.random() * (maxDenominator - 2)) + 2;
      const numerator1 = Math.floor(Math.random() * (denominator1 - 1)) + 1;
      const denominator2 = Math.floor(Math.random() * (maxDenominator - 2)) + 2;
      const numerator2 = Math.floor(Math.random() * (denominator2 - 1)) + 1;

      if (Math.random() > 0.5) {
        // Сложение дробей
        const lcm = denominator1 * denominator2;
        result = (numerator1 * denominator2 + numerator2 * denominator1) / lcm;
        expression = `((${numerator1}/${denominator1}) + (${numerator2}/${denominator2}))`;
      } else {
        // Умножение дробей
        result = (numerator1 * numerator2) / (denominator1 * denominator2);
        expression = `((${numerator1}/${denominator1}) × (${numerator2}/${denominator2}))`;
      }
      displayExpression = expression;
      questionType = 'fraction';
      break;
    }

    case 'percentage': {
      // Проценты становятся сложнее
      const number = Math.floor(50 + progressFactor * 150);
      const percent = Math.floor(10 + progressFactor * 40);
      result = Math.round((number * percent) / 100);
      expression = `${percent}% от ${number}`;
      displayExpression = expression;
      questionType = 'percentage';
      break;
    }

    case 'exponent': {
      // Степени усложняются
      const maxBase = Math.floor(3 + progressFactor * 4);
      const maxExp = Math.floor(2 + progressFactor * 2);
      const base = Math.floor(Math.random() * maxBase) + 2;
      const exponent = Math.floor(Math.random() * maxExp) + 2;
      result = Math.pow(base, exponent);
      expression = `${base}^${exponent}`;
      displayExpression = `${base}${exponent === 2 ? '²' : exponent === 3 ? '³' : `^${exponent}`}`;
      questionType = 'exponent';
      break;
    }

    case 'sqrt': {
      // Корни становятся сложнее
      const maxNum = Math.floor(5 + progressFactor * 10);
      const num = Math.floor(Math.random() * maxNum) + 2;
      result = Math.pow(num, 2);
      expression = `√${result}`;
      displayExpression = `√${result}`;
      questionType = 'sqrt';
      break;
    }

    case 'algebra': {
      // Алгебра усложняется постепенно
      const a = Math.floor(Math.random() * (2 + Math.floor(progressFactor * 3))) + 2;
      const b = Math.floor(Math.random() * (5 + Math.floor(progressFactor * 10))) + 1;
      const c = Math.floor(Math.random() * (2 + Math.floor(progressFactor * 2))) + 1;
      const x = Math.floor(Math.random() * (2 + Math.floor(progressFactor * 3))) + 2;

      if (progressFactor < 0.5 || Math.random() > 0.5) {
        // Линейные уравнения сначала
        result = a * x + b;
        expression = `${a}x + ${b}, где x = ${x}`;
      } else {
        // Затем квадратные
        result = a * Math.pow(x, 2) + b * x + c;
        expression = `${a}x² + ${b}x + ${c}, где x = ${x}`;
      }
      displayExpression = expression;
      questionType = 'algebra';
      break;
    }

    case 'mixed': {
      // Смешанные операции с приоритетом
      const a = Math.floor(Math.random() * 9) + 1;
      const b = Math.floor(Math.random() * 9) + 1;
      const c = Math.floor(Math.random() * 9) + 1;

      if (Math.random() > 0.5) {
        // Сложение и умножение
        result = a + b * c;
        expression = `${a} + ${b} × ${c}`;
      } else {
        // Вычитание и деление
        result = a * b - c;
        expression = `${a} × ${b} - ${c}`;
      }
      displayExpression = expression;
      questionType = 'mixed';
      break;
    }

    case 'complex_fraction': {
      // Сложные дроби появляются на высоких уровнях
      const maxDenominator = Math.floor(6 + progressFactor * 6);
      const denominator1 = Math.floor(Math.random() * (maxDenominator - 2)) + 2;
      const numerator1 = Math.floor(Math.random() * (denominator1 - 1)) + 1;
      const denominator2 = Math.floor(Math.random() * (maxDenominator - 2)) + 2;
      const numerator2 = Math.floor(Math.random() * (denominator2 - 1)) + 1;

      result = (numerator1/denominator1) + (numerator2/denominator2);
      expression = `((${numerator1}/${denominator1}) + (${numerator2}/${denominator2}))`;
      displayExpression = `((${numerator1}/${denominator1}) + (${numerator2}/${denominator2}))`;
      questionType = 'complex_fraction';
      break;
    }

    case 'power': {
      // Высокие степени
      const base = Math.floor(Math.random() * 4) + 2;
      const exponent = Math.floor(Math.random() * 3) + 3;
      result = Math.pow(base, exponent);
      expression = `${base}^${exponent}`;
      displayExpression = `${base}${exponent === 3 ? '³' : `^${exponent}`}`;
      questionType = 'power';
      break;
    }

    case 'radical': {
      // Кубические корни
      const num = Math.floor(Math.random() * 5) + 2;
      result = Math.pow(num, 3);
      expression = `∛${result}`;
      displayExpression = `∛${result}`;
      questionType = 'radical';
      break;
    }

    default: {
      // Фолбэк на базовый уровень
      const a = Math.floor(Math.random() * 9) + 1;
      const b = Math.floor(Math.random() * 9) + 1;
      result = a + b;
      expression = `${a} + ${b}`;
      displayExpression = expression;
      questionType = 'basic';
    }
  }

  // Округляем результат до 2 знаков для дробей
  result = Math.round(result * 100) / 100;

  return {
    expression,
    displayExpression,
    result,
    level,
    type: questionType
  };
}

// Генерация вариантов ответов с постепенной сложностью
function generateOptions(correctAnswer, level, questionType, progressFactor) {
  const possibleOptions = new Set([correctAnswer]);
  const baseDifficulty = Math.min(5, Math.max(1, Math.floor(progressFactor * 10)));

  while (possibleOptions.size < 4) {
    let distractor;
    const errorRange = 1 + baseDifficulty * 2;

    if (questionType.includes('fraction') || correctAnswer.toString().includes('.')) {
      // Для дробей создаем близкие варианты с постепенно увеличивающейся сложностью
      const offset = (Math.random() > 0.5 ? 1 : -1) * (0.1 + Math.random() * (0.1 * baseDifficulty));
      distractor = Math.round((correctAnswer + offset) * 100) / 100;
    } else if (questionType === 'sqrt' || questionType === 'radical') {
      // Для корней - ближайшие квадраты/кубы
      const rootPower = questionType === 'sqrt' ? 2 : 3;
      const base = Math.round(Math.pow(correctAnswer, 1/rootPower));
      const offset = (Math.random() > 0.5 ? 1 : -1) * (1 + Math.floor(Math.random() * baseDifficulty));
      distractor = Math.pow(base + offset, rootPower);
    } else if (questionType === 'exponent' || questionType === 'power') {
      // Для степеней - близкие степени
      const base = Math.round(Math.pow(correctAnswer, 1/(Math.floor(Math.random() * 2) + 2)));
      const offset = (Math.random() > 0.5 ? 1 : -1) * (1 + Math.floor(Math.random() * baseDifficulty));
      distractor = Math.pow(base + offset, 2);
    } else {
      // Для остальных - умные дистракторы
      let offset;
      if (Math.random() > 0.7) {
        // Иногда добавляем типичные ошибки
        offset = correctAnswer * 0.1; // 10% от ответа
      } else {
        offset = (Math.random() > 0.5 ? 1 : -1) * (errorRange + Math.random() * errorRange);
      }
      distractor = Math.round(correctAnswer + offset);
    }

    // Убедимся, что дистрактор отличается от правильного ответа
    if (Math.abs(distractor - correctAnswer) > 0.01) {
      possibleOptions.add(distractor);
    }
  }

  return Array.from(possibleOptions)
    .sort(() => Math.random() - 0.5)
    .map(num => {
      // Форматируем красиво: убираем лишние нули у дробей
      if (Number.isInteger(num)) {
        return num;
      }
      const formatted = num.toFixed(2);
      return parseFloat(formatted) === parseInt(formatted) ? parseInt(formatted) : parseFloat(formatted);
    });
}

// Функция для определения времени на уровне
const getTimeForLevel = (level, baseTime = 60) => {
  const levelConfig = difficultyLevels.find(l => l.id === level);
  return levelConfig ? Math.max(10, baseTime - (level - 1) * 8) : baseTime;
};

export default function SpeedReactionGame() {
  const navigate = useNavigate();
  const [question, setQuestion] = useState(generateExpression(1, 0));
  const [options, setOptions] = useState([]);
  const [timeLeft, setTimeLeft] = useState(getTimeForLevel(1));
  const [playerScore, setPlayerScore] = useState(0);
  const [botScore, setBotScore] = useState(0);
  const [profState, setProfState] = useState('idle');
  const [selected, setSelected] = useState(null);
  const [gameStats, setGameStats] = useState({
    correct: 0,
    incorrect: 0,
    total: 0,
    streak: 0,
    maxStreak: 0,
    questionsByLevel: {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
  });
  const [showReaction, setShowReaction] = useState(false);
  const [reactionType, setReactionType] = useState('correct');
  const [level, setLevel] = useState(1);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [gameActive, setGameActive] = useState(true);
  const [reactionTime, setReactionTime] = useState(0);
  const [combo, setCombo] = useState(0);
  const [specialEvent, setSpecialEvent] = useState(null);
  const [powerUps, setPowerUps] = useState({
    doublePoints: 0,
    timeFreeze: 0,
    extraTime: 0
  });
  const [levelProgress, setLevelProgress] = useState({
    current: 0,
    required: 5, // Нужно 5 правильных ответов для повышения
    nextLevel: 2
  });

  const timerRef = useRef(null);
  const questionStartTimeRef = useRef(null);
  const totalGameStartTime = useRef(Date.now());
  const correctStreakRef = useRef(0);
  const levelHistoryRef = useRef([]);

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

  const checkLevelUp = () => {
    const levelConfig = difficultyLevels.find(l => l.id === level);
    const nextLevelConfig = difficultyLevels.find(l => l.id === level + 1);

    if (!nextLevelConfig) return false;

    // Проверяем, достаточно ли ответов на текущем уровне
    const questionsOnLevel = gameStats.questionsByLevel[level] || 0;
    const accuracyOnLevel = gameStats.correct / gameStats.total;

    // Условия повышения уровня:
    // 1. Минимальное количество вопросов на уровне
    // 2. Достаточная точность
    // 3. Достаточно правильных ответов подряд
    if (questionsOnLevel >= levelConfig.maxQuestions &&
        accuracyOnLevel >= 0.7 &&
        correctStreakRef.current >= 3) {
      return true;
    }

    return false;
  };

  const handleLevelUp = () => {
    const newLevel = level + 1;
    if (newLevel <= 5) {
      setLevel(newLevel);
      setLevelProgress({
        current: 0,
        required: Math.floor(5 + (newLevel - 1) * 2), // Усложняем с каждым уровнем
        nextLevel: newLevel + 1
      });

      // Обновляем время
      const newTime = getTimeForLevel(newLevel);
      setTimeLeft(newTime);

      // Показываем анимацию
      setReactionType('levelUp');
      setShowReaction(true);
      setTimeout(() => setShowReaction(false), 2000);

      // Сохраняем в историю
      levelHistoryRef.current.push({
        level: newLevel,
        time: Date.now(),
        score: playerScore,
        streak: correctStreakRef.current
      });
    }
  };

  const startNewRound = () => {
    const newQuestion = generateExpression(level, questionsAnswered);
    const progressFactor = Math.min(1, questionsAnswered / 50);
    const newOptions = generateOptions(newQuestion.result, level, newQuestion.type, progressFactor);

    setQuestion(newQuestion);
    setOptions(newOptions);
    setSelected(null);
    questionStartTimeRef.current = Date.now();
    setShowReaction(false);
    setSpecialEvent(null);

    // Бот думает, его сложность тоже растет с уровнем
    const botDelay = Math.max(500, 2000 - (level * 250) - (progressFactor * 1000));
    const botAccuracy = Math.max(0.5, 0.95 - (level * 0.08) - (progressFactor * 0.1));

    setTimeout(() => {
      const botAnswer = Math.random() < botAccuracy
        ? newQuestion.result
        : newOptions.find(opt => Math.abs(opt - newQuestion.result) > 0.01) || newQuestion.result;

      const isBotCorrect = Math.abs(botAnswer - newQuestion.result) < 0.01;
      const botPoints = calculatePoints(isBotCorrect, botDelay/1000, level, newQuestion.type);
      setBotScore(prev => prev + botPoints);
      setProfState(isBotCorrect ? 'correct' : 'incorrect');

      setTimeout(() => setProfState('idle'), 1000);
    }, botDelay);
  };

  const handleSelect = async (option) => {
    if (selected !== null || !gameActive) return;

    setSelected(option);
    const currentTime = Date.now();
    const reactionTimeMs = currentTime - questionStartTimeRef.current;
    const reactionTimeSec = reactionTimeMs / 1000;
    setReactionTime(reactionTimeSec);

    const isCorrect = Math.abs(option - question.result) < 0.01;

    // Обновляем статистику по уровням
    setGameStats(prev => ({
      ...prev,
      questionsByLevel: {
        ...prev.questionsByLevel,
        [level]: (prev.questionsByLevel[level] || 0) + 1
      }
    }));

    // Обработка комбо
    if (isCorrect) {
      correctStreakRef.current++;
      if (correctStreakRef.current > gameStats.maxStreak) {
        setGameStats(prev => ({ ...prev, maxStreak: correctStreakRef.current }));
      }
      setCombo(prev => prev + 1);

      // Увеличиваем прогресс уровня
      setLevelProgress(prev => ({
        ...prev,
        current: prev.current + 1
      }));
    } else {
      correctStreakRef.current = 0;
      setCombo(0);
      // Сбрасываем прогресс при ошибке
      setLevelProgress(prev => ({
        ...prev,
        current: Math.max(0, prev.current - 1)
      }));
    }

    // Проверка на специальное событие (чаще на высоких уровнях)
    if (combo >= 3 && Math.random() > (0.8 - level * 0.05)) {
      triggerSpecialEvent();
    }

    // Расчет очков с учетом бонусов
    let points = calculatePoints(isCorrect, reactionTimeSec, level, question.type);

    // Бонус за комбо (больше на высоких уровнях)
    if (isCorrect && combo >= 3) {
      const comboBonus = Math.min(2.0, 1 + (combo * 0.05) + (level * 0.05));
      points = Math.round(points * comboBonus);
    }

    // Бонус за бонусы
    if (powerUps.doublePoints > 0) {
      points *= 2;
      setPowerUps(prev => ({ ...prev, doublePoints: prev.doublePoints - 1 }));
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

    setQuestionsAnswered(prev => prev + 1);

    // Проверка на повышение уровня
    if (isCorrect && levelProgress.current >= levelProgress.required && level < 5) {
      setTimeout(() => {
        handleLevelUp();
      }, 500);
    }

    // Сохранение результата
    try {
      await axios.post('http://localhost:4000/api/profile/session', {
        game: 'speed',
        score: points,
        correct: isCorrect ? 1 : 0,
        incorrect: isCorrect ? 0 : 1,
        level: level,
        reactionTime: reactionTimeSec,
        questionType: question.type,
        combo: combo,
        levelProgress: levelProgress.current / levelProgress.required
      });
    } catch (error) {
      console.error('Ошибка сохранения:', error);
    }

    setTimeout(() => {
      setShowReaction(false);
      setProfState('idle');
      if (gameActive) {
        startNewRound();
      }
    }, 800);
  };

  const triggerSpecialEvent = () => {
    const events = [
      {
        type: 'doublePoints',
        duration: Math.min(5, 2 + Math.floor(level / 2)),
        message: `⚡ Двойные очки на ${Math.min(5, 2 + Math.floor(level / 2))} вопроса!`
      },
      {
        type: 'timeFreeze',
        duration: Math.min(8, 3 + level),
        message: `❄️ Заморозка времени на ${Math.min(8, 3 + level)} секунд!`
      },
      {
        type: 'extraTime',
        duration: Math.min(20, 5 + level * 3),
        message: `⏱️ +${Math.min(20, 5 + level * 3)} секунд к таймеру!`
      },
      {
        type: 'bonusPoints',
        value: Math.min(100, 20 + level * 15),
        message: `🎁 Бонус ${Math.min(100, 20 + level * 15)} очков!`
      }
    ];

    const event = events[Math.floor(Math.random() * events.length)];
    setSpecialEvent(event);

    switch(event.type) {
      case 'doublePoints':
        setPowerUps(prev => ({ ...prev, doublePoints: prev.doublePoints + event.duration }));
        break;
      case 'timeFreeze':
        clearInterval(timerRef.current);
        setTimeout(() => startTimer(), event.duration * 1000);
        break;
      case 'extraTime':
        setTimeLeft(prev => prev + event.duration);
        break;
      case 'bonusPoints':
        setPlayerScore(prev => prev + event.value);
        break;
    }

    setTimeout(() => setSpecialEvent(null), 3000);
  };

  const usePowerUp = (type) => {
    if (powerUps[type] > 0) {
      setPowerUps(prev => ({ ...prev, [type]: prev[type] - 1 }));

      switch(type) {
        case 'doublePoints':
          // Уже обрабатывается в handleSelect
          break;
        case 'timeFreeze':
          clearInterval(timerRef.current);
          setTimeout(() => startTimer(), 5000);
          break;
        case 'extraTime':
          setTimeLeft(prev => prev + 15);
          break;
      }
    }
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
        game: 'speed',
        score: playerScore,
        correct: gameStats.correct,
        incorrect: gameStats.incorrect,
        accuracy: accuracy,
        duration: 60,
        level: level,
        maxStreak: gameStats.maxStreak,
        avgReactionTime: reactionTime,
        questionsByLevel: gameStats.questionsByLevel,
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

  const getQuestionTypeLabel = (type) => {
    const labels = {
      'basic': 'Базовая',
      'double_digit': 'Двухзначные',
      'triple_digit': 'Трехзначные',
      'fraction': 'Дроби',
      'percentage': 'Проценты',
      'exponent': 'Степень',
      'sqrt': 'Корень',
      'algebra': 'Алгебра',
      'mixed': 'Смешанная',
      'complex_fraction': 'Сложные дроби',
      'power': 'Степень',
      'radical': 'Кубический корень'
    };
    return labels[type] || 'Задача';
  };

  const getLevelDescription = () => {
    const levelConfig = difficultyLevels.find(l => l.id === level);
    return levelConfig?.description || 'Начальный уровень';
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

        {/* Прогресс уровня */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: 16,
          marginBottom: 16,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8
          }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>
                Уровень {level}: {difficultyLevels.find(l => l.id === level)?.name}
              </div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>
                {getLevelDescription()}
              </div>
            </div>
            <div style={{
              padding: '4px 12px',
              background: getLevelColor(),
              color: 'white',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 600
            }}>
              Прогресс: {levelProgress.current}/{levelProgress.required}
            </div>
          </div>

          {/* Прогресс-бар уровня */}
          <div style={{
            height: 8,
            background: '#e5e7eb',
            borderRadius: '4px',
            overflow: 'hidden',
            marginBottom: 8
          }}>
            <div style={{
              width: `${(levelProgress.current / levelProgress.required) * 100}%`,
              height: '100%',
              background: getLevelColor(),
              borderRadius: '4px',
              transition: 'width 0.3s ease'
            }} />
          </div>

          <div style={{ fontSize: 11, color: '#6b7280', textAlign: 'center' }}>
            {level < 5
              ? `До уровня ${level + 1}: ${levelProgress.required - levelProgress.current} правильных ответов`
              : 'Максимальный уровень достигнут!'}
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
                padding: '4px 8px',
                background: '#f3f4f6',
                borderRadius: '8px',
                fontSize: '11px',
                color: '#6b7280',
                fontWeight: 500
              }}>
                ⏱️ {difficultyLevels.find(l => l.id === level)?.time}с на ответ
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
              {getQuestionTypeLabel(question.type)}
            </div>

            <div style={{
              fontSize: 16,
              fontWeight: 600,
              marginBottom: 8,
              color: '#6b7280',
              marginTop: 8
            }}>
              Реши быстро:
            </div>

            <div style={{
              fontSize: question.displayExpression.length > 15 ? 36 : 48,
              fontWeight: '800',
              color: '#111827',
              margin: '20px 0',
              fontFamily: 'monospace',
              lineHeight: 1.2,
              minHeight: '60px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {question.displayExpression}
            </div>

            <div style={{ fontSize: 13, color: '#9ca3af' }}>
              {gameActive ? 'Выбери правильный ответ' : 'Игра завершена!'}
            </div>

            {/* Специальное событие */}
            {specialEvent && (
              <div style={{
                position: 'absolute',
                bottom: -10,
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                padding: '6px 16px',
                borderRadius: '20px',
                fontSize: 12,
                color: '#92400e',
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(251, 191, 36, 0.3)',
                animation: 'pulse 1.5s infinite'
              }}>
                {specialEvent.message}
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
          {options.map((option, index) => (
            <motion.button
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleSelect(option)}
              disabled={selected !== null || !gameActive}
              style={{
                padding: '20px',
                fontSize: '20px',
                fontWeight: '700',
                border: 'none',
                borderRadius: '12px',
                cursor: selected !== null || !gameActive ? 'default' : 'pointer',
                background: selected === option
                  ? (Math.abs(option - question.result) < 0.01
                    ? 'linear-gradient(135deg, #10b981, #059669)'
                    : 'linear-gradient(135deg, #ef4444, #dc2626)')
                  : 'linear-gradient(135deg, #4f46e5, #4338ca)',
                color: 'white',
                transition: 'all 0.2s ease',
                opacity: (!gameActive || selected !== null) && selected !== option ? 0.5 : 1,
                minHeight: '80px',
                position: 'relative',
                overflow: 'hidden'
              }}
              whileHover={{ scale: selected !== null || !gameActive ? 1 : 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {option}
              {/* Эффект выбора */}
              {selected === option && (
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
          ))}
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
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>Текущая серия:</span>
                <span style={{ fontWeight: 600 }}>{correctStreakRef.current}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Вопросов на уровне {level}:</span>
                <span style={{ fontWeight: 600 }}>{gameStats.questionsByLevel[level] || 0}</span>
              </div>
            </div>
          )}
        </div>

        {/* История уровней (только для десктопа) */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: 16,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          marginBottom: 16,
          display: 'none' // Скрыто на мобильных
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#111827' }}>
            История уровней:
          </div>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8 }}>
            {difficultyLevels.map(lvl => (
              <div key={lvl.id} style={{
                padding: '8px 12px',
                background: level >= lvl.id ? lvl.color : '#f3f4f6',
                color: level >= lvl.id ? 'white' : '#6b7280',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                minWidth: '80px',
                textAlign: 'center',
                opacity: level >= lvl.id ? 1 : 0.6
              }}>
                {lvl.name}
                <div style={{ fontSize: '10px', fontWeight: 400, marginTop: 2 }}>
                  {gameStats.questionsByLevel[lvl.id] || 0} вопр.
                </div>
              </div>
            ))}
          </div>
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
                    gameName: 'Скорость реакции',
                    duration: 60,
                    level: level,
                    maxStreak: gameStats.maxStreak,
                    levelHistory: levelHistoryRef.current
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

          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
          }

          .correct-answer {
            animation: shake 0.5s ease-in-out;
          }

          @media (min-width: 768px) {
            .level-history {
              display: block !important;
            }
          }
        `}</style>
      </div>
    </GradientBackground>
  );
}