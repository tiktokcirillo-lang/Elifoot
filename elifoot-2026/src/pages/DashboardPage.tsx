import { Link } from 'react-router-dom';
import { useGameStore } from '@/store/gameStore';
import { ChevronRight, FastForward } from 'lucide-react';

export default function DashboardPage() {
  const save = useGameStore((s) => s.save);
  const userTeam = useGameStore((s) => s.getUserTeam());
  const nextFixture = useGameStore((s) => s.getNextUserFixture());
  const advanceTurn = useGameStore((s) => s.advanceTurn);

  if (!save || !userTeam) return null;

  const competition = nextFixture
    ? save.competitions.find((c) => c.id === nextFixture.competitionId)
    : undefined;

  const homeTeam = nextFixture && save.teams.find((t) => t.id === nextFixture.homeTeamId);
  const awayTeam = nextFixture && save.teams.find((t) => t.id === nextFixture.awayTeamId);

  const isUserHome = nextFixture?.homeTeamId === userTeam.id;
  const opponent = isUserHome ? awayTeam : homeTeam;

  return (
    <div className="space-y-6">
      {/* Próxima partida */}
      <div className="panel p-5">
        <div className="text-xs uppercase tracking-wider text-white/50 mb-2">Próxima partida</div>
        {nextFixture && competition && homeTeam && awayTeam && opponent ? (
          <div>
            <div className="text-sm text-white/60 mb-3">
              {competition.shortName} · Rodada {nextFixture.round} · Dia {nextFixture.scheduledTurn}
            </div>
            <div className="flex items-center justify-between gap-4 mb-4">
              <TeamCard team={homeTeam} highlight={isUserHome} />
              <div className="text-2xl display-font text-white/40">VS</div>
              <TeamCard team={awayTeam} highlight={!isUserHome} reverse />
            </div>
            <div className="flex gap-3">
              {nextFixture.scheduledTurn === save.currentTurn ? (
                <Link
                  to={`/game/match/${nextFixture.id}`}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  Jogar partida <ChevronRight className="w-4 h-4" />
                </Link>
              ) : (
                <button
                  onClick={() => advanceTurn()}
                  className="btn-gold flex-1 flex items-center justify-center gap-2"
                >
                  <FastForward className="w-4 h-4" />
                  Avançar para o dia da partida
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-white/60 py-6 text-center">
            Sem partidas agendadas. Temporada provavelmente concluída.
          </div>
        )}
      </div>

      {/* Avançar dia */}
      <div className="panel p-5 flex items-center justify-between">
        <div>
          <div className="font-semibold">Pular dia</div>
          <div className="text-sm text-white/60">
            Avança o calendário e simula partidas dos outros times
          </div>
        </div>
        <button onClick={() => advanceTurn()} className="btn-primary flex items-center gap-2">
          <FastForward className="w-4 h-4" /> Avançar
        </button>
      </div>

      {/* Notícias */}
      <div className="panel p-5">
        <h3 className="display-font text-2xl mb-3">Notícias</h3>
        {save.news.length === 0 ? (
          <div className="text-white/50 text-sm">Nenhuma notícia ainda.</div>
        ) : (
          <ul className="space-y-2 max-h-96 overflow-auto">
            {save.news.slice(0, 20).map((n) => (
              <li key={n.id} className="bg-white/5 rounded-lg px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-pitch-500">{n.type}</span>
                  <span className="text-xs text-white/40">Dia {n.turn}</span>
                </div>
                <div className="font-semibold text-sm">{n.title}</div>
                <div className="text-xs text-white/60">{n.body}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function TeamCard({
  team,
  highlight,
  reverse,
}: {
  team: { name: string; shortName: string; primaryColor: string; secondaryColor: string };
  highlight?: boolean;
  reverse?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 ${reverse ? 'flex-row-reverse' : ''}`}>
      <div
        className={`w-14 h-14 rounded-lg flex items-center justify-center font-bold ${highlight ? 'ring-2 ring-pitch-500' : ''}`}
        style={{ backgroundColor: team.primaryColor, color: team.secondaryColor }}
      >
        {team.shortName}
      </div>
      <div className={reverse ? 'text-right' : ''}>
        <div className="font-semibold leading-tight">{team.name}</div>
      </div>
    </div>
  );
}
