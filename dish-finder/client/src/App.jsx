import { Routes, Route } from 'react-router-dom';
import FoodSpotz from './pages/FoodSpotz';
import FoodSpotzResults from './pages/FoodSpotzResults';
import HistoryPage from './pages/HistoryPage';
import LoginPage from './pages/LoginPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<FoodSpotz />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/results" element={<FoodSpotzResults />} />
      <Route path="/history" element={<HistoryPage />} />
    </Routes>
  );
}

export default App;
