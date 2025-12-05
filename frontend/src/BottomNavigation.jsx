import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function BottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { id: 'games', label: 'Игры', icon: '🎮', path: '/select' },
    { id: 'profile', label: 'Профиль', icon: '👤', path: '/profile' },
  ];

  return (
    <div className="bottom-nav">
      {navItems.map(item => {
        const isActive = location.pathname.includes(item.path);
        return (
          <button
            key={item.id}
            type="button"
            className={`nav-item ${isActive ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <div className="nav-icon-wrap" aria-hidden="true">
              <span className="nav-icon" role="img" aria-label={item.label}>
                {item.icon}
              </span>
            </div>
            <div className="nav-label">{item.label}</div>
          </button>
        );
      })}
    </div>
  );
}
