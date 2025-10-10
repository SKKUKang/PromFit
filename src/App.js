import './App.css';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/home';
import Library from './pages/library';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/library" element={<Library />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
