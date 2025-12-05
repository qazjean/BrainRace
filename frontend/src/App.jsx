import React from 'react';
import Navigation from './Navigation';
import BottomNavigation from './BottomNavigation';

export default function App() {
  return (
    <div className="app-shell">
      <Navigation />
      <BottomNavigation />
    </div>
  );
}