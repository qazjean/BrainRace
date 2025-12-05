import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Doughnut } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';
import ProfessorAvatar from '../components/ProfessorAvatar';
import { GradientBackground } from '../ui/Backgrounds';
import axios from 'axios';

Chart.register(ArcElement, Tooltip, Legend);

export default function ResultsScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { gameStats = { correct: 0, incorrect: 0 }, playerScore = 0, botScore = 0, gameName = 'Игра' } = location.state || {};

  const [profState, setProfState] = useState('idle');
  const [analysis, setAnalysis] = useState('');
  const [isWinner, setIsWinner] = useState(false);

  useEffect(() => {
    analyzeResults();

    // Определяем победителя
    setIsWinner(playerScore > botScore);
    setProfState(playerScore > botScore ? 'correct' : 'incorrect');
  }, []);

  const analyzeResults = async () => {
    try {
      const response = await axios.post('http://localhost:4000/api/analyze-results', {
        playerScore,
        botScore,
        gameStats,
        gameName
      });

      setAnalysis(response.data.analysis || 'Анализ завершен');
    } catch (error) {
      console.error('Ошибка анализа:', error);
      setAnalysis('Прекрасная игра! Продолжай тренироваться!');
    }
  };

  const doughnutData = {
    labels: ['Правильно', 'Ошибки'],
    datasets: [
      {
        data: [gameStats.correct, gameStats.incorrect],
        backgroundColor: ['#10b981', '#ef4444'],
        borderWidth: 2,
        borderColor: 'white'
      }
    ]
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((context.raw / total) * 100);
            return `${context.label}: ${context.raw} (${percentage}%)`;
          }
        }
      }
    },
    cutout: '70%'
  };

  return (
    <GradientBackground>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Результаты</h1>
            <div className="small-muted">{gameName}</div>
          </div>
          <ProfessorAvatar state={profState} size={64} />
        </div>

        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>
            {isWinner ? '🎉 Ты победил! 🎉' : '😊 Хорошая попытка! 😊'}
          </div>
          <div className="small-muted">
            {isWinner
              ? 'Профессор впечатлен твоими способностями!'
              : 'Практика делает мастера, продолжай тренироваться!'}
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center', marginBottom: 20 }}>
            <div>
              <div className="small-muted">Твой счёт</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: '#4f46e5' }}>{playerScore}</div>
            </div>
            <div style={{ width: 1, background: '#e5e7eb' }} />
            <div>
              <div className="small-muted">Профессор</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: '#6b7280' }}>{botScore}</div>
            </div>
          </div>

          <div style={{
            background: isWinner ? '#f0fdf4' : '#fef3c7',
            padding: '12px',
            borderRadius: '12px',
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            <div style={{ fontWeight: 600, color: isWinner ? '#059669' : '#d97706' }}>
              {isWinner ? `Ты выиграл с преимуществом в ${playerScore - botScore} очков!` : 'Попробуй еще раз, ты обязательно победишь!'}
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, textAlign: 'center' }}>
            Статистика ответов
          </div>
          <div style={{ width: '100%', maxWidth: 250, margin: '0 auto' }}>
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <div className="small-muted">
              Правильных ответов: <strong>{gameStats.correct}</strong> из <strong>{gameStats.correct + gameStats.incorrect}</strong>
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Комментарий профессора</div>
          <div style={{
            padding: '16px',
            background: '#f8fafc',
            borderRadius: '12px',
            lineHeight: 1.6
          }}>
            {analysis || 'Анализирую твою игру...'}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
          <button
            className="big-button"
            onClick={() => navigate('/select')}
          >
            Выбрать другую игру
          </button>
          <button
            className="big-button"
            onClick={() => navigate('/profile')}
            style={{ background: 'linear-gradient(135deg, #6b7280, #4b5563)' }}
          >
            Мой профиль
          </button>
        </div>
      </div>
    </GradientBackground>
  );
}