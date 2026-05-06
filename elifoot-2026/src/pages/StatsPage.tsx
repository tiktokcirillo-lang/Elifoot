import { useGameStore } from '@/store/gameStore';
import { sortStandings } from '@/competitions/brasileirao';
import { BarChart2, Target, TrendingUp, Medal } from 'lucide-react';

export default function StatsPage() {
  const save = useGameStore((s) => s.save);
  const userTeam = useGameStore((s) => s.getUserTeam());

  if (!save || !userTeam) return null;

  const brasileirao = save.competitions.find((c) => c.format === 'round_robin');
  const userStanding = brasileirao?.standings.find((s) => s.teamId === save.controlledTeamId);

  // Top scorers across all Brasileirão teams
  const topScorers: { name: string; teamName: string; teamShort: string; position: string; goals: number }[] = [];
  if (brasileirao) {
    for (const team of save.teams) {
      if (!brasileirao.teamIds.includes(team.id)) continue;
      for (const p of team.squad) {
        if (p.stats.goals > 0) {
          topScorers.push({ name: p.name, teamName: team.name, teamShort: team.shortName, position: p.position, goals: p.stats.goals });
        }
      }
    }
  }
  topScorers.sort((a, b) => b.goals - a.goals);

  // Top assisters
  const topAssisters: { name: string; teamShort: string; assists: number }[] = [];
  if (brasileirao) {
    for (const team of save.teams) {
      if (!brasileirao.teamIds.includes(team.id)) continue;
      for (const p of team.squad) {
        if (p.stats.assists > 0) {
          topAssisters.push({ name: p.name, teamShort: team.shortName, assists: p.stats.assists });
        }
      }
    }
  }
  topAssisters.sort((a, b) => b.assists - a.assists);

  // Standings for Brasileirão
  const standings = brasileirao
    ? sortStandings(brasileirao.standings, save.teams, brasileirao.id, brasileirao.fixtures)
    : [];

  // User team season totals from Brasileirão fixtures
  const played = userStanding?.played ?? 0;
  const wins = userStanding?.wins ?? 0;
  const draws = userStanding?.draws ?? 0;
  const losses = userStanding?.losses ?? 0;
  const gf = userStanding?.goalsFor ?? 0;
  const ga = userStanding?.goalsAgainst ?? 0;
  const pts = userStanding?.points ?? 0;
  const pos = standings.findIndex((s) => s.teamId === save.controlledTeamId) + 1;

  const winRate = played > 0 ? Math.round((wins / played) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="panel p-5">
        <div className="text-xs uppercase tracking-wider text-white/50">Temporada {save.season}</div>
        <h2 className="display-font text-3xl flex items-center gap-2">
          <BarChart2 className="w-7 h-7 text-pitch-400" /> Central de Estatísticas
        </h2>
        <div className="text-sm text-white/60">{userTeam.name}</div>
      </div>

      {/* Resumo do time */}
      <div className="panel p-5">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Target className="w-4 h-4 text-pitch-400" /> {userTeam.name} no Brasileirão
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <StatBox label="Posição" value={pos > 0 ? `${pos}º` : '—'} highlight={pos <= 4} />
          <StatBox label="Pontos" value={pts} />
          <StatBox label="Jogos" value={played} />
          <StatBox label="% Vitórias" value={`${winRate}%`} highlight={winRate >= 50} />
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-sm">
          <div className="bg-green-500/10 rounded-lg p-2">
            <div className="text-2xl font-bold text-green-400">{wins}</div>
            <div className="text-xs text-white/50">Vitórias</div>
          </div>
          <div className="bg-yellow-500/10 rounded-lg p-2">
            <div className="text-2xl font-bold text-yellow-400">{draws}</div>
            <div className="text-xs text-white/50">Empates</div>
          </div>
          <div className="bg-red-500/10 rounded-lg p-2">
            <div className="text-2xl font-bold text-red-400">{losses}</div>
            <div className="text-xs text-white/50">Derrotas</div>
          </div>
          <div className="bg-pitch-500/10 rounded-lg p-2">
            <div className="text-2xl font-bold text-pitch-300">{gf}</div>
            <div className="text-xs text-white/50">Gols Pró</div>
          </div>
          <div className="bg-white/5 rounded-lg p-2">
            <div className="text-2xl font-bold text-white/60">{ga}</div>
            <div className="text-xs text-white/50">Gols Contra</div>
          </div>
          <div className={`rounded-lg p-2 ${gf - ga > 0 ? 'bg-pitch-500/10' : 'bg-red-500/10'}`}>
            <div className={`text-2xl font-bold ${gf - ga > 0 ? 'text-pitch-300' : 'text-red-400'}`}>{gf - ga > 0 ? '+' : ''}{gf - ga}</div>
            <div className="text-xs text-white/50">Saldo</div>
          </div>
        </div>
      </div>

      {/* Artilheiros */}
      <div className="panel p-5">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Medal className="w-4 h-4 text-gold-400" /> Artilheiros do Brasileirão
        </h3>
        {topScorers.length === 0 ? (
          <p className="text-white/40 text-sm">Nenhum gol marcado ainda.</p>
        ) : (
          <ol className="space-y-1.5">
            {topScorers.slice(0, 10).map((p, i) => (
              <li key={`${p.name}-${p.teamShort}`} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                p.teamShort === userTeam.shortName ? 'bg-pitch-500/15 border border-pitch-500/30' : 'bg-white/5'
              }`}>
                <span className={`w-6 text-center font-bold shrink-0 ${i === 0 ? 'text-gold-400' : i <= 2 ? 'text-white/60' : 'text-white/30'}`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold truncate">{p.name}</span>
                  <span className="text-white/40 ml-2 text-xs">{p.teamShort} · {p.position}</span>
                </div>
                <span className="font-bold text-pitch-300 shrink-0">{p.goals} gols</span>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Assistências */}
      {topAssisters.length > 0 && (
        <div className="panel p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400" /> Assistências do Brasileirão
          </h3>
          <ol className="space-y-1.5">
            {topAssisters.slice(0, 8).map((p, i) => (
              <li key={`${p.name}-${p.teamShort}-a`} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                p.teamShort === userTeam.shortName ? 'bg-pitch-500/15 border border-pitch-500/30' : 'bg-white/5'
              }`}>
                <span className="w-6 text-center font-bold shrink-0 text-white/30">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold truncate">{p.name}</span>
                  <span className="text-white/40 ml-2 text-xs">{p.teamShort}</span>
                </div>
                <span className="font-bold text-blue-300 shrink-0">{p.assists} assists</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Tabela compacta */}
      {standings.length > 0 && (
        <div className="panel p-5">
          <h3 className="font-semibold mb-3">Brasileirão — Tabela</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white/40 text-xs border-b border-white/10">
                  <th className="text-left py-1.5 w-6">#</th>
                  <th className="text-left py-1.5">Time</th>
                  <th className="text-right py-1.5 px-2">J</th>
                  <th className="text-right py-1.5 px-2">V</th>
                  <th className="text-right py-1.5 px-2">E</th>
                  <th className="text-right py-1.5 px-2">D</th>
                  <th className="text-right py-1.5 px-2">GP</th>
                  <th className="text-right py-1.5 px-2">GC</th>
                  <th className="text-right py-1.5 px-2">SG</th>
                  <th className="text-right py-1.5 px-2 font-bold text-white/60">Pts</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((s, i) => {
                  const team = save.teams.find((t) => t.id === s.teamId);
                  const isUser = s.teamId === save.controlledTeamId;
                  const zoneClass = i < 6 ? 'border-l-2 border-blue-500' : i >= standings.length - 4 ? 'border-l-2 border-red-500' : '';
                  return (
                    <tr
                      key={s.teamId}
                      className={`border-b border-white/5 ${isUser ? 'bg-pitch-500/15' : ''} ${zoneClass}`}
                    >
                      <td className="py-1.5 pl-2 font-bold text-white/40">{i + 1}</td>
                      <td className="py-1.5 font-semibold">{team?.shortName ?? s.teamId}</td>
                      <td className="text-right px-2 text-white/60">{s.played}</td>
                      <td className="text-right px-2 text-green-400">{s.wins}</td>
                      <td className="text-right px-2 text-yellow-400">{s.draws}</td>
                      <td className="text-right px-2 text-red-400">{s.losses}</td>
                      <td className="text-right px-2 text-white/60">{s.goalsFor}</td>
                      <td className="text-right px-2 text-white/60">{s.goalsAgainst}</td>
                      <td className="text-right px-2 text-white/60">{s.goalDifference > 0 ? '+' : ''}{s.goalDifference}</td>
                      <td className="text-right px-2 font-bold text-white">{s.points}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex gap-4 mt-3 text-xs text-white/40">
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-500 rounded-sm inline-block" /> Libertadores (G6)</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-500 rounded-sm inline-block" /> Rebaixamento (Z4)</span>
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className={`rounded-lg p-3 text-center ${highlight ? 'bg-pitch-500/20 border border-pitch-500/30' : 'bg-white/5'}`}>
      <div className={`text-2xl font-bold ${highlight ? 'text-pitch-300' : 'text-white'}`}>{value}</div>
      <div className="text-xs text-white/50">{label}</div>
    </div>
  );
}
