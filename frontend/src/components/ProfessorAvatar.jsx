import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const avatarSrc = '/assets/professor.png';

export default function ProfessorAvatar({ size = 64, state = 'idle' }) {
  const [currentState, setCurrentState] = useState(state);
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (state !== currentState) {
      setCurrentState(state);
      setKey(prev => prev + 1);
    }
  }, [state, currentState]);

  // Простые состояния для телефона
  const getStateStyle = () => {
    switch(state) {
      case 'correct':
        return {
          scale: 1.05,
          boxShadow: '0 0 15px rgba(16, 185, 129, 0.5)',
          borderColor: '#10b981'
        };
      case 'incorrect':
        return {
          scale: 0.95,
          boxShadow: '0 0 15px rgba(239, 68, 68, 0.3)',
          borderColor: '#ef4444'
        };
      case 'thinking':
        return {
          scale: 1.02,
          boxShadow: '0 0 15px rgba(59, 130, 246, 0.4)',
          borderColor: '#3b82f6'
        };
      case 'playful':
        return {
          scale: 1.08,
          boxShadow: '0 0 20px rgba(139, 92, 246, 0.4)',
          borderColor: '#8b5cf6'
        };
      default:
        return {
          scale: 1,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          borderColor: '#e5e7eb'
        };
    }
  };

  const stateStyle = getStateStyle();

  return (
    <motion.div
      key={key}
      initial={{ opacity: 0.8, scale: 0.95 }}
      animate={{
        opacity: 1,
        scale: stateStyle.scale,
        boxShadow: stateStyle.boxShadow
      }}
      transition={{
        duration: 0.3,
        type: "spring",
        stiffness: 300,
        damping: 20
      }}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: 'hidden',
        position: 'relative',
        background: '#f8fafc',
        border: `3px solid ${stateStyle.borderColor}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <img
        src={avatarSrc}
        alt="Профессор"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block'
        }}
      />

      {/* Индикатор состояния (только для больших экранов) */}
      {window.innerWidth > 768 && state !== 'idle' && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 4,
          background: stateStyle.borderColor
        }} />
      )}
    </motion.div>
  );
}