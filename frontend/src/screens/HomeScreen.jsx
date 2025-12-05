import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GradientBackground } from '../ui/Backgrounds';
import ProfessorAvatar from '../components/ProfessorAvatar';

const dailyTasks = [
  { task: 'Сыграть 3 разные игры', done: false },
  { task: 'Набрать 500+ очков', done: false },
  { task: 'Улучшить скорость реакции', done: true }
];

export default function HomeScreen() {
  const navigate = useNavigate();

  return (
    <GradientBackground>
      <div className="container">
        <header className="hero-header screen-section">
          <div>
            <h1 className="hero-title">BrainRace</h1>
            <p className="hero-subtitle small-muted">
              Тренируй мозг, соревнуйся с ИИ! Развивай память, логику и скорость.
            </p>
          </div>
          <ProfessorAvatar size={80} state="playful" />
        </header>

        <section className="screen-section">
          <div className="card interactive-card" style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Добро пожаловать!</h2>
            <p className="small-muted" style={{ marginBottom: 20 }}>
              Готов к интеллектуальному соревнованию с профессором ИИ? Пройди игры на память,
              логику, скорость реакции и другие когнитивные навыки.
            </p>
            <button
              className="big-button tap-highlight"
              onClick={() => navigate('/select')}
            >
              Начать соревнование
            </button>
          </div>
        </section>

        <section className="screen-section">
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 20, fontWeight: 700 }}>Сегодняшние задачи</h3>
              <span className="small-muted">Ежедневные цели</span>
            </div>
            <div className="task-list">
              {dailyTasks.map((item, idx) => (
                <div key={item.task} className="task-item">
                  <div className={`task-index ${item.done ? 'done' : ''}`}>
                    {item.done ? '✓' : idx + 1}
                  </div>
                  <span className={`task-label ${item.done ? 'done' : ''}`}>
                    {item.task}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="screen-section">
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: 12, fontWeight: 700 }}>Любимые игры</div>
            <div className="icon-carousel">
              {[1, 2, 3, 4, 5].map(i => (
                <div className="icon-chip" key={i}>
                  <img src={`/assets/${i}.png`} alt={`game-${i}`} />
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </GradientBackground>
  );
}
