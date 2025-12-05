import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfessorAvatar from '../components/ProfessorAvatar';
import ProfessorReaction from '../components/ProfessorReaction';
import { GradientBackground } from '../ui/Backgrounds';
import { motion } from 'framer-motion';
import axios from 'axios';

// Система уровней сложности
const difficultyLevels = [
  { id: 1, name: 'Новичок', time: 20, points: 10, color: '#10b981' },
  { id: 2, name: 'Ученик', time: 16, points: 15, color: '#3b82f6' },
  { id: 3, name: 'Знаток', time: 12, points: 20, color: '#f59e0b' },
  { id: 4, name: 'Эксперт', time: 10, points: 25, color: '#8b5cf6' },
  { id: 5, name: 'Мастер', time: 8, points: 30, color: '#ef4444' },
  { id: 6, name: 'Гений', time: 6, points: 40, color: '#7c3aed' }
];

// Реплики профессора
const professorLines = {
  start: [
    "🧠 Начинаем охоту за аналогиями! Ищи связи между понятиями.",
    "🔍 Внимательно анализируй отношения. Готов?",
    "🎯 Аналогии тренируют ассоциативное мышление. Давай начнем!",
    "💡 Ищи скрытые связи. Это развивает интеллект!"
  ],
  correct: [
    "🎯 Отлично! Ты уловил связь!",
    "🧠 Браво! Твое ассоциативное мышление на высоте!",
    "💡 Правильно! Ты мыслишь как настоящий логик!",
    "🌟 Великолепно! Ты находишь аналогии лучше профессора!",
    "🔥 Потрясающе! Твоя интуиция не подводит!"
  ],
  incorrect: [
    "🤔 Почти! Это была сложная аналогия.",
    "💭 Не расстраивайся! Такие задачи тренируют мышление.",
    "🔍 Попробуй в следующий раз найти более глубокую связь.",
    "🧩 Сложно? Эти аналогии требуют особого внимания.",
    "📚 Каждая ошибка делает тебя мудрее!"
  ],
  levelUp: [
    "🚀 Ты растешь! Повышаю уровень сложности!",
    "📈 Отличный прогресс! Переходим на следующий уровень!",
    "🏆 Замечательно! Ты готов к более сложным аналогиям!",
    "⭐ Твое мышление развивается! Новый уровень активирован!"
  ],
  combo: [
    "🔥 Горячая серия! Продолжай в том же духе!",
    "⚡ Невероятно! Ты на волне правильных ответов!",
    "🎯 Идеальная точность! Ты разгадываешь все аналогии!",
    "🌟 Феноменально! Твой мозг работает как суперкомпьютер!"
  ],
  hint: [
    "💡 Подсказка: обрати внимание на тип связи...",
    "🔍 Попробуй найти общую категорию...",
    "🧠 Задумайся о функции или назначении...",
    "💭 Что объединяет эти понятия по смыслу?"
  ],
  timeWarning: [
    "⏰ Время на исходе! Сосредоточься!",
    "🔥 Ускоряйся! Таймер тикает!",
    "⚡ Быстрее! Аналогия ждет решения!",
    "🚀 Не задерживайся! Время летит!"
  ],
  gameEnd: [
    "🏁 Игра окончена! Ты отлично справился!",
    "🎮 Завершаем охоту за аналогиями!",
    "📊 Время подвести итоги твоих успехов!",
    "🎯 Охота завершена! Проверим результаты!"
  ]
};

// Система подсчета очков
const calculatePoints = (isCorrect, reactionTime, level, analogyComplexity) => {
  if (!isCorrect) return 0;

  const levelConfig = difficultyLevels.find(l => l.id === level) || difficultyLevels[0];
  let points = levelConfig.points;

  // Бонус за сложность аналогии
  const complexityBonus = {
    'simple': 0,
    'medium': 2,
    'hard': 5,
    'expert': 8,
    'genius': 12
  }[analogyComplexity] || 0;

  // Бонус за скорость
  const maxTime = levelConfig.time;
  const speedRatio = Math.max(0, (maxTime - reactionTime) / maxTime);
  const speedBonus = Math.round(points * speedRatio * 0.5);

  // Комбо-бонус (обрабатывается отдельно)

  return points + complexityBonus + speedBonus;
};

// Генератор сложных аналогий
const generateAnalogy = (level) => {
  // Определяем доступные типы аналогий по уровню
  const analogyTypes = [];

  if (level >= 1) analogyTypes.push('habitat', 'profession', 'state');
  if (level >= 2) analogyTypes.push('part_whole', 'tool_product', 'cause_effect');
  if (level >= 3) analogyTypes.push('symbolic', 'mathematical', 'temporal');
  if (level >= 4) analogyTypes.push('synonym', 'antonym', 'degree');
  if (level >= 5) analogyTypes.push('functional', 'structural', 'causal');
  if (level >= 6) analogyTypes.push('metaphorical', 'philosophical', 'scientific');

  const type = analogyTypes[Math.floor(Math.random() * analogyTypes.length)];

  const analogiesByType = {
    // Уровень 1
    habitat: [
      { base: 'Птица : Небо', target: 'Рыба : ?', answer: 'Вода', options: ['Вода', 'Земля', 'Воздух', 'Огонь'], relation: 'Среда обитания', complexity: 'simple' },
      { base: 'Медведь : Лес', target: 'Кит : ?', answer: 'Океан', options: ['Океан', 'Гора', 'Пустыня', 'Поле'], relation: 'Среда обитания', complexity: 'simple' },
    ],
    profession: [
      { base: 'Учитель : Ученик', target: 'Врач : ?', answer: 'Пациент', options: ['Пациент', 'Лекарство', 'Больница', 'Инструмент'], relation: 'Профессия и объект', complexity: 'simple' },
      { base: 'Художник : Картина', target: 'Писатель : ?', answer: 'Книга', options: ['Книга', 'Перо', 'Бумага', 'Словарь'], relation: 'Профессия и продукт', complexity: 'simple' },
    ],
    state: [
      { base: 'Холодно : Лед', target: 'Горячо : ?', answer: 'Пламя', options: ['Пламя', 'Снег', 'Вода', 'Воздух'], relation: 'Состояние вещества', complexity: 'simple' },
      { base: 'Тихий : Шепот', target: 'Громкий : ?', answer: 'Крик', options: ['Крик', 'Эхо', 'Шум', 'Тишина'], relation: 'Интенсивность звука', complexity: 'simple' },
    ],

    // Уровень 2
    part_whole: [
      { base: 'Слово : Предложение', target: 'Нота : ?', answer: 'Мелодия', options: ['Мелодия', 'Инструмент', 'Композитор', 'Звук'], relation: 'Часть и целое', complexity: 'medium' },
      { base: 'Лепесток : Цветок', target: 'Страница : ?', answer: 'Книга', options: ['Книга', 'Библиотека', 'Текст', 'Переплет'], relation: 'Элемент и система', complexity: 'medium' },
    ],
    tool_product: [
      { base: 'Фотоаппарат : Фотография', target: 'Диктофон : ?', answer: 'Запись', options: ['Запись', 'Звук', 'Музыка', 'Голос'], relation: 'Инструмент и продукт', complexity: 'medium' },
      { base: 'Кисть : Картина', target: 'Резец : ?', answer: 'Скульптура', options: ['Скульптура', 'Мрамор', 'Узор', 'Статуя'], relation: 'Инструмент и результат', complexity: 'medium' },
    ],
    cause_effect: [
      { base: 'Дождь : Лужа', target: 'Ветер : ?', answer: 'Волны', options: ['Волны', 'Пыль', 'Листья', 'Холод'], relation: 'Причина и следствие', complexity: 'medium' },
      { base: 'Семя : Дерево', target: 'Яйцо : ?', answer: 'Птенец', options: ['Птенец', 'Гнездо', 'Птица', 'Скорлупа'], relation: 'Развитие и результат', complexity: 'medium' },
    ],

    // Уровень 3
    symbolic: [
      { base: 'Голубь : Мир', target: 'Сердце : ?', answer: 'Любовь', options: ['Любовь', 'Жизнь', 'Кровь', 'Чувство'], relation: 'Символ и значение', complexity: 'hard' },
      { base: 'Книга : Знание', target: 'Факел : ?', answer: 'Просвещение', options: ['Просвещение', 'Огонь', 'Свет', 'Тепло'], relation: 'Символическое значение', complexity: 'hard' },
    ],
    mathematical: [
      { base: 'Круг : Сфера', target: 'Квадрат : ?', answer: 'Куб', options: ['Куб', 'Пирамида', 'Прямоугольник', 'Треугольник'], relation: 'Двумерная и трехмерная фигура', complexity: 'hard' },
      { base: 'Сложение : Сумма', target: 'Умножение : ?', answer: 'Произведение', options: ['Произведение', 'Результат', 'Ответ', 'Число'], relation: 'Операция и результат', complexity: 'hard' },
    ],
    temporal: [
      { base: 'Утро : День', target: 'Весна : ?', answer: 'Лето', options: ['Лето', 'Осень', 'Зима', 'Год'], relation: 'Временная последовательность', complexity: 'hard' },
      { base: 'Детство : Юность', target: 'Зарождение : ?', answer: 'Развитие', options: ['Развитие', 'Расцвет', 'Упадок', 'Зрелость'], relation: 'Стадии развития', complexity: 'hard' },
    ],

    // Уровень 4
    synonym: [
      { base: 'Храбрый : Смелый', target: 'Умный : ?', answer: 'Мудрый', options: ['Мудрый', 'Сообразительный', 'Гениальный', 'Одаренный'], relation: 'Синонимы', complexity: 'expert' },
      { base: 'Быстрый : Стремительный', target: 'Красивый : ?', answer: 'Прекрасный', options: ['Прекрасный', 'Привлекательный', 'Идеальный', 'Великолепный'], relation: 'Степень качества', complexity: 'expert' },
    ],
    antonym: [
      { base: 'День : Ночь', target: 'Свет : ?', answer: 'Тьма', options: ['Тьма', 'Тень', 'Мрак', 'Темнота'], relation: 'Антонимы', complexity: 'expert' },
      { base: 'Молодость : Старость', target: 'Начало : ?', answer: 'Конец', options: ['Конец', 'Финал', 'Завершение', 'Итог'], relation: 'Противоположности', complexity: 'expert' },
    ],
    degree: [
      { base: 'Капля : Море', target: 'Песчинка : ?', answer: 'Пустыня', options: ['Пустыня', 'Пляж', 'Гора', 'Куча'], relation: 'Часть и множество', complexity: 'expert' },
      { base: 'Искра : Пожар', target: 'Семя : ?', answer: 'Лес', options: ['Лес', 'Дерево', 'Сад', 'Роща'], relation: 'Микро и макро', complexity: 'expert' },
    ],

    // Уровень 5
    functional: [
      { base: 'Ключ : Замок', target: 'Пароль : ?', answer: 'Система', options: ['Система', 'Компьютер', 'Доступ', 'Файл'], relation: 'Средство доступа', complexity: 'genius' },
      { base: 'Руль : Управление', target: 'Парус : ?', answer: 'Направление', options: ['Направление', 'Ветер', 'Движение', 'Корабль'], relation: 'Средство контроля', complexity: 'genius' },
    ],
    structural: [
      { base: 'Атом : Молекула', target: 'Буква : ?', answer: 'Слово', options: ['Слово', 'Алфавит', 'Звук', 'Предложение'], relation: 'Элемент и структура', complexity: 'genius' },
      { base: 'Пиксель : Изображение', target: 'Нота : ?', answer: 'Симфония', options: ['Симфония', 'Мелодия', 'Партитура', 'Аккорд'], relation: 'Единица и композиция', complexity: 'genius' },
    ],
    causal: [
      { base: 'Кислород : Дыхание', target: 'Солнечный свет : ?', answer: 'Фотосинтез', options: ['Фотосинтез', 'Тепло', 'Энергия', 'Рост'], relation: 'Условие и процесс', complexity: 'genius' },
      { base: 'Идея : Изобретение', target: 'Наблюдение : ?', answer: 'Открытие', options: ['Открытие', 'Гипотеза', 'Эксперимент', 'Теория'], relation: 'Исход и результат', complexity: 'genius' },
    ],

    // Уровень 6
    metaphorical: [
      { base: 'Время : Река', target: 'Жизнь : ?', answer: 'Путешествие', options: ['Путешествие', 'Книга', 'Дорога', 'Пламя'], relation: 'Метафорическое сравнение', complexity: 'genius+' },
      { base: 'Знание : Свет', target: 'Невежество : ?', answer: 'Тьма', options: ['Тьма', 'Туман', 'Заблуждение', 'Пустота'], relation: 'Аллегорическая противоположность', complexity: 'genius+' },
    ],
    philosophical: [
      { base: 'Вопрос : Ответ', target: 'Проблема : ?', answer: 'Решение', options: ['Решение', 'Выход', 'Путь', 'Ответ'], relation: 'Диалектическая пара', complexity: 'genius+' },
      { base: 'Форма : Содержание', target: 'Внешность : ?', answer: 'Сущность', options: ['Сущность', 'Характер', 'Личность', 'Душа'], relation: 'Философская категория', complexity: 'genius+' },
    ],
    scientific: [
      { base: 'Гипотеза : Теория', target: 'Эксперимент : ?', answer: 'Закон', options: ['Закон', 'Факт', 'Открытие', 'Истина'], relation: 'Научный метод', complexity: 'genius+' },
      { base: 'Энергия : Масса', target: 'Пространство : ?', answer: 'Время', options: ['Время', 'Материя', 'Вселенная', 'Измерение'], relation: 'Физические понятия', complexity: 'genius+' },
    ],
  };

  const pool = analogiesByType[type] || analogiesByType.habitat;
  const analogy = pool[Math.floor(Math.random() * pool.length)];

  // Создаем дистракторы на основе сложности
  let distractors = [...analogy.options];
  if (level >= 4) {
    // Добавляем более хитрые дистракторы
    distractors = distractors.map(opt => {
      if (Math.random() > 0.7 && opt !== analogy.answer) {
        return opt + (Math.random() > 0.5 ? ' (частично)' : ' (косвенно)');
      }
      return opt;
    });
  }

  return {
    ...analogy,
    options: distractors.sort(() => Math.random() - 0.5),
    level,
    type
  };
};

export default function AnalogyHuntGame() {
  const navigate = useNavigate();
  const [analogy, setAnalogy] = useState(generateAnalogy(1));
  const [timeLeft, setTimeLeft] = useState(20);
  const [playerScore, setPlayerScore] = useState(0);
  const [botScore, setBotScore] = useState(0);
  const [profState, setProfState] = useState('thinking');
  const [selected, setSelected] = useState(null);
  const [gameStats, setGameStats] = useState({ correct: 0, incorrect: 0, total: 0, streak: 0, maxStreak: 0 });
  const [showReaction, setShowReaction] = useState(false);
  const [reactionType, setReactionType] = useState('correct');
  const [level, setLevel] = useState(1);
  const [showRelation, setShowRelation] = useState(false);
  const [gameActive, setGameActive] = useState(true);
  const [reactionTime, setReactionTime] = useState(0);
  const [combo, setCombo] = useState(0);
  const [professorMessage, setProfessorMessage] = useState('');
  const [hints, setHints] = useState(3);
  const [usedHint, setUsedHint] = useState(false);

  const questionStartTimeRef = useRef(null);
  const correctStreakRef = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => {
    startNewRound();
    sayProfessorLine('start');

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (timeLeft <= 0 && gameActive) {
      handleTimeout();
    }

    // Предупреждение о времени
    if (timeLeft <= 5 && timeLeft > 0 && gameActive) {
      sayProfessorLine('timeWarning');
    }
  }, [timeLeft, gameActive]);

  const sayProfessorLine = (type) => {
    const lines = professorLines[type];
    if (lines && lines.length > 0) {
      const randomLine = lines[Math.floor(Math.random() * lines.length)];
      setProfessorMessage(randomLine);
      setTimeout(() => setProfessorMessage(''), 3000);
    }
  };

  const startNewRound = () => {
    const newAnalogy = generateAnalogy(level);
    setAnalogy(newAnalogy);
    setTimeLeft(difficultyLevels.find(l => l.id === level)?.time || 20);
    setSelected(null);
    setShowReaction(false);
    setShowRelation(false);
    setUsedHint(false);
    questionStartTimeRef.current = Date.now();

    // Бот "анализирует"
    const botDelay = Math.max(500, 2000 - (level * 200));
    setTimeout(() => {
      const botAccuracy = Math.max(0.3, 0.9 - (level * 0.1));
      const botChoice = Math.random() < botAccuracy
        ? newAnalogy.answer
        : newAnalogy.options.find(opt => opt !== newAnalogy.answer) || newAnalogy.answer;

      const isBotCorrect = botChoice === newAnalogy.answer;
      const botPoints = calculatePoints(isBotCorrect, botDelay/1000, level, newAnalogy.complexity);
      setBotScore(prev => prev + botPoints);
      setProfState(isBotCorrect ? 'correct' : 'incorrect');

      setTimeout(() => setProfState('thinking'), 1000);
    }, botDelay);

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
  };

  const handleSelect = async (option) => {
    if (selected !== null || !gameActive) return;

    clearInterval(timerRef.current);
    setSelected(option);
    const currentTime = Date.now();
    const reactionTimeMs = currentTime - questionStartTimeRef.current;
    const reactionTimeSec = reactionTimeMs / 1000;
    setReactionTime(reactionTimeSec);

    const isCorrect = option === analogy.answer || option.replace(/ \(.*\)/, '') === analogy.answer;

    // Обработка комбо
    if (isCorrect) {
      correctStreakRef.current++;
      setCombo(prev => prev + 1);
      if (correctStreakRef.current > gameStats.maxStreak) {
        setGameStats(prev => ({ ...prev, maxStreak: correctStreakRef.current }));
      }

      if (combo >= 2) {
        sayProfessorLine('combo');
      }
    } else {
      correctStreakRef.current = 0;
      setCombo(0);
    }

    const points = calculatePoints(isCorrect, reactionTimeSec, level, analogy.complexity);

    // Бонус за комбо
    const comboBonus = combo >= 3 ? Math.round(points * (combo * 0.1)) : 0;
    const totalPoints = isCorrect ? points + comboBonus : 0;

    if (isCorrect) {
      setPlayerScore(prev => prev + totalPoints);
      sayProfessorLine('correct');
    } else {
      sayProfessorLine('incorrect');
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
    setShowRelation(true);

    // Проверка на повышение уровня
    if (isCorrect && gameStats.correct % 5 === 4 && level < 6) {
      setTimeout(() => {
        setLevel(prev => {
          const newLevel = prev + 1;
          sayProfessorLine('levelUp');
          setReactionType('levelUp');
          setShowReaction(true);
          return newLevel;
        });
      }, 500);
    }

    // Сохранение результата
    try {
      await axios.post('http://localhost:4000/api/profile/session', {
        game: 'analogy',
        score: totalPoints,
        correct: isCorrect ? 1 : 0,
        incorrect: isCorrect ? 0 : 1,
        level: level,
        reactionTime: reactionTimeSec,
        complexity: analogy.complexity,
        type: analogy.type,
        combo: combo
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
    }, 1500);
  };

  const useHint = () => {
    if (hints > 0 && !usedHint && gameActive) {
      setHints(prev => prev - 1);
      setUsedHint(true);

      // Показываем подсказку от профессора
      const hintLines = professorLines.hint;
      const hint = hintLines[Math.floor(Math.random() * hintLines.length)];
      setProfessorMessage(hint);
      setTimeout(() => setProfessorMessage(''), 2000);

      // Убираем один неправильный вариант
      const wrongOptions = analogy.options.filter(opt =>
        opt !== analogy.answer && opt.replace(/ \(.*\)/, '') !== analogy.answer
      );
      if (wrongOptions.length > 0) {
        const optionToRemove = wrongOptions[0];
        setAnalogy(prev => ({
          ...prev,
          options: prev.options.filter(opt => opt !== optionToRemove)
        }));
      }
    }
  };

  const handleTimeout = () => {
    setGameStats(prev => ({ ...prev, incorrect: prev.incorrect + 1, total: prev.total + 1 }));
    correctStreakRef.current = 0;
    setCombo(0);

    if (gameActive) {
      startNewRound();
    }
  };

  const endGame = async () => {
    setGameActive(false);
    clearInterval(timerRef.current);

    setProfState(playerScore > botScore ? 'correct' : 'incorrect');
    sayProfessorLine('gameEnd');

    // Сохранение итогов
    const total = gameStats.correct + gameStats.incorrect;
    const accuracy = total > 0
      ? Math.min(100, Math.round((gameStats.correct / total) * 100))
      : 0;

    try {
      await axios.post('http://localhost:4000/api/profile/session', {
        game: 'analogy',
        score: playerScore,
        correct: gameStats.correct,
        incorrect: gameStats.incorrect,
        accuracy: accuracy,
        duration: 60,
        level: level,
        maxStreak: gameStats.maxStreak,
        avgReactionTime: reactionTime,
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

  const getComplexityLabel = (complexity) => {
    const labels = {
      'simple': 'Простая',
      'medium': 'Средняя',
      'hard': 'Сложная',
      'expert': 'Эксперт',
      'genius': 'Гений',
      'genius+': 'Сверхсложная'
    };
    return labels[complexity] || complexity;
  };

  return (
    <GradientBackground>
      <div className="container" style={{ maxWidth: '500px' }}>
        {/* Верхняя панель с таймером и профессором */}
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

        {/* Сообщение профессора */}
        {professorMessage && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: 16,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            borderLeft: '4px solid #4f46e5',
            animation: 'slideIn 0.3s ease-out'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8
            }}>
              <div style={{ fontSize: 20 }}>💬</div>
              <div style={{ fontSize: 14, color: '#111827', flex: 1 }}>
                {professorMessage}
              </div>
            </div>
          </div>
        )}

        {/* Панель информации */}
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
                Вопрос: <strong>{gameStats.total + 1}</strong>
              </div>
              {combo > 1 && (
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

          {/* Основной блок с аналогией */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: 24,
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            marginBottom: 16,
            position: 'relative'
          }}>
            {/* Индикатор сложности */}
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
              Сложность: {getComplexityLabel(analogy.complexity)}
            </div>

            <div style={{
              fontSize: 20,
              fontWeight: 700,
              marginBottom: 16,
              color: '#4f46e5',
              marginTop: 8
            }}>
              Найди аналогию
            </div>

            <div style={{
              fontSize: 24,
              fontWeight: 800,
              marginBottom: 8,
              color: '#111827',
              lineHeight: 1.3
            }}>
              {analogy.base}
            </div>

            <div style={{
              fontSize: 22,
              fontWeight: 700,
              marginBottom: 20,
              color: '#1e40af',
              lineHeight: 1.3
            }}>
              {analogy.target}
            </div>

            {/* Отношение */}
            {showRelation && (
              <div style={{
                padding: '10px 16px',
                background: '#f0f9ff',
                borderRadius: '8px',
                color: '#1e40af',
                fontSize: '14px',
                fontWeight: 600,
                marginTop: 16
              }}>
                🧠 Отношение: {analogy.relation}
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
          {analogy.options.map((option, index) => (
            <motion.button
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleSelect(option)}
              disabled={selected !== null || !gameActive}
              style={{
                padding: '20px',
                fontSize: '16px',
                fontWeight: '600',
                border: 'none',
                borderRadius: '12px',
                cursor: selected !== null || !gameActive ? 'default' : 'pointer',
                background: selected === option
                  ? (option === analogy.answer || option.replace(/ \(.*\)/, '') === analogy.answer
                    ? 'linear-gradient(135deg, #10b981, #059669)'
                    : 'linear-gradient(135deg, #ef4444, #dc2626)')
                  : 'linear-gradient(135deg, #4f46e5, #4338ca)',
                color: 'white',
                transition: 'all 0.2s ease',
                opacity: (!gameActive || selected !== null) && selected !== option ? 0.5 : 1,
                minHeight: '70px',
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

        {/* Панель управления */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: 16,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          marginBottom: 16
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12
          }}>
            <button
              onClick={useHint}
              disabled={hints <= 0 || usedHint || !gameActive || selected !== null}
              style={{
                padding: '10px 16px',
                background: hints > 0 ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)' : '#9ca3af',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: hints > 0 && gameActive && selected === null ? 'pointer' : 'default',
                opacity: (hints <= 0 || usedHint || !gameActive || selected !== null) ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              💡 Подсказка ({hints})
            </button>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#6b7280' }}>Уровень</div>
              <div style={{ fontSize: 18, fontWeight: '800', color: getLevelColor() }}>
                {level}
              </div>
            </div>
          </div>

          {/* Статистика */}
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
        </div>

        {/* Счет и информация */}
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

          {/* Дополнительная информация при выборе ответа */}
          {selected !== null && (
            <div style={{
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
            </div>
          )}
        </div>

        {/* Кнопки управления игрой */}
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
                    gameName: 'Охота за аналогиями',
                    duration: 60,
                    level: level,
                    maxStreak: gameStats.maxStreak,
                    complexity: analogy.complexity
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
          @keyframes slideIn {
            from {
              transform: translateY(-10px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }

          @keyframes pulse {
            0% { transform: translateX(-50%) scale(1); }
            50% { transform: translateX(-50%) scale(1.05); }
            100% { transform: translateX(-50%) scale(1); }
          }
        `}</style>
      </div>
    </GradientBackground>
  );
}