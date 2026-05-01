import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGameStore } from '@/store/gameStore';
import type { MatchEvent, MatchResult, TacticalPosture, PressingLevel } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ArrowRightLeft } from 'lucide-react';
import MatchField from '@/components/MatchField';
import { soundEngine } from '@/engine/soundEngine';

type Phase = 'prematch' | 'playing' | 'halftime' | 'finished';

const POSTURE_LABELS: Record<TacticalPosture, string> = {
  attack:    'Ofensivo',
  balanced:  'Equilibrado',
  defensive: 'Defensivo',
};

const PRESSING_LABELS: Record<PressingLevel, string> = {
  high:   'Alto',
  medium: 'Médio',
  low:    'Baixo',
};

export default function MatchPage() {
  const { fixtureId } = useParams<{ fixtureId: string }>();
  const navigate = useNavigate();
  const save = useGameStore((s) => s.save);
  const simulateFirstHalf = useGameStore((s) => s.simulateFirstHalf);
  const simulateSecondHalf = useGameStore((s) => s.simulateSecondHalf);
  const setTacticalSetup = useGameStore((s) => s.setTacticalSetup);

  const [phase, setPhase] = useState<Phase>('prematch');
  const [result, setResult] = useState<MatchResult | null>(null);
  const [firstHalfResult, setFirstHalfResult] = useState<MatchResult | null>(null);
  const [displayedEvents, setDisplayedEvents] = useState<MatchEvent[]>([]);
  const [currentMinute, setCurrentMinute] = useState(0);
  const [running, setRunning] = useState(false);
  const [halftimeSubs, setHalftimeSubs] = useState<{ outId: string; inId: string }[]>([]);
  const [subOut, setSubOut] = useState<string | null>(null);
  const [latestEvent, setLatestEvent] = useState<MatchEvent | undefined>();
  const startedRef = useRef(false);

  const fixture = save?.competitions.flatMap((c) => c.fixtures).find((f) => f.id === fixtureId);
  const home = fixture && save?.teams.find((t) => t.id === fixture.homeTeamId);
  const away = fixture && save?.teams.find((t) => t.id === fixture.awayTeamId);
  const userTeam = save?.teams.find((t) => t.id === save.controlledTeamId);
  const tactics = save?.tacticalSetup;

  // Iniciar partida: simula apenas o 1º tempo
  async function startMatch() {
    if (!fixtureId || startedRef.current || !fixture) return;
    startedRef.current = true;
    soundEngine.play('whistle');
    const r = await simulateFirstHalf(fixtureId);
    if (r) {
      setFirstHalfResult(r);
      setResult(r);
      setPhase('playing');
      setRunning(true);
    }
  }

  // Animação minuto a minuto
  useEffect(() => {
    if (phase !== 'playing' || !result || !running) return;

    // Pausa no intervalo
    if (currentMinute === 45) {
      soundEngine.play('whistle');
      setRunning(false);
      setPhase('halftime');
      return;
    }

    if (currentMinute >= 90) {
      soundEngine.play('whistle_end');
      setRunning(false);
      setPhase('finished');
      return;
    }

    const timer = setTimeout(() => {
      const newEvents = result.events.filter((e) => e.minute === currentMinute + 1);
      if (newEvents.length) {
        // Prioriza evento de gol se houver múltiplos no mesmo minuto (ex: escanteio + gol)
        const goalEvent = newEvents.find((e) => e.type === 'goal' || e.type === 'penalty_scored');
        const latest = goalEvent ?? newEvents[0];
        setLatestEvent(latest);
        if (latest.type === 'goal' || latest.type === 'penalty_scored') {
          soundEngine.play('goal');
          soundEngine.play('crowd_goal');
        } else if (latest.type === 'yellow_card' || latest.type === 'red_card') {
          soundEngine.play('card');
        } else if (latest.type === 'shot_on_target') {
          soundEngine.play('crowd_oooh');
        }
        setDisplayedEvents((prev) => [...newEvents, ...prev]);
      }
      setCurrentMinute((m) => m + 1);
    }, 60);

    return () => clearTimeout(timer);
  }, [currentMinute, result, running, phase]);

  // Continuar: simula 2º tempo com as substituições aplicadas
  async function continueMatch() {
    if (!fixtureId || !firstHalfResult) return;

    // Mostra eventos de substituição na narração
    halftimeSubs.forEach((sub, i) => {
      const outPlayer = userTeam?.squad.find((p) => p.id === sub.outId);
      const inPlayer  = userTeam?.squad.find((p) => p.id === sub.inId);
      if (outPlayer && inPlayer) {
        setDisplayedEvents((prev) => [
          {
            minute: 45 + i,
            type: 'substitution',
            side: fixture?.homeTeamId === save?.controlledTeamId ? 'home' : 'away',
            description: `Substituição: ${inPlayer.name} entra no lugar de ${outPlayer.name}.`,
          },
          ...prev,
        ]);
      }
    });

    setCurrentMinute(46);
    setPhase('playing');
    setRunning(true);

    // Simula o 2º tempo com as substituições e atualiza o resultado combinado
    const combined = await simulateSecondHalf(fixtureId, firstHalfResult, halftimeSubs);
    if (combined) setResult(combined);
  }

  if (!save || !fixture || !home || !away) return <div className="p-6">Carregando partida...</div>;

  const comp = save.competitions.find((c) => c.id === fixture.competitionId);

  const homeScoreNow = result
    ? result.events.filter((e) => e.type === 'goal' && e.side === 'home' && e.minute <= currentMinute).length
    : 0;
  const awayScoreNow = result
    ? result.events.filter((e) => e.type === 'goal' && e.side === 'away' && e.minute <= currentMinute).length
    : 0;

  // ── Pré-jogo ─────────────────────────────────────────────
  if (phase === 'prematch') {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="panel p-6 text-center">
          <div className="text-xs uppercase tracking-wider text-white/50 mb-2">
            {comp?.shortName} · Rodada {fixture.round}
          </div>
          <div className="flex items-center justify-around mb-6">
            <TeamBadge name={home.name} shortName={home.shortName} bg={home.primaryColor} fg={home.secondaryColor} />
            <div className="display-font text-4xl text-white/30">VS</div>
            <TeamBadge name={away.name} shortName={away.shortName} bg={away.primaryColor} fg={away.secondaryColor} />
          </div>

          {/* Táticas */}
          {tactics && (
            <div className="space-y-4 text-left mb-6">
              <h3 className="font-semibold text-sm text-white/70">Postura</h3>
              <div className="flex gap-2">
                {(['attack', 'balanced', 'defensive'] as TacticalPosture[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setTacticalSetup({ ...tactics, posture: p })}
                    className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${
                      tactics.posture === p
                        ? 'border-pitch-500 bg-pitch-500/20 font-semibold'
                        : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    {POSTURE_LABELS[p]}
                  </button>
                ))}
              </div>

              <h3 className="font-semibold text-sm text-white/70">Pressão</h3>
              <div className="flex gap-2">
                {(['high', 'medium', 'low'] as PressingLevel[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setTacticalSetup({ ...tactics, pressing: p })}
                    className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${
                      tactics.pressing === p
                        ? 'border-pitch-500 bg-pitch-500/20 font-semibold'
                        : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    {PRESSING_LABELS[p]}
                  </button>
                ))}
              </div>

              <div className="bg-midnight-700 rounded-lg p-3 text-xs text-white/60">
                {tactics.posture === 'attack'    && '⚡ Ofensivo: +20% ataque, -15% defesa'}
                {tactics.posture === 'balanced'  && '⚖️ Equilibrado: sem modificadores'}
                {tactics.posture === 'defensive' && '🛡️ Defensivo: +20% defesa, -20% ataque'}
                {' · '}
                {tactics.pressing === 'high'   && 'Pressão alta: mais oportunidades, mais desgaste'}
                {tactics.pressing === 'medium' && 'Pressão média: equilíbrio'}
                {tactics.pressing === 'low'    && 'Pressão baixa: menos riscos'}
              </div>
            </div>
          )}

          <button onClick={startMatch} className="btn-primary w-full flex items-center justify-center gap-2 text-lg py-3">
            Iniciar Partida <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // ── Intervalo ─────────────────────────────────────────────
  if (phase === 'halftime') {
    const startingIds = new Set(userTeam?.starting11 ?? []);
    const benchPlayers = userTeam?.squad.filter((p) => !startingIds.has(p.id) && !p.injuredUntil) ?? [];
    const startingPlayers = userTeam?.squad.filter((p) => startingIds.has(p.id) && p.position !== 'GK') ?? [];
    const alreadySubbedOut = new Set(halftimeSubs.map((s) => s.outId));
    const alreadySubbedIn  = new Set(halftimeSubs.map((s) => s.inId));

    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="panel p-5">
          <div className="text-center text-xs uppercase tracking-wider text-white/50 mb-2">Intervalo</div>
          <div className="display-font text-5xl text-center mb-4">
            {homeScoreNow} <span className="text-white/30">x</span> {awayScoreNow}
          </div>
          <div className="text-center text-sm text-white/60 mb-4">{home.shortName} vs {away.shortName}</div>

          {halftimeSubs.length < 3 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-pitch-400" />
                Substituições ({halftimeSubs.length}/3)
              </h3>

              {subOut ? (
                <div>
                  <div className="text-xs text-white/50 mb-2">Escolha quem entra:</div>
                  <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto">
                    {benchPlayers
                      .filter((p) => !alreadySubbedIn.has(p.id))
                      .map((p) => (
                        <button
                          key={p.id}
                          className="text-left px-3 py-2 bg-pitch-500/20 border border-pitch-500/40 rounded text-sm hover:bg-pitch-500/30"
                          onClick={() => {
                            setHalftimeSubs((prev) => [...prev, { outId: subOut, inId: p.id }]);
                            setSubOut(null);
                          }}
                        >
                          <span className="text-xs text-white/40 mr-1">{p.position}</span>
                          {p.name}
                          <span className="text-xs text-white/40 ml-1">({p.overall})</span>
                        </button>
                      ))}
                  </div>
                  <button className="btn-ghost text-xs mt-2" onClick={() => setSubOut(null)}>Cancelar</button>
                </div>
              ) : (
                <div>
                  <div className="text-xs text-white/50 mb-2">Quem sai:</div>
                  <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto">
                    {startingPlayers
                      .filter((p) => !alreadySubbedOut.has(p.id))
                      .map((p) => (
                        <button
                          key={p.id}
                          className="text-left px-3 py-2 bg-white/5 border border-white/10 rounded text-sm hover:bg-white/10"
                          onClick={() => setSubOut(p.id)}
                        >
                          <span className="text-xs text-white/40 mr-1">{p.position}</span>
                          {p.name}
                          <span className="text-xs text-white/40 ml-1">({p.overall})</span>
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {halftimeSubs.length > 0 && (
                <div className="space-y-1 text-xs text-white/60">
                  {halftimeSubs.map((sub, i) => {
                    const o = userTeam?.squad.find((p) => p.id === sub.outId);
                    const n = userTeam?.squad.find((p) => p.id === sub.inId);
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <ArrowRightLeft className="w-3 h-3 text-pitch-400" />
                        <span className="text-red-400">{o?.name}</span>
                        <span>→</span>
                        <span className="text-green-400">{n?.name}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <button onClick={continueMatch} className="btn-primary w-full mt-4">
            Iniciar 2º Tempo →
          </button>
        </div>
      </div>
    );
  }

  // ── Em jogo / Fim de jogo ─────────────────────────────────
  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="panel p-6">
        <div className="text-center text-xs uppercase tracking-wider text-white/50 mb-3">
          {comp?.shortName} · Rodada {fixture.round}
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

        <div className="w-full h-1 bg-white/10 rounded overflow-hidden mb-4">
          <motion.div
            className="h-full bg-pitch-500"
            initial={{ width: 0 }}
            animate={{ width: `${(currentMinute / 90) * 100}%` }}
            transition={{ ease: 'linear' }}
          />
        </div>

        {/* Tática aplicada */}
        {tactics && (
          <div className="text-center text-xs text-white/40 mb-4">
            {POSTURE_LABELS[tactics.posture]} · Pressing {PRESSING_LABELS[tactics.pressing]}
          </div>
        )}

        {phase === 'finished' && (
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

      {/* Campo 2D animado */}
      <div className="panel p-3 overflow-hidden">
        <MatchField
          currentEvent={latestEvent}
          homeColor={home.primaryColor}
          awayColor={away.primaryColor}
          isUserHome={fixture.homeTeamId === save.controlledTeamId}
          phase={phase}
        />
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
                className={`flex gap-3 text-sm py-1 px-2 rounded ${
                  e.type === 'goal' ? 'bg-pitch-500/20 animate-goal-flash' :
                  e.type === 'substitution' ? 'bg-blue-500/10' : ''
                }`}
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
