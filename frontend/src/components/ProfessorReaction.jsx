import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const reactionMessages = {
  correct: [
    "Отлично! 🎯",
    "Молодец! ✨",
    "Супер! ⚡",
    "Браво! 🌟",
    "Правильно! ✅",
    "Верно! 👍",
    "Точно! 🎯"
  ],
  incorrect: [
    "Почти! 💪",
    "Не сдавайся! 📚",
    "Подумай ещё! 🤔",
    "Ошибка - это нормально! 🧠",
    "Следующий раз получится! 🚀",
    "Не беда! 😊",
    "Попробуй ещё раз! 🔄"
  ],
  levelUp: [
    "Уровень повышен! 📈",
    "Становишься лучше! ⬆️",
    "Новый уровень! 🚀",
    "Растёшь! 🌱",
    "Прогресс! 📊"
  ],
  gameStart: [
    "Поехали! 🚀",
    "Удачи! 🍀",
    "Покажи на что способен! 💪",
    "Время тренировки! 🧠",
    "На старт! 🏁"
  ],
  gameEnd: [
    "Хорошая игра! 🏆",
    "Молодец! 👏",
    "Отлично потренировался! 📚",
    "До следующей игры! 👋",
    "Ты становишься лучше! 📈"
  ]
};

export default function ProfessorReaction({
  type = 'correct',
  duration = 2000,
  position = 'top'
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [screenSize, setScreenSize] = useState({ width: window.innerWidth });

  useEffect(() => {
    const handleResize = () => {
      setScreenSize({ width: window.innerWidth });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!type) return;

    const messages = reactionMessages[type] || reactionMessages.correct;
    setMessage(messages[Math.floor(Math.random() * messages.length)]);
    setIsVisible(true);

    const timer = setTimeout(() => {
      setIsVisible(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [type, duration]);

  // Определяем стили в зависимости от размера экрана
  const getStyle = () => {
    const isMobile = screenSize.width < 768;

    const baseStyle = {
      position: 'fixed',
      zIndex: 1000,
      textAlign: 'center',
      wordWrap: 'break-word',
      whiteSpace: 'pre-wrap',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
      padding: isMobile ? '8px 12px' : '10px 16px',
      fontSize: isMobile ? '13px' : '14px',
      fontWeight: '600',
      borderRadius: '10px',
      maxWidth: isMobile ? '280px' : '320px',
      lineHeight: '1.4'
    };

    switch(type) {
      case 'correct':
        return {
          ...baseStyle,
          background: 'linear-gradient(135deg, #10b981, #059669)',
          color: 'white',
          border: '2px solid #059669'
        };
      case 'incorrect':
        return {
          ...baseStyle,
          background: 'linear-gradient(135deg, #ef4444, #dc2626)',
          color: 'white',
          border: '2px solid #dc2626'
        };
      case 'levelUp':
        return {
          ...baseStyle,
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          color: 'white',
          border: '2px solid #d97706'
        };
      case 'gameStart':
      case 'gameEnd':
        return {
          ...baseStyle,
          background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
          color: 'white',
          border: '2px solid #1d4ed8'
        };
      default:
        return {
          ...baseStyle,
          background: 'linear-gradient(135deg, #4f46e5, #4338ca)',
          color: 'white',
          border: '2px solid #4338ca'
        };
    }
  };

  const getPosition = () => {
    const isMobile = screenSize.width < 768;

    switch(position) {
      case 'top':
        return {
          top: isMobile ? '10px' : '20px',
          left: '50%',
          transform: 'translateX(-50%)'
        };
      case 'bottom':
        return {
          bottom: isMobile ? '70px' : '100px',
          left: '50%',
          transform: 'translateX(-50%)'
        };
      case 'top-left':
        return {
          top: '10px',
          left: isMobile ? '10px' : '20px',
          transform: 'none'
        };
      case 'top-right':
        return {
          top: '10px',
          right: isMobile ? '10px' : '20px',
          transform: 'none'
        };
      default:
        return {
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)'
        };
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          style={{
            ...getStyle(),
            ...getPosition()
          }}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}