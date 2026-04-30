import { useParams } from 'react-router-dom';
import { useGameStore } from '@/store/gameStore';
import { sortStandings } from '@/competitions/brasileirao';

export default function TablePage() {
  const { competitionId } = useParams<{ competitionId: string }>();
  const save = useGameStore((s) => s.save);
  if (!save || !competitionId) return null;

  const comp = save.competitions.find((c) => c.id === competitionId);
  if (!comp) return <div className="p-6">Competição não encontrada.</div>;

  const sorted = sortStandings(comp.standings, save.teams);

  return (
    <div className="space-y-4">
      <div className="panel p-5">
        <div className="text-xs uppercase tracking-wider text-white/50">Classificação</div>
        <h2 className="display-font text-3xl">{comp.name}</h2>
        <div className="text-sm text-white/60">
          Temporada {comp.season} · Rodada atual {comp.currentRound} de {comp.totalRounds}
        </div>
      </div>

      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-xs uppercase tracking-wider text-white/60">
              <tr>
                <th className="text-left px-3 py-2 w-10">#</th>
                <th className="text-left px-3 py-2">Time</th>
                <th className="text-center px-2 py-2">P</th>
                <th className="text-center px-2 py-2 hidden sm:table-cell">J</th>
                <th className="text-center px-2 py-2 hidden sm:table-cell">V</th>
                <th className="text-center px-2 py-2 hidden sm:table-cell">E</th>
                <th className="text-center px-2 py-2 hidden sm:table-cell">D</th>
                <th className="text-center px-2 py-2">GP</th>
                <th className="text-center px-2 py-2">GC</th>
                <th className="text-center px-2 py-2">SG</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((s, i) => {
                const team = save.teams.find((t) => t.id === s.teamId);
                if (!team) return null;
                const isUser = team.id === save.controlledTeamId;
                const zone = getZone(i, sorted.length, comp.format);
                return (
                  <tr
                    key={s.teamId}
                    className={`border-t border-white/5 ${isUser ? 'bg-pitch-500/10 font-semibold' : ''}`}
                  >
                    <td className="px-3 py-2 flex items-center gap-2">
                      <span className={`w-1 h-6 rounded ${zone}`} />
                      {i + 1}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-6 h-6 rounded text-[10px] flex items-center justify-center font-bold"
                          style={{ backgroundColor: team.primaryColor, color: team.secondaryColor }}
                        >
                          {team.shortName}
                        </span>
                        <span className="truncate">{team.name}</span>
                      </div>
                    </td>
                    <td className="text-center px-2 py-2 font-bold">{s.points}</td>
                    <td className="text-center px-2 py-2 hidden sm:table-cell">{s.played}</td>
                    <td className="text-center px-2 py-2 hidden sm:table-cell">{s.wins}</td>
                    <td className="text-center px-2 py-2 hidden sm:table-cell">{s.draws}</td>
                    <td className="text-center px-2 py-2 hidden sm:table-cell">{s.losses}</td>
                    <td className="text-center px-2 py-2">{s.goalsFor}</td>
                    <td className="text-center px-2 py-2">{s.goalsAgainst}</td>
                    <td className="text-center px-2 py-2">{s.goalDifference}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Legend />
      </div>
    </div>
  );
}

function getZone(index: number, total: number, format: string): string {
  if (format === 'round_robin') {
    if (index < 4) return 'bg-blue-400'; // Libertadores
    if (index < 6) return 'bg-blue-400/60';
    if (index < 12) return 'bg-orange-400/70'; // Sul-americana aproximação
    if (index >= total - 4) return 'bg-red-500'; // Rebaixamento
  }
  return 'bg-transparent';
}

function Legend() {
  return (
    <div className="px-4 py-3 border-t border-white/5 text-xs text-white/60 flex flex-wrap gap-4">
      <span className="flex items-center gap-1">
        <span className="w-2 h-3 bg-blue-400 rounded" /> Libertadores
      </span>
      <span className="flex items-center gap-1">
        <span className="w-2 h-3 bg-orange-400/70 rounded" /> Sul-Americana
      </span>
      <span className="flex items-center gap-1">
        <span className="w-2 h-3 bg-red-500 rounded" /> Rebaixamento
      </span>
    </div>
  );
}
