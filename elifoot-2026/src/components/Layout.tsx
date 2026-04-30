import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Home, Trophy, Users, Calendar, LogOut, Save, ArrowRightLeft, Dumbbell, DollarSign, Shield, History, Volume2, VolumeX } from 'lucide-react';
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

  const LANGS: Lang[] = ['pt', 'en', 'es'];

  useEffect(() => {
    if (!save) navigate('/');
  }, [save, navigate]);

  if (!save) return null;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Topbar */}
      <header className="bg-midnight-900/80 backdrop-blur border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm"
              style={{ backgroundColor: userTeam?.primaryColor, color: userTeam?.secondaryColor }}
            >
              {userTeam?.shortName}
            </div>
            <div>
              <div className="font-semibold leading-tight">{userTeam?.name}</div>
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

      {/* Body */}
      <div className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 flex gap-6">
        <nav className="hidden md:flex flex-col gap-1 w-52 panel p-3 h-fit sticky top-6">
          <NavItem to="/game" icon={<Home className="w-4 h-4" />}>{t('nav_home')}</NavItem>
          <NavItem to="/game/squad" icon={<Users className="w-4 h-4" />}>{t('nav_squad')}</NavItem>
          <NavItem to="/game/fixtures" icon={<Calendar className="w-4 h-4" />}>{t('nav_fixtures')}</NavItem>
          <NavItem to="/game/transfers" icon={<ArrowRightLeft className="w-4 h-4" />}>{t('nav_transfers')}</NavItem>
          <NavItem to="/game/training" icon={<Dumbbell className="w-4 h-4" />}>{t('nav_training')}</NavItem>
          <NavItem to="/game/finance" icon={<DollarSign className="w-4 h-4" />}>{t('nav_finance')}</NavItem>
          <NavItem to="/game/tactics" icon={<Shield className="w-4 h-4" />}>{t('nav_tactics')}</NavItem>
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-midnight-900 border-t border-white/10 flex justify-around py-2">
        <BottomNavItem to="/game" icon={<Home className="w-5 h-5" />} label="Início" />
        <BottomNavItem to="/game/squad" icon={<Users className="w-5 h-5" />} label="Elenco" />
        <BottomNavItem to="/game/fixtures" icon={<Calendar className="w-5 h-5" />} label="Jogos" />
        {save.competitions[0] && (
          <BottomNavItem
            to={`/game/table/${save.competitions[0].id}`}
            icon={<Trophy className="w-5 h-5" />}
            label="Tabela"
          />
        )}
      </nav>
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
