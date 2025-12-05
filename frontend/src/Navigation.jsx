import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import HomeScreen from './screens/HomeScreen';
import GameSelectionScreen from './screens/GameSelectionScreen';
import SpeedReactionGame from './screens/SpeedReactionGame';
import LogicCheckGame from './screens/LogicCheckGame';
import OddOneOutGame from './screens/OddOneOutGame';
import AnalogyHuntGame from './screens/AnalogyHuntGame';
import MemoryFlashGame from './screens/MemoryFlashGame';
import ResultsScreen from './screens/ResultsScreen';
import ProfileScreen from './screens/ProfileScreen';

export default function Navigation() {
  const navigate = useNavigate();

  return (
    <Routes>
      <Route path="/" element={<HomeScreen onStart={() => navigate('/select')} />} />
      <Route path="/select" element={<GameSelectionScreen />} />
      <Route path="/game/speed" element={<SpeedReactionGame />} />
      <Route path="/game/logic" element={<LogicCheckGame />} />
      <Route path="/game/odd" element={<OddOneOutGame />} />
      <Route path="/game/analogy" element={<AnalogyHuntGame />} />
      <Route path="/game/memory" element={<MemoryFlashGame />} />
      <Route path="/results" element={<ResultsScreen />} />
      <Route path="/profile" element={<ProfileScreen />} />
    </Routes>
  );
}