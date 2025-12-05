const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
  const { playerScore, botScore, gameStats, gameName } = req.body;
  
  const accuracy = gameStats.correct / (gameStats.correct + gameStats.incorrect) || 0;
  const isWinner = playerScore > botScore;
  
  let analysis = '';
  let recommendations = [];
  
  // Анализ на основе результатов
  if (accuracy >= 0.8) {
    analysis = 'Отличный результат! Твоя точность впечатляет.';
    recommendations = [
      'Попробуй повысить уровень сложности',
      'Экспериментируй с разными типами игр'
    ];
  } else if (accuracy >= 0.6) {
    analysis = 'Хорошая игра! Есть куда расти.';
    recommendations = [
      'Сосредоточься на уменьшении ошибок',
      'Тренируйся регулярно для улучшения результатов'
    ];
  } else {
    analysis = 'Практика сделает тебя лучше! Главное - не сдаваться.';
    recommendations = [
      'Начни с более легкого уровня',
      'Выделяй больше времени на каждое задание'
    ];
  }
  
  // комментарий о победе/поражении
  if (isWinner) {
    analysis += ' И ты победил профессора! Так держать!';
  } else {
    analysis += ' Профессор выиграл, но это лишь временно.';
  }
  
  // Персонализируем для конкретной игры
  switch(gameName) {
    case 'Скорость реакции':
      analysis += ' Твоя скорость реакции отличная!';
      recommendations.push('Тренируйся на быстрых математических примерах');
      break;
    case 'Логическая проверка':
      analysis += ' Логическое мышление на высоте!';
      recommendations.push('Решай больше логических головоломок');
      break;
    case 'Лишний предмет':
      analysis += ' Отличное внимание к деталям!';
      recommendations.push('Развивай ассоциативное мышление');
      break;
    case 'Охота за аналогиями':
      analysis += ' Способность находить связи впечатляет!';
      recommendations.push('Читай больше для расширения кругозора');
      break;
    case 'Вспышка памяти':
      analysis += ' Память тренируется - это видно!';
      recommendations.push('Повторяй последовательности вслух');
      break;
  }
  
  res.json({
    analysis,
    recommendations,
    stats: {
      accuracy: Math.round(accuracy * 100),
      totalQuestions: gameStats.correct + gameStats.incorrect,
      correctAnswers: gameStats.correct,
      scoreDifference: Math.abs(playerScore - botScore)
    }
  });
});

module.exports = router;