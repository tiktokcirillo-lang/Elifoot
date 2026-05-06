import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGameStore } from '@/store/gameStore';
import type { MatchEvent, MatchResult, TacticalPosture, PressingLevel } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ArrowRightLeft, Mic, MicOff, Volume2, VolumeX, Star, Flame } from 'lucide-react';
import MatchField from '@/components/MatchField';
import { soundEngine } from '@/engine/soundEngine';
import { narratorEngine } from '@/engine/narratorEngine';
import { getRivalry } from '@/data/rivalries';

type Phase = 'prematch' | 'teamtalk' | 'playing' | 'halftime' | 'finished' | 'press';

const TEAM_TALK_OPTIONS = [
  { key: 'motivate', emoji: '🔥', label: 'Motivar', desc: 'Discurso inspirador — máximo empenho!', moraleBonus: 10 },
  { key: 'calm',     emoji: '⚽', label: 'Foco',    desc: 'Trabalho sólido, jogo por jogo.',       moraleBonus: 3  },
  { key: 'pressure', emoji: '😤', label: 'Pressionar', desc: 'Vocês têm que dar mais — cobro resultado.', moraleBonus: -5 },
] as const;

const RATING_GRADES = [
  { value: 4, label: '4', color: 'bg-red-500/80' },
  { value: 5, label: '5', color: 'bg-orange-500/80' },
  { value: 6, label: '6', color: 'bg-yellow-500/80' },
  { value: 7, label: '7', color: 'bg-yellow-400/80' },
  { value: 8, label: '8', color: 'bg-green-500/80' },
  { value: 9, label: '9', color: 'bg-green-400/80' },
  { value: 10, label: '10', color: 'bg-gold-400/80' },
];

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
  const applyTeamTalk = useGameStore((s) => s.applyTeamTalk);
  const recordMatchRating = useGameStore((s) => s.recordMatchRating);
  const applyPressConferenceEffects = useGameStore((s) => s.applyPressConferenceEffects);

  const [phase, setPhase] = useState<Phase>('prematch');
  const [postMatchRatings, setPostMatchRatings] = useState<Record<string, number>>({});
  const [ratingsSaved, setRatingsSaved] = useState(false);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [firstHalfResult, setFirstHalfResult] = useState<MatchResult | null>(null);
  const [soundOn, setSoundOn] = useState(soundEngine.enabled);
  const [narratorOn, setNarratorOn] = useState(narratorEngine.enabled);
  const [displayedEvents, setDisplayedEvents] = useState<MatchEvent[]>([]);
  const [currentMinute, setCurrentMinute] = useState(0);
  const [running, setRunning] = useState(false);
  const [halftimeSubs, setHalftimeSubs] = useState<{ outId: string; inId: string }[]>([]);
  const [subOut, setSubOut] = useState<string | null>(null);
  const [pressAnswered, setPressAnswered] = useState<boolean[]>([false, false]);
  const [latestEvent, setLatestEvent] = useState<MatchEvent | undefined>();
  const startedRef = useRef(false);

  const fixture = save?.competitions.flatMap((c) => c.fixtures).find((f) => f.id === fixtureId);
  const home = fixture && save?.teams.find((t) => t.id === fixture.homeTeamId);
  const away = fixture && save?.teams.find((t) => t.id === fixture.awayTeamId);
  const userTeam = save?.teams.find((t) => t.id === save.controlledTeamId);
  const tactics = save?.tacticalSetup;

  // Iniciar partida: simula apenas o 1º tempo
  async function startMatch(moraleBonus = 0) {
    if (!fixtureId || startedRef.current || !fixture) return;
    if (moraleBonus !== 0) applyTeamTalk(moraleBonus);
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
      narratorEngine.cancel();
      setRunning(false);
      setPhase('halftime');
      return;
    }

    if (currentMinute >= 90) {
      soundEngine.play('whistle_end');
      narratorEngine.cancel();
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
          // Gol: interrompe qualquer narração e fala com empolgação
          narratorEngine.speak(latest.description, { interrupt: true, rate: 1.0, pitch: 1.25 });
        } else if (latest.type === 'yellow_card' || latest.type === 'red_card') {
          soundEngine.play('card');
          narratorEngine.speakIfFree(latest.description, { rate: 1.1, pitch: 0.95 });
        } else if (latest.type === 'shot_on_target') {
          soundEngine.play('crowd_oooh');
          narratorEngine.speakIfFree(latest.description, { rate: 1.25, pitch: 1.0 });
        } else if (latest.type === 'corner') {
          narratorEngine.speakIfFree(latest.description, { rate: 1.3, pitch: 1.05 });
        }
        // shot_off_target: sem narração para não sobrecarregar

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
  const opponentId = fixture.homeTeamId === save.controlledTeamId ? fixture.awayTeamId : fixture.homeTeamId;
  const rivalry = getRivalry(save.controlledTeamId, opponentId);

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
          <div className="flex items-center justify-around mb-4">
            <TeamBadge name={home.name} shortName={home.shortName} bg={home.primaryColor} fg={home.secondaryColor} />
            <div className="display-font text-4xl text-white/30">VS</div>
            <TeamBadge name={away.name} shortName={away.shortName} bg={away.primaryColor} fg={away.secondaryColor} />
          </div>

          {/* Banner de clássico */}
          {rivalry && (
            <div className={`mb-5 rounded-xl py-3 px-4 flex items-center justify-center gap-2 ${
              rivalry.tier === 'classico'
                ? 'bg-yellow-500/20 border border-yellow-500/40 text-yellow-300'
                : 'bg-red-500/15 border border-red-500/30 text-red-300'
            }`}>
              <Flame className="w-4 h-4" />
              <span className="font-bold tracking-wide">{rivalry.tier === 'classico' ? '🏆 CLÁSSICO' : '⚽ DERBY'}</span>
              <span className="text-sm opacity-80">— {rivalry.name}</span>
            </div>
          )}

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

          {/* Controles de som e narrador */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setSoundOn(soundEngine.toggle())}
              className="flex-1 flex items-center justify-center gap-2 py-2 text-sm rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 transition-colors"
            >
              {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-white/30" />}
              Sons {soundOn ? 'ligados' : 'desligados'}
            </button>
            <button
              onClick={() => setNarratorOn(narratorEngine.toggle())}
              className="flex-1 flex items-center justify-center gap-2 py-2 text-sm rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 transition-colors"
            >
              {narratorOn ? <Mic className="w-4 h-4 text-pitch-400" /> : <MicOff className="w-4 h-4 text-white/30" />}
              Narrador {narratorOn ? 'ligado' : 'desligado'}
            </button>
          </div>

          <button onClick={() => setPhase('teamtalk')} className="btn-primary w-full flex items-center justify-center gap-2 text-lg py-3">
            Pronto — Team Talk <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // ── Team Talk ─────────────────────────────────────────────
  if (phase === 'teamtalk') {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="panel p-6">
          <div className="text-xs uppercase tracking-wider text-white/50 mb-1 text-center">Vestiário</div>
          <div className="display-font text-2xl text-center mb-5">Discurso pré-jogo</div>
          <div className="space-y-3 mb-6">
            {TEAM_TALK_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => startMatch(opt.moraleBonus)}
                className="w-full text-left rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 p-4 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{opt.emoji}</span>
                  <div>
                    <div className="font-semibold text-white group-hover:text-pitch-300 transition-colors">{opt.label}</div>
                    <div className="text-sm text-white/50">{opt.desc}</div>
                  </div>
                  <div className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${
                    opt.moraleBonus > 0 ? 'bg-green-500/20 text-green-400' :
                    opt.moraleBonus < 0 ? 'bg-red-500/20 text-red-400' :
                    'bg-white/10 text-white/40'
                  }`}>
                    {opt.moraleBonus > 0 ? `Moral +${opt.moraleBonus}` : opt.moraleBonus < 0 ? `Moral ${opt.moraleBonus}` : 'Neutro'}
                  </div>
                </div>
              </button>
            ))}
          </div>
          <button onClick={() => startMatch(0)} className="btn-ghost text-sm w-full">
            Pular — Entrar em campo sem discurso
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
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/50">
            {comp?.shortName} · Rodada {fixture.round}
            {rivalry && (
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                rivalry.tier === 'classico' ? 'bg-yellow-500/30 text-yellow-300' : 'bg-red-500/20 text-red-300'
              }`}>
                {rivalry.tier === 'classico' ? '🏆 CLÁSSICO' : '⚽ DERBY'}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSoundOn(soundEngine.toggle())}
              title={soundOn ? 'Desligar sons' : 'Ligar sons'}
              className="p-1.5 rounded text-white/40 hover:text-white/70 transition-colors"
            >
              {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setNarratorOn(narratorEngine.toggle())}
              title={narratorOn ? 'Desligar narrador' : 'Ligar narrador'}
              className="p-1.5 rounded text-white/40 hover:text-white/70 transition-colors"
            >
              {narratorOn ? <Mic className="w-4 h-4 text-pitch-400" /> : <MicOff className="w-4 h-4" />}
            </button>
          </div>
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
          <div className="text-center mb-2">
            <div className="display-font text-3xl text-gold-500">Fim de jogo</div>
            <div className="mt-2 grid grid-cols-3 text-xs text-white/60 max-w-md mx-auto gap-2">
              <div>Finalizações<br/><span className="text-white">{result?.homeShots} - {result?.awayShots}</span></div>
              <div>No alvo<br/><span className="text-white">{result?.homeShotsOnTarget} - {result?.awayShotsOnTarget}</span></div>
              <div>Posse<br/><span className="text-white">{result?.homePossession}% - {100 - (result?.homePossession ?? 50)}%</span></div>
            </div>
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
          phase={phase === 'press' ? 'finished' : phase}
        />
      </div>

      {/* Narração */}
      <div className="panel p-4">
        <div className="text-sm font-semibold text-white/70 mb-2">Narração</div>
        <ul className="space-y-1.5 max-h-64 overflow-auto">
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

      {/* Avaliações pós-jogo */}
      {phase === 'finished' && userTeam && fixtureId && (
        <div className="panel p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold flex items-center gap-2">
              <Star className="w-4 h-4 text-gold-400" /> Avaliações dos jogadores
            </div>
            {ratingsSaved && <span className="text-xs text-green-400">Salvas ✓</span>}
          </div>
          <div className="space-y-2">
            {userTeam.starting11.slice(0, 11).map((pid) => {
              const player = userTeam.squad.find((p) => p.id === pid);
              if (!player) return null;
              const rating = postMatchRatings[pid] ?? 6;
              return (
                <div key={pid} className="flex items-center gap-2">
                  <div className="w-28 sm:w-36 text-xs truncate text-white/80">{player.name}</div>
                  <div className="flex gap-0.5 flex-1">
                    {RATING_GRADES.map((g) => (
                      <button
                        key={g.value}
                        onClick={() => setPostMatchRatings((prev) => ({ ...prev, [pid]: g.value }))}
                        className={`flex-1 py-1 text-xs rounded transition-all font-medium ${
                          rating === g.value
                            ? `${g.color} text-white`
                            : 'bg-white/5 text-white/30 hover:bg-white/10'
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <button
            onClick={() => {
              const defaultRatings = Object.fromEntries(
                userTeam.starting11.slice(0, 11).map((id) => [id, postMatchRatings[id] ?? 6])
              );
              recordMatchRating(fixtureId, defaultRatings);
              setRatingsSaved(true);
            }}
            className="btn-ghost text-xs mt-3 w-full"
          >
            Salvar avaliações
          </button>
        </div>
      )}

      {phase === 'finished' && (
        <button onClick={() => setPhase('press')} className="btn-primary w-full">
          Coletiva de imprensa →
        </button>
      )}

      {phase === 'press' && result && (() => {
        const isUserHome = fixture.homeTeamId === save.controlledTeamId;
        const userGoals = isUserHome ? result.homeGoals : result.awayGoals;
        const oppGoals  = isUserHome ? result.awayGoals : result.homeGoals;
        const won = userGoals > oppGoals;
        const drew = userGoals === oppGoals;

        const PRESS_QUESTIONS = getPressQuestions(won, drew);

        return (
          <div className="panel p-5 space-y-4">
            <div className="text-xs uppercase tracking-wider text-white/50 mb-1">Coletiva de Imprensa</div>
            <div className="display-font text-xl mb-2">Os jornalistas querem sua palavra</div>
            {PRESS_QUESTIONS.map((q, qi) => (
              <div key={qi} className={`space-y-2 ${pressAnswered[qi] ? 'opacity-50' : ''}`}>
                <div className="text-sm text-white/80 font-medium">{q.question}</div>
                {q.options.map((opt, oi) => (
                  <button
                    key={oi}
                    disabled={pressAnswered[qi]}
                    onClick={() => {
                      applyPressConferenceEffects(opt);
                      setPressAnswered((prev) => { const n = [...prev]; n[qi] = true; return n; });
                    }}
                    className="w-full text-left text-sm px-4 py-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <div className="font-medium">{opt.label}</div>
                    <div className="text-xs text-white/40 mt-0.5 flex gap-3">
                      {opt.boardEffect !== 0 && <span className={opt.boardEffect > 0 ? 'text-blue-400' : 'text-red-400'}>Diretoria {opt.boardEffect > 0 ? `+${opt.boardEffect}` : opt.boardEffect}</span>}
                      {opt.fanEffect !== 0 && <span className={opt.fanEffect > 0 ? 'text-green-400' : 'text-red-400'}>Torcida {opt.fanEffect > 0 ? `+${opt.fanEffect}` : opt.fanEffect}</span>}
                      {opt.moraleEffect !== 0 && <span className={opt.moraleEffect > 0 ? 'text-yellow-400' : 'text-red-400'}>Moral {opt.moraleEffect > 0 ? `+${opt.moraleEffect}` : opt.moraleEffect}</span>}
                    </div>
                  </button>
                ))}
              </div>
            ))}
            {pressAnswered.every(Boolean) && (
              <button onClick={() => navigate('/game')} className="btn-primary w-full mt-2">
                Voltar ao painel
              </button>
            )}
          </div>
        );
      })()}
    </div>
  );
}

function getPressQuestions(won: boolean, drew: boolean) {
  if (won) {
    return [
      {
        question: 'Você está satisfeito com o desempenho da equipe hoje?',
        options: [
          { label: 'Sim, a equipe foi brilhante. Estamos no caminho certo!', boardEffect: 5, fanEffect: 8, moraleEffect: 5 },
          { label: 'Vitória importante, mas ainda temos muito a melhorar.', boardEffect: 3, fanEffect: 3, moraleEffect: 2 },
          { label: 'Foi uma atuação medíocre. Exijo mais dos meus jogadores.', boardEffect: 0, fanEffect: -2, moraleEffect: -5 },
        ],
      },
      {
        question: 'Como você avalia as chances de título agora?',
        options: [
          { label: 'Focamos jogo a jogo — sem falar em título ainda.', boardEffect: 5, fanEffect: 4, moraleEffect: 3 },
          { label: 'Estamos em boa posição e acreditamos no objetivo!', boardEffect: 3, fanEffect: 10, moraleEffect: 5 },
          { label: 'Esse elenco não está pronto para brigar por título.', boardEffect: -5, fanEffect: -5, moraleEffect: -8 },
        ],
      },
    ];
  } else if (drew) {
    return [
      {
        question: 'O empate foi justo?',
        options: [
          { label: 'Sim, o adversário foi forte. Um ponto fora de casa é válido.', boardEffect: 2, fanEffect: 2, moraleEffect: 2 },
          { label: 'Não, merecíamos ganhar. Estou decepcionado com o resultado.', boardEffect: 0, fanEffect: -2, moraleEffect: -3 },
          { label: 'O empate nos serve para seguir em frente com foco.', boardEffect: 3, fanEffect: 3, moraleEffect: 3 },
        ],
      },
      {
        question: 'O que vai mudar para os próximos jogos?',
        options: [
          { label: 'Vamos intensificar os treinos e ajustar a tática.', boardEffect: 5, fanEffect: 3, moraleEffect: 0 },
          { label: 'Confio no grupo — são detalhes que precisamos corrigir.', boardEffect: 3, fanEffect: 5, moraleEffect: 5 },
          { label: 'Preciso rever o elenco. Talvez precisemos de reforços.', boardEffect: -3, fanEffect: 2, moraleEffect: -3 },
        ],
      },
    ];
  } else {
    return [
      {
        question: 'Como você explica a derrota de hoje?',
        options: [
          { label: 'Assumo a responsabilidade — a equipe não foi bem tácticamente.', boardEffect: 5, fanEffect: 5, moraleEffect: 2 },
          { label: 'O adversário foi melhor hoje. Tiramos lições.', boardEffect: 2, fanEffect: 2, moraleEffect: 2 },
          { label: 'Os jogadores não deram o máximo — estou insatisfeito.', boardEffect: -2, fanEffect: 0, moraleEffect: -8 },
        ],
      },
      {
        question: 'A sequência de resultados preocupa?',
        options: [
          { label: 'Não. Temos caráter e vamos reagir na próxima.', boardEffect: 3, fanEffect: 5, moraleEffect: 5 },
          { label: 'Precisamos analisar com calma e ajustar o trabalho.', boardEffect: 4, fanEffect: 2, moraleEffect: 2 },
          { label: 'Sim, preciso rever o planejamento da temporada.', boardEffect: 0, fanEffect: -3, moraleEffect: -5 },
        ],
      },
    ];
  }
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
