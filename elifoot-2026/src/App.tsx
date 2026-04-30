import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from '@/pages/HomePage';
import NewGamePage from '@/pages/NewGamePage';
import DashboardPage from '@/pages/DashboardPage';
import MatchPage from '@/pages/MatchPage';
import TablePage from '@/pages/TablePage';
import SquadPage from '@/pages/SquadPage';
import FixturesPage from '@/pages/FixturesPage';
import Layout from '@/components/Layout';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/new" element={<NewGamePage />} />
      <Route element={<Layout />}>
        <Route path="/game" element={<DashboardPage />} />
        <Route path="/game/match/:fixtureId" element={<MatchPage />} />
        <Route path="/game/table/:competitionId" element={<TablePage />} />
        <Route path="/game/squad" element={<SquadPage />} />
        <Route path="/game/fixtures" element={<FixturesPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
