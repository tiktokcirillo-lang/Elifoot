import { Link } from 'react-router-dom';
import { useGameStore } from '@/store/gameStore';
import type { Fixture } from '@/types';
import { Trophy } from 'lucide-react';

export default function FixturesPage() {
  const save = useGameStore((s) => s.save);
  if (!save) return null;

  const userId = save.controlledTeamId;
  const fixtures = save.competitions
    .flatMap((c) =>
      c.fixtures
        .filter((f) => f.homeTeamId === userId || f.awayTeamId === userId)
        .map((f) => ({ ...f, compShort: c.shortName, compName: c.name })),
    )
    .sort((a, b) => a.scheduledTurn - b.scheduledTurn);

  return (
    <div className="space-y-4">
      <div className="panel p-5">
        <div className="text-xs uppercase tracking-wider text-white/50">Calendário</div>
        <h2 className="display-font text-3xl">Próximas partidas</h2>
        <div className="text-sm text-white/60">Dia atual: {save.currentTurn}</div>
      </div>

      <div className="panel divide-y divide-white/5">
        {fixtures.map((f) => (
          <FixtureRow key={f.id} fixture={f} compShort={f.compShort} currentTurn={save.currentTurn} />
        ))}
      </div>
    </div>
  );
}

function FixtureRow({
  fixture,
  compShort,
  currentTurn,
}: {
  fixture: Fixture;
  compShort: string;
  currentTurn: number;
}) {
  const save = useGameStore((s) => s.save)!;
  const home = save.teams.find((t) => t.id === fixture.homeTeamId);
  const away = save.teams.find((t) => t.id === fixture.awayTeamId);
  if (!home || !away) return null;

  const isToday = fixture.scheduledTurn === currentTurn && !fixture.played;
  const isPast = fixture.played;

  return (
    <div className={`px-4 py-3 flex items-center gap-3 ${isToday ? 'bg-pitch-500/10' : ''}`}>
      <div className="text-xs text-white/50 w-16 shrink-0">
        <div className="flex items-center gap-1">
          <Trophy className="w-3 h-3" /> {compShort}
        </div>
        <div>R{fixture.round}</div>
      </div>
      <div className="text-xs text-white/40 w-12 shrink-0">D {fixture.scheduledTurn}</div>
      <div className="flex-1 flex items-center justify-center gap-3 min-w-0">
        <span className="text-sm font-semibold truncate">{home.name}</span>
        <span className="display-font text-lg">
          {fixture.played
            ? `${fixture.result?.homeGoals} x ${fixture.result?.awayGoals}`
            : 'vs'}
        </span>
        <span className="text-sm font-semibold truncate">{away.name}</span>
      </div>
      <div className="w-24 text-right shrink-0">
        {isToday ? (
          <Link to={`/game/match/${fixture.id}`} className="btn-primary text-xs px-3 py-1.5">
            Jogar
          </Link>
        ) : isPast ? (
          <span className="text-xs text-white/40">Finalizada</span>
        ) : (
          <span className="text-xs text-white/40">Agendada</span>
        )}
      </div>
    </div>
  );
}
