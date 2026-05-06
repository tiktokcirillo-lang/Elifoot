import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import {
  Home, Trophy, Users, Calendar, LogOut, Save, ArrowRightLeft,
  Dumbbell, DollarSign, Shield, History, Volume2, VolumeX,
  Handshake, MoreHorizontal, X, AlertTriangle, BarChart2, Briefcase, Search, Building2, TrendingUp, Award,
} from 'lucide-react';
import clsx from 'clsx';
import { useI18nStore, useT, type Lang } from '@/i18n';
import { soundEngine } from '@/engine/soundEngine';

export default function Layout() {
  const save = useGameStore((s) => s.save);
  const userTeam = useGameStore((s) => s.getUserTeam());
  const closeGame = useGameStore((s) => s.closeGame);
  const saveGame = useGameStore((s) => s.saveGame);
  const navigate = useNavigate();
  const t = useT();
  const { lang, setLang } = useI18nStore();
  const [soundOn, setSoundOn] = useState(soundEngine.enabled);
  const [moreOpen, setMoreOpen] = useState(false);

  const LANGS: Lang[] = ['pt', 'en', 'es'];

  useEffect(() => {
    if (!save) navigate('/');
  }, [save, navigate]);

  if (!save) return null;

  const dismissed = save.dismissed;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Topbar */}
      <header className="bg-midnight-900/80 backdrop-blur border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm relative"
              style={{ backgroundColor: userTeam?.primaryColor, color: userTeam?.secondaryColor }}
            >
              {userTeam?.shortName}
              {dismissed && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-midnight-900" />
              )}
            </div>
            <div>
              <div className="font-semibold leading-tight flex items-center gap-1.5">
                {userTeam?.name}
                {dismissed && (
                  <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-normal">
                    Demitido
                  </span>
                )}
              </div>
              <div className="text-xs text-white/50">
                Técnico {save.managerName} · Temporada {save.season} · Dia {save.currentTurn}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Seletor de idioma */}
            <div className="hidden sm:flex gap-0.5 bg-midnight-800 rounded p-0.5">
              {LANGS.map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`text-[10px] uppercase px-1.5 py-0.5 rounded transition-colors ${
                    lang === l ? 'bg-pitch-600 text-white font-semibold' : 'text-white/40 hover:text-white'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>

            {/* Toggle de som */}
            <button
              className="btn-ghost text-sm p-2"
              title={soundOn ? t('sound_on') : t('sound_off')}
              onClick={() => setSoundOn(soundEngine.toggle())}
            >
              {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-white/30" />}
            </button>

            <button
              className="btn-ghost text-sm flex items-center gap-1"
              onClick={() => saveGame()}
              title={t('save')}
            >
              <Save className="w-4 h-4" /> {t('save')}
            </button>
            <button
              className="btn-ghost text-sm flex items-center gap-1"
              onClick={() => { closeGame(); navigate('/'); }}
              title={t('exit')}
            >
              <LogOut className="w-4 h-4" /> {t('exit')}
            </button>
          </div>
        </div>
      </header>

      {/* Alerta de demissão */}
      {dismissed && (
        <div className="bg-red-900/40 border-b border-red-500/30 px-4 py-2 flex items-center gap-2 text-sm text-red-300">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          Você foi demitido — acesse{' '}
          <NavLink to="/game/history" className="underline font-semibold">
            Histórico
          </NavLink>{' '}
          para escolher um novo clube.
        </div>
      )}

      {/* Body */}
      <div className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 flex gap-6 pb-20 md:pb-6">
        <nav className="hidden md:flex flex-col gap-1 w-52 panel p-3 h-fit sticky top-6">
          <NavItem to="/game" icon={<Home className="w-4 h-4" />}>{t('nav_home')}</NavItem>
          <NavItem to="/game/squad" icon={<Users className="w-4 h-4" />}>{t('nav_squad')}</NavItem>
          <NavItem to="/game/fixtures" icon={<Calendar className="w-4 h-4" />}>{t('nav_fixtures')}</NavItem>
          <NavItem to="/game/transfers" icon={<ArrowRightLeft className="w-4 h-4" />}>{t('nav_transfers')}</NavItem>
          <NavItem to="/game/training" icon={<Dumbbell className="w-4 h-4" />}>{t('nav_training')}</NavItem>
          <NavItem to="/game/finance" icon={<DollarSign className="w-4 h-4" />}>{t('nav_finance')}</NavItem>
          <NavItem to="/game/tactics" icon={<Shield className="w-4 h-4" />}>{t('nav_tactics')}</NavItem>
          <NavItem to="/game/sponsors" icon={<Handshake className="w-4 h-4" />}>Patrocínios</NavItem>
          <NavItem to="/game/rankings" icon={<BarChart2 className="w-4 h-4" />}>Rankings</NavItem>
          <NavItem to="/game/scouting" icon={<Search className="w-4 h-4" />}>Scouting</NavItem>
          <NavItem to="/game/infrastructure" icon={<Building2 className="w-4 h-4" />}>Infraestrutura</NavItem>
          <NavItem to="/game/stats" icon={<TrendingUp className="w-4 h-4" />}>Estatísticas</NavItem>
          <NavItem to="/game/awards" icon={<Award className="w-4 h-4" />}>Prêmios</NavItem>
          <NavItem to="/game/career" icon={<Briefcase className="w-4 h-4" />}>Carreira</NavItem>
          <NavItem to="/game/history" icon={<History className="w-4 h-4" />}>{t('nav_history')}</NavItem>
          <div className="px-3 pt-3 pb-1 text-xs uppercase tracking-wider text-white/30">{t('nav_competitions')}</div>
          {save.competitions.map((c) => (
            <NavItem
              key={c.id}
              to={`/game/table/${c.id}`}
              icon={<Trophy className="w-4 h-4" />}
            >
              {c.shortName}
            </NavItem>
          ))}
        </nav>

        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>

      {/* Bottom nav mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-midnight-900/95 backdrop-blur border-t border-white/10 flex justify-around py-2 z-40">
        <BottomNavItem to="/game" icon={<Home className="w-5 h-5" />} label="Início" />
        <BottomNavItem to="/game/squad" icon={<Users className="w-5 h-5" />} label="Elenco" />
        <BottomNavItem to="/game/fixtures" icon={<Calendar className="w-5 h-5" />} label="Jogos" />
        <BottomNavItem to="/game/transfers" icon={<ArrowRightLeft className="w-5 h-5" />} label="Mercado" />
        <button
          onClick={() => setMoreOpen((v) => !v)}
          className="flex flex-col items-center text-[11px] gap-0.5 text-white/60"
        >
          {moreOpen ? <X className="w-5 h-5" /> : <MoreHorizontal className="w-5 h-5" />}
          Mais
        </button>
      </nav>

      {/* Drawer "Mais" no mobile */}
      {moreOpen && (
        <>
          {/* Overlay */}
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-30"
            onClick={() => setMoreOpen(false)}
          />
          {/* Painel */}
          <div className="md:hidden fixed bottom-14 left-0 right-0 bg-midnight-900 border-t border-white/10 z-40 px-4 py-4 rounded-t-2xl">
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { to: '/game/finance', icon: <DollarSign className="w-5 h-5" />, label: 'Finanças' },
                { to: '/game/training', icon: <Dumbbell className="w-5 h-5" />, label: 'Treino' },
                { to: '/game/tactics', icon: <Shield className="w-5 h-5" />, label: 'Tática' },
                { to: '/game/sponsors', icon: <Handshake className="w-5 h-5" />, label: 'Patrocínios' },
                { to: '/game/rankings', icon: <BarChart2 className="w-5 h-5" />, label: 'Rankings' },
                { to: '/game/scouting', icon: <Search className="w-5 h-5" />, label: 'Scouting' },
                { to: '/game/infrastructure', icon: <Building2 className="w-5 h-5" />, label: 'Infraestrutura' },
                { to: '/game/stats', icon: <TrendingUp className="w-5 h-5" />, label: 'Estatísticas' },
                { to: '/game/awards', icon: <Award className="w-5 h-5" />, label: 'Prêmios' },
                { to: '/game/career', icon: <Briefcase className="w-5 h-5" />, label: 'Carreira' },
                { to: '/game/history', icon: <History className="w-5 h-5" />, label: 'Histórico' },
              ].map(({ to, icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMoreOpen(false)}
                  className={({ isActive }) =>
                    clsx(
                      'flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-xs transition-colors',
                      isActive ? 'bg-pitch-500/20 text-white' : 'bg-white/5 text-white/60',
                    )
                  }
                >
                  {icon}
                  {label}
                </NavLink>
              ))}
            </div>
            <div className="text-xs text-white/30 mb-2 px-1">Competições</div>
            <div className="flex flex-wrap gap-2">
              {save.competitions.map((c) => (
                <NavLink
                  key={c.id}
                  to={`/game/table/${c.id}`}
                  onClick={() => setMoreOpen(false)}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors',
                      isActive ? 'bg-pitch-500/20 text-white' : 'bg-white/5 text-white/60',
                    )
                  }
                >
                  <Trophy className="w-3.5 h-3.5" /> {c.shortName}
                </NavLink>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function NavItem({ to, icon, children }: { to: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        clsx(
          'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
          isActive ? 'bg-pitch-500/20 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white',
        )
      }
    >
      {icon}
      {children}
    </NavLink>
  );
}

function BottomNavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        clsx(
          'flex flex-col items-center text-[11px] gap-0.5',
          isActive ? 'text-pitch-500' : 'text-white/60',
        )
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}
