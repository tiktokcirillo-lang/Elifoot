import { motion } from 'framer-motion';
import type { MatchEvent } from '@/types';

interface Props {
  currentEvent?: MatchEvent;
  homeColor: string;
  awayColor: string;
  isUserHome: boolean;
  phase: 'prematch' | 'playing' | 'halftime' | 'finished';
}

interface BallPos {
  x: number;
  y: number;
}

// ── Posições base dos jogadores (estado neutro, bola no centro) ──────────────
// Home: ataca para a direita (+x). Away: ataca para a esquerda (-x).

const HOME_BASE: [number, number][] = [
  [22, 110],          // GK
  [74, 60],  [70, 90],  [76, 130], [73, 162], // 4 DF
  [130, 70], [126, 97], [132, 123],[128, 152], // 4 MF
  [200, 88], [196, 132],                       // 2 FW
];

const AWAY_BASE: [number, number][] = [
  [318, 110],          // GK
  [266, 60],  [270, 90],  [264, 130], [267, 162], // 4 DF
  [210, 70],  [214, 97],  [208, 123], [212, 152],  // 4 MF
  [140, 88],  [144, 132],                           // 2 FW
];

function getShift(isHomeTeam: boolean, event: MatchEvent | undefined): number {
  if (!event) return 0;
  const isHomeEvent = event.side === 'home';
  const base = isHomeEvent
    ? (isHomeTeam ? 28 : 20)  // home ataca direita: ambos vão pra direita
    : (isHomeTeam ? -20 : -28); // away ataca esquerda: ambos vão pra esquerda
  const multiplier = (event.type === 'goal' || event.type === 'penalty_scored') ? 1.6 : 1.0;
  return Math.round(base * multiplier);
}

function applyShift(base: [number, number][], shift: number): [number, number][] {
  return base.map(([x, y], i) => {
    const s = i === 0 ? 0 : shift; // GK fica parado
    return [Math.max(10, Math.min(330, x + s)), y];
  });
}

function getBallPosition(event: MatchEvent | undefined, isUserHome: boolean): BallPos {
  if (!event) return { x: 170, y: 110 };

  const homeAttacksRight = isUserHome;
  const isHomeEvent = event.side === 'home';
  const attacksRight = isHomeEvent ? homeAttacksRight : !homeAttacksRight;

  switch (event.type) {
    case 'goal':
    case 'penalty_scored':
      return attacksRight ? { x: 320, y: 110 } : { x: 20, y: 110 };
    case 'shot_on_target':
      return attacksRight ? { x: 310, y: 95 } : { x: 30, y: 125 };
    case 'shot_off_target':
      return attacksRight ? { x: 280, y: 75 } : { x: 60, y: 145 };
    case 'corner':
      return attacksRight ? { x: 335, y: 5 } : { x: 5, y: 215 };
    case 'foul':
    case 'yellow_card':
    case 'red_card':
      return isHomeEvent ? { x: 140, y: 90 } : { x: 200, y: 130 };
    default:
      return { x: 170, y: 110 };
  }
}

export default function MatchField({
  currentEvent,
  homeColor,
  awayColor,
  isUserHome,
  phase: _phase,
}: Props) {
  const ballPos = getBallPosition(currentEvent, isUserHome);
  const isGoal = currentEvent?.type === 'goal' || currentEvent?.type === 'penalty_scored';

  const homeShift = getShift(true, currentEvent);
  const awayShift = getShift(false, currentEvent);
  const homePositions = applyShift(HOME_BASE, homeShift);
  const awayPositions = applyShift(AWAY_BASE, awayShift);

  const grassLight = '#4a8f3f';
  const grassDark  = '#3d7a34';
  const stripeWidth = 340 / 8;

  const playerTransition = { duration: 0.75, ease: 'easeInOut' as const };

  return (
    <svg
      viewBox="0 0 340 220"
      width="100%"
      style={{ display: 'block', maxWidth: 680, margin: '0 auto' }}
      aria-label="Campo de futebol"
    >
      {/* Background */}
      <rect x={0} y={0} width={340} height={220} fill={grassDark} />

      {/* Grass stripes */}
      {Array.from({ length: 8 }).map((_, i) => (
        <rect
          key={i}
          x={i * stripeWidth}
          y={0}
          width={stripeWidth}
          height={220}
          fill={i % 2 === 0 ? grassLight : grassDark}
        />
      ))}

      {/* Field outline */}
      <rect x={5} y={5} width={330} height={210} fill="none" stroke="white" strokeWidth={1.5} />

      {/* Centre line */}
      <line x1={170} y1={5} x2={170} y2={215} stroke="white" strokeWidth={1.5} />

      {/* Centre circle */}
      <circle cx={170} cy={110} r={28} fill="none" stroke="white" strokeWidth={1.5} />
      <circle cx={170} cy={110} r={2} fill="white" />

      {/* Left penalty area */}
      <rect x={5} y={55} width={54} height={110} fill="none" stroke="white" strokeWidth={1.5} />
      <rect x={5} y={82} width={18} height={56} fill="none" stroke="white" strokeWidth={1.5} />

      {/* Left goal */}
      <rect
        x={1} y={95} width={5} height={30}
        fill={isUserHome ? homeColor : awayColor}
        stroke="white" strokeWidth={1} opacity={0.9}
      />
      <circle cx={37} cy={110} r={1.5} fill="white" />

      {/* Right penalty area */}
      <rect x={281} y={55} width={54} height={110} fill="none" stroke="white" strokeWidth={1.5} />
      <rect x={317} y={82} width={18} height={56} fill="none" stroke="white" strokeWidth={1.5} />

      {/* Right goal */}
      <rect
        x={334} y={95} width={5} height={30}
        fill={isUserHome ? awayColor : homeColor}
        stroke="white" strokeWidth={1} opacity={0.9}
      />
      <circle cx={303} cy={110} r={1.5} fill="white" />

      {/* ── Away players ─────────────────────────────────────── */}
      {awayPositions.map(([x, y], i) => (
        <motion.circle
          key={`away-${i}`}
          r={i === 0 ? 6 : 5}
          fill={awayColor}
          stroke="white"
          strokeWidth={1.2}
          initial={{ cx: x, cy: y }}
          animate={{ cx: x, cy: y }}
          transition={playerTransition}
        />
      ))}

      {/* ── Home players ─────────────────────────────────────── */}
      {homePositions.map(([x, y], i) => (
        <motion.circle
          key={`home-${i}`}
          r={i === 0 ? 6 : 5}
          fill={homeColor}
          stroke="white"
          strokeWidth={1.2}
          initial={{ cx: x, cy: y }}
          animate={{ cx: x, cy: y }}
          transition={playerTransition}
        />
      ))}

      {/* Goal flash overlay */}
      {isGoal && (
        <motion.rect
          x={0} y={0} width={340} height={220}
          fill="gold"
          initial={{ opacity: 0.55 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ pointerEvents: 'none' }}
        />
      )}

      {/* Ball (above players) */}
      <motion.circle
        r={6}
        fill="white"
        stroke="#ccc"
        strokeWidth={1}
        initial={{ cx: 170, cy: 110 }}
        animate={{ cx: ballPos.x, cy: ballPos.y }}
        transition={{ type: 'spring', stiffness: 120, damping: 18 }}
      />
    </svg>
  );
}
