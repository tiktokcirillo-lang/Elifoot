import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';

// Páginas carregadas sob demanda — reduz bundle inicial de ~700 KB
const HomePage         = lazy(() => import('@/pages/HomePage'));
const NewGamePage      = lazy(() => import('@/pages/NewGamePage'));
const CustomTeamPage   = lazy(() => import('@/pages/CustomTeamPage'));
const DashboardPage    = lazy(() => import('@/pages/DashboardPage'));
const MatchPage        = lazy(() => import('@/pages/MatchPage'));
const TablePage        = lazy(() => import('@/pages/TablePage'));
const SquadPage        = lazy(() => import('@/pages/SquadPage'));
const FixturesPage     = lazy(() => import('@/pages/FixturesPage'));
const TransferPage     = lazy(() => import('@/pages/TransferPage'));
const TrainingPage     = lazy(() => import('@/pages/TrainingPage'));
const FinancePage      = lazy(() => import('@/pages/FinancePage'));
const TacticsPage      = lazy(() => import('@/pages/TacticsPage'));
const HistoryPage      = lazy(() => import('@/pages/HistoryPage'));
const SponsorsPage     = lazy(() => import('@/pages/SponsorsPage'));
const RankingsPage     = lazy(() => import('@/pages/RankingsPage'));
const CareerPage       = lazy(() => import('@/pages/CareerPage'));
const ScoutingPage     = lazy(() => import('@/pages/ScoutingPage'));
const InfrastructurePage = lazy(() => import('@/pages/InfrastructurePage'));
const StatsPage        = lazy(() => import('@/pages/StatsPage'));
const AwardsPage       = lazy(() => import('@/pages/AwardsPage'));
const NationalTeamPage = lazy(() => import('@/pages/NationalTeamPage'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[40vh] text-white/30 text-sm">
      Carregando…
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
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
          <Route path="/game/sponsors" element={<SponsorsPage />} />
          <Route path="/game/rankings" element={<RankingsPage />} />
          <Route path="/game/career" element={<CareerPage />} />
          <Route path="/game/scouting" element={<ScoutingPage />} />
          <Route path="/game/infrastructure" element={<InfrastructurePage />} />
          <Route path="/game/stats" element={<StatsPage />} />
          <Route path="/game/awards" element={<AwardsPage />} />
          <Route path="/game/national-team" element={<NationalTeamPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
