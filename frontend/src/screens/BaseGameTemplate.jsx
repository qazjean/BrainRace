import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfessorAvatar from '../components/ProfessorAvatar';
import ProfessorReaction from '../components/ProfessorReaction';
import { GradientBackground } from '../ui/Backgrounds';
import { motion } from 'framer-motion';
import axios from 'axios';

export default function BaseGameTemplate({
  gameName,
  gameKey,
  generateQuestion,
  renderQuestion,
  renderAnswers,
  calculateBotScore
}) {
  const navigate = useNavigate();
  const [question, setQuestion] = useState(generateQuestion(1));
  const [timeLeft, setTimeLeft] = useState(60);
  const [playerScore, setPlayerScore] = useState(0);
  const [botScore, setBotScore] = useState(0);
  const [profState, setProfState] = useState('idle');
  const [selected, setSelected] = useState(null);
  const [gameStats, setGameStats] = useState({ correct: 0, incorrect: 0, total: 0 });
  const [showReaction, setShowReaction] = useState(false);
  const [reactionType, setReactionType] = useState('correct');
  const [level, setLevel] = useState(1);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [gameActive, setGameActive] = useState(true);

  const timerRef = useRef(null);
  const questionStartTimeRef = useRef(null);

  useEffect(() => {
    startNewRound();
    startTimer();

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
      setTimeLeft(prev => prev - 1);
    }, 1000);
  };

  const startNewRound = () => {
    const newQuestion = generateQuestion(level);
    setQuestion(newQuestion);
    setSelected(null);
    questionStartTimeRef.current = Date.now();
    setShowReaction(false);

    // Бот
    setTimeout(() => {
      const botPoints = calculateBotScore(newQuestion, level);
      setBotScore(prev => prev + botPoints);
    }, 1000 + Math.random() * 1000);
  };

  const handleAnswer = async (isCorrect, points = 0) => {
    if (selected !== null || !gameActive) return;

    setSelected(true);
    const reactionTime = (Date.now() - questionStartTimeRef.current) / 1000;

    // Очки: базовые 10 + бонус за скорость + бонус за уровень
    const basePoints = isCorrect ? 10 : 0;
    const levelBonus = level * 2;
    let speedBonus = 0;
    if (reactionTime < 2) speedBonus = 5;
    else if (reactionTime < 4) speedBonus = 3;
    else if (reactionTime < 6) speedBonus = 1;

    const totalPoints = points || (basePoints + levelBonus + speedBonus);

    setPlayerScore(prev => prev + totalPoints);
    setGameStats(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      incorrect: prev.incorrect + (isCorrect ? 0 : 1),
      total: prev.total + 1
    }));

    // Реакция
    setReactionType(isCorrect ? 'correct' : 'incorrect');
    setShowReaction(true);
    setProfState(isCorrect ? 'correct' : 'incorrect');

    setQuestionsAnswered(prev => prev + 1);

    // Повышение уровня
    if (isCorrect && gameStats.correct % 3 === 2 && level < 3) {
      setTimeout(() => {
        setLevel(prev => {
          setReactionType('levelUp');
          setShowReaction(true);
          return prev + 1;
        });
      }, 300);
    }

    // Сохранение
    try {
      await axios.post('http://localhost:4000/api/profile/session', {
        game: gameKey,
        score: totalPoints,
        correct: isCorrect ? 1 : 0,
        incorrect: isCorrect ? 0 : 1,
        level: level,
        reactionTime: reactionTime
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

  const endGame = async () => {
    setGameActive(false);
    clearInterval(timerRef.current);

    setProfState(playerScore > botScore ? 'correct' : 'incorrect');

    setTimeout(() => {
      setReactionType('gameEnd');
      setShowReaction(true);
    }, 500);

    const total = gameStats.correct + gameStats.incorrect;
    const accuracy = total > 0 ? Math.min(100, Math.round((gameStats.correct / total) * 100)) : 0;

    try {
      await axios.post('http://localhost:4000/api/profile/session', {
        game: gameKey,
        score: playerScore,
        correct: gameStats.correct,
        incorrect: gameStats.incorrect,
        accuracy: accuracy,
        duration: 60,
        level: level,
        final: true
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

  return (
    <GradientBackground>
      <div className="container" style={{ maxWidth: '500px' }}>
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

        <div style={{ marginBottom: 20 }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12
          }}>
            <div style={{ fontSize: 14, color: '#6b7280' }}>
              Вопрос: <strong>{questionsAnswered + 1}</strong>
            </div>
            <div style={{
              padding: '4px 12px',
              background: level === 1 ? '#10b981' : level === 2 ? '#f59e0b' : '#ef4444',
              color: 'white',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 600
            }}>
              Уровень {level}
            </div>
          </div>

          {renderQuestion(question)}
        </div>

        {renderAnswers(question, handleAnswer, selected, gameActive)}

        {/* Статистика (одинаковая для всех игр) */}
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

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
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
          </div>
        </div>

        {/* Кнопки управления */}
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
                    gameName,
                    duration: 60,
                    level: level
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