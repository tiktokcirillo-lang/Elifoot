import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGameStore } from '@/store/gameStore';
import type { MatchEvent, MatchResult } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

export default function MatchPage() {
  const { fixtureId } = useParams<{ fixtureId: string }>();
  const navigate = useNavigate();
  const save = useGameStore((s) => s.save);
  const playUserMatch = useGameStore((s) => s.playUserMatch);

  const [result, setResult] = useState<MatchResult | null>(null);
  const [displayedEvents, setDisplayedEvents] = useState<MatchEvent[]>([]);
  const [currentMinute, setCurrentMinute] = useState(0);
  const [running, setRunning] = useState(false);
  const startedRef = useRef(false);

  const fixture = save?.competitions
    .flatMap((c) => c.fixtures)
    .find((f) => f.id === fixtureId);

  const home = fixture && save?.teams.find((t) => t.id === fixture.homeTeamId);
  const away = fixture && save?.teams.find((t) => t.id === fixture.awayTeamId);

  useEffect(() => {
    if (!fixtureId || startedRef.current || !fixture) return;
    startedRef.current = true;
    (async () => {
      const r = await playUserMatch(fixtureId);
      if (r) {
        setResult(r);
        setRunning(true);
      }
    })();
  }, [fixtureId, fixture, playUserMatch]);

  // Animação de minutos
  useEffect(() => {
    if (!result || !running) return;
    if (currentMinute >= 90) {
      setRunning(false);
      return;
    }
    const timer = setTimeout(() => {
      const newEvents = result.events.filter((e) => e.minute === currentMinute + 1);
      if (newEvents.length > 0) {
        setDisplayedEvents((prev) => [...newEvents, ...prev]);
      }
      setCurrentMinute((m) => m + 1);
    }, 60); // ~5 segundos para 90 minutos
    return () => clearTimeout(timer);
  }, [currentMinute, result, running]);

  if (!save || !fixture || !home || !away) {
    return <div className="p-6">Carregando partida...</div>;
  }

  // Score acumulado até o minuto atual
  const homeScoreNow = result
    ? result.events.filter((e) => e.type === 'goal' && e.side === 'home' && e.minute <= currentMinute).length
    : 0;
  const awayScoreNow = result
    ? result.events.filter((e) => e.type === 'goal' && e.side === 'away' && e.minute <= currentMinute).length
    : 0;

  const finished = !running && currentMinute >= 90;

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="panel p-6">
        <div className="text-center text-xs uppercase tracking-wider text-white/50 mb-3">
          {save.competitions.find((c) => c.id === fixture.competitionId)?.shortName} · Rodada {fixture.round}
        </div>
        <div className="flex items-center justify-around mb-4">
          <TeamBadge name={home.name} shortName={home.shortName} bg={home.primaryColor} fg={home.secondaryColor} />
          <div className="text-center">
            <div className="display-font text-6xl tracking-tight">
              {homeScoreNow} <span className="text-white/30">x</span> {awayScoreNow}
            </div>
            <div className="text-xs text-white/50 mt-1">{currentMinute}'</div>
          </div>
          <TeamBadge name={away.name} shortName={away.shortName} bg={away.primaryColor} fg={away.secondaryColor} />
        </div>

        {/* Barra de progresso do tempo */}
        <div className="w-full h-1 bg-white/10 rounded overflow-hidden mb-4">
          <motion.div
            className="h-full bg-pitch-500"
            initial={{ width: 0 }}
            animate={{ width: `${(currentMinute / 90) * 100}%` }}
            transition={{ ease: 'linear' }}
          />
        </div>

        {finished && (
          <div className="text-center mb-4">
            <div className="display-font text-3xl text-gold-500">Fim de jogo</div>
            <div className="mt-3 grid grid-cols-3 text-xs text-white/60 max-w-md mx-auto">
              <div>Finalizações: {result?.homeShots} - {result?.awayShots}</div>
              <div>No alvo: {result?.homeShotsOnTarget} - {result?.awayShotsOnTarget}</div>
              <div>Posse: {result?.homePossession}% - {100 - (result?.homePossession ?? 50)}%</div>
            </div>
            <button onClick={() => navigate('/game')} className="btn-primary mt-4">
              Voltar ao painel
            </button>
          </div>
        )}
      </div>

      {/* Narração */}
      <div className="panel p-4">
        <div className="text-sm font-semibold text-white/70 mb-2">Narração</div>
        <ul className="space-y-1.5 max-h-96 overflow-auto">
          <AnimatePresence initial={false}>
            {displayedEvents.map((e, idx) => (
              <motion.li
                key={`${e.minute}-${idx}`}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 text-sm py-1 px-2 rounded ${e.type === 'goal' ? 'bg-pitch-500/20 animate-goal-flash' : ''}`}
              >
                <span className="text-white/40 w-10 shrink-0">{e.minute}'</span>
                <span>{e.description}</span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </div>
    </div>
  );
}

function TeamBadge({ name, shortName, bg, fg }: { name: string; shortName: string; bg: string; fg: string }) {
  return (
    <div className="text-center">
      <div
        className="w-20 h-20 rounded-xl flex items-center justify-center font-bold text-lg mx-auto"
        style={{ backgroundColor: bg, color: fg }}
      >
        {shortName}
      </div>
      <div className="text-xs text-white/70 mt-2 max-w-[100px] truncate">{name}</div>
    </div>
  );
}
