// Утилиты для правильного подсчёта очков
export const calculatePoints = (isCorrect, reactionTime, level) => {
  if (!isCorrect) return 0;

  const basePoints = 10; // Базовые очки
  const levelBonus = level * 3; // +3 за каждый уровень

  // Бонус за скорость (максимум +10, минимум 0)
  let speedBonus = 0;
  if (reactionTime < 1) speedBonus = 10;
  else if (reactionTime < 2) speedBonus = 8;
  else if (reactionTime < 3) speedBonus = 6;
  else if (reactionTime < 4) speedBonus = 4;
  else if (reactionTime < 5) speedBonus = 2;

  return basePoints + levelBonus + speedBonus;
};

// Корректный расчёт точности (не более 100%)
export const calculateAccuracy = (correct, total) => {
  if (!total || total === 0) return 0;
  return Math.min(100, Math.round((correct / total) * 100));
};

// Форматирование времени
export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};