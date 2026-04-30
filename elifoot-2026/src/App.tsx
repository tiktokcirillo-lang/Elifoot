import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from '@/pages/HomePage';
import NewGamePage from '@/pages/NewGamePage';
import CustomTeamPage from '@/pages/CustomTeamPage';
import DashboardPage from '@/pages/DashboardPage';
import MatchPage from '@/pages/MatchPage';
import TablePage from '@/pages/TablePage';
import SquadPage from '@/pages/SquadPage';
import FixturesPage from '@/pages/FixturesPage';
import TransferPage from '@/pages/TransferPage';
import TrainingPage from '@/pages/TrainingPage';
import FinancePage from '@/pages/FinancePage';
import TacticsPage from '@/pages/TacticsPage';
import HistoryPage from '@/pages/HistoryPage';
import Layout from '@/components/Layout';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/new" element={<NewGamePage />} />
      <Route path="/custom-team" element={<CustomTeamPage />} />
      <Route element={<Layout />}>
        <Route path="/game" element={<DashboardPage />} />
        <Route path="/game/match/:fixtureId" element={<MatchPage />} />
        <Route path="/game/table/:competitionId" element={<TablePage />} />
        <Route path="/game/squad" element={<SquadPage />} />
        <Route path="/game/fixtures" element={<FixturesPage />} />
        <Route path="/game/transfers" element={<TransferPage />} />
        <Route path="/game/training" element={<TrainingPage />} />
        <Route path="/game/finance" element={<FinancePage />} />
        <Route path="/game/tactics" element={<TacticsPage />} />
        <Route path="/game/history" element={<HistoryPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
