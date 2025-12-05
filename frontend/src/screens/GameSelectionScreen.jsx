import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GradientBackground } from '../ui/Backgrounds';
import { motion } from 'framer-motion';


const games = [
  { id: 'speed', title: 'Скорость реакции', icon: '/assets/1.png', description: 'Решай примеры на время', difficulty: '★☆☆' },
  { id: 'logic', title: 'Логическая проверка', icon: '/assets/2.png', description: 'Анализируй утверждения', difficulty: '★★☆' },
  { id: 'odd', title: 'Лишний предмет', icon: '/assets/3.png', description: 'Найди несоответствие', difficulty: '★☆☆' },
  { id: 'analogy', title: 'Охота за аналогиями', icon: '/assets/4.png', description: 'Найди аналогии', difficulty: '★★★' },
  { id: 'memory', title: 'Вспышка памяти', icon: '/assets/5.png', description: 'Запоминай последовательности', difficulty: '★★☆' },
];

export default function GameSelectionScreen() {
  const navigate = useNavigate();

  return (
    <GradientBackground>
      <div className="container">
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Выбери игру</h1>
          <div className="small-muted">
            Соревнуйся с профессором ИИ в различных когнитивных дисциплинах
          </div>
        </div>

        <div className="game-grid">
          {games.map((game, index) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="game-card"
              onClick={() => navigate(`/game/${game.id}`)}
            >
              <img src={game.icon} alt={game.title} className="game-icon" />
              <div style={{ textAlign: 'center' }}>
                <div className="game-title">{game.title}</div>
                <div className="small-muted" style={{ marginBottom: 8 }}>{game.description}</div>
                <div className="game-difficulty">{game.difficulty}</div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="card" style={{ marginTop: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Совет профессора</div>
          <div className="small-muted">
            Начни с игр на скорость реакции, затем переходи к логическим задачам
          </div>
        </div>
      </div>
    </GradientBackground>
  );

}