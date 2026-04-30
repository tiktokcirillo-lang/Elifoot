import { useParams } from 'react-router-dom';
import { useGameStore } from '@/store/gameStore';
import { sortStandings } from '@/competitions/brasileirao';
import type { KnockoutPair, Competition } from '@/types';
import { Trophy } from 'lucide-react';

export default function TablePage() {
  const { competitionId } = useParams<{ competitionId: string }>();
  const save = useGameStore((s) => s.save);
  if (!save || !competitionId) return null;

  const comp = save.competitions.find((c) => c.id === competitionId);
  if (!comp) return <div className="p-6">Competição não encontrada.</div>;

  const isKnockoutOnly = comp.format === 'pure_knockout';
  const hasGroups =
    comp.format === 'groups_knockout' || comp.format === 'groups_then_knockout_paulista';

  return (
    <div className="space-y-4">
      <div className="panel p-5">
        <div className="text-xs uppercase tracking-wider text-white/50">Classificação</div>
        <h2 className="display-font text-3xl">{comp.name}</h2>
        <div className="text-sm text-white/60">
          Temporada {comp.season}
          {comp.finished && comp.championId && (
            <span className="ml-2 text-gold-400 font-semibold">
              <Trophy className="w-4 h-4 inline mr-1" />
              Campeão: {save.teams.find((t) => t.id === comp.championId)?.name}
            </span>
          )}
        </div>
      </div>

      {/* Fase de grupos */}
      {hasGroups && comp.groups && (
        <div className="space-y-3">
          <h3 className="display-font text-xl px-1">Fase de Grupos</h3>
          {Object.entries(comp.groups)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([groupName, teamIds]) => (
              <GroupTable
                key={groupName}
                groupName={groupName}
                teamIds={teamIds}
                comp={comp}
              />
            ))}
        </div>
      )}

      {/* Mata-mata */}
      {(isKnockoutOnly || hasGroups) && comp.knockoutBracket && comp.knockoutBracket.length > 0 && (
        <div className="space-y-3">
          <h3 className="display-font text-xl px-1">Mata-Mata</h3>
          <KnockoutBracket comp={comp} />
        </div>
      )}

      {/* Pontos corridos */}
      {comp.format === 'round_robin' && (
        <StandingsTable comp={comp} />
      )}
    </div>
  );
}

// ── Tabela de pontos corridos ─────────────────────────────────

function StandingsTable({ comp }: { comp: Competition }) {
  const save = useGameStore((s) => s.save)!;
  const sorted = sortStandings(comp.standings, save.teams);

  return (
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
                <tr key={s.teamId} className={`border-t border-white/5 ${isUser ? 'bg-pitch-500/10 font-semibold' : ''}`}>
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
      <Legend format={comp.format} />
    </div>
  );
}

// ── Tabela de grupo ───────────────────────────────────────────

function GroupTable({ groupName, teamIds, comp }: { groupName: string; teamIds: string[]; comp: Competition }) {
  const save = useGameStore((s) => s.save)!;
  const groupStandings = sortStandings(
    comp.standings.filter((s) => teamIds.includes(s.teamId)),
    save.teams,
  );

  return (
    <div className="panel overflow-hidden">
      <div className="bg-white/5 px-4 py-2 text-xs uppercase tracking-wider font-semibold text-white/70">
        Grupo {groupName}
      </div>
      <table className="w-full text-sm">
        <thead className="text-xs text-white/50">
          <tr>
            <th className="text-left px-3 py-1">#</th>
            <th className="text-left px-3 py-1">Time</th>
            <th className="text-center px-2 py-1">P</th>
            <th className="text-center px-2 py-1">J</th>
            <th className="text-center px-2 py-1">V</th>
            <th className="text-center px-2 py-1">SG</th>
          </tr>
        </thead>
        <tbody>
          {groupStandings.map((s, i) => {
            const team = save.teams.find((t) => t.id === s.teamId);
            if (!team) return null;
            const isUser = team.id === save.controlledTeamId;
            const qualified = i < 2;
            return (
              <tr key={s.teamId} className={`border-t border-white/5 ${isUser ? 'bg-pitch-500/10' : ''}`}>
                <td className="px-3 py-2 flex items-center gap-2">
                  <span className={`w-1 h-5 rounded ${qualified ? 'bg-blue-400' : 'bg-transparent'}`} />
                  {i + 1}
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-5 h-5 rounded text-[9px] flex items-center justify-center font-bold"
                      style={{ backgroundColor: team.primaryColor, color: team.secondaryColor }}
                    >
                      {team.shortName}
                    </span>
                    <span className="text-sm truncate">{team.name}</span>
                  </div>
                </td>
                <td className="text-center px-2 py-2 font-bold">{s.points}</td>
                <td className="text-center px-2 py-2">{s.played}</td>
                <td className="text-center px-2 py-2">{s.wins}</td>
                <td className="text-center px-2 py-2">{s.goalDifference > 0 ? `+${s.goalDifference}` : s.goalDifference}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Chaveamento mata-mata ─────────────────────────────────────

const STAGE_LABEL: Record<string, string> = {
  r32: 'Rodada de 32',
  r16: 'Oitavas de Final',
  qf: 'Quartas de Final',
  sf: 'Semifinais',
  final: 'Final',
  third_place: 'Terceiro Lugar',
};

function KnockoutBracket({ comp }: { comp: Competition }) {
  const pairs = comp.knockoutBracket ?? [];
  const stages = ['r32', 'r16', 'qf', 'sf', 'final'] as const;
  const presentStages = stages.filter((s) => pairs.some((p) => p.stage === s));

  return (
    <div className="space-y-3">
      {presentStages.map((stage) => {
        const stagePairs = pairs.filter((p) => p.stage === stage);
        return (
          <div key={stage} className="panel overflow-hidden">
            <div className="bg-white/5 px-4 py-2 text-xs uppercase tracking-wider font-semibold text-white/70">
              {STAGE_LABEL[stage] ?? stage}
            </div>
            <div className="divide-y divide-white/5">
              {stagePairs.map((pair) => (
                <KnockoutPairRow key={pair.id} pair={pair} comp={comp} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function KnockoutPairRow({ pair, comp }: { pair: KnockoutPair; comp: Competition }) {
  const save = useGameStore((s) => s.save)!;
  const team1 = save.teams.find((t) => t.id === pair.team1Id);
  const team2 = save.teams.find((t) => t.id === pair.team2Id);
  const leg1 = pair.leg1ResultId ? comp.fixtures.find((f) => f.id === pair.leg1ResultId) : undefined;
  const leg2 = pair.leg2ResultId ? comp.fixtures.find((f) => f.id === pair.leg2ResultId) : undefined;

  const userCtrl = save.controlledTeamId;

  const agg1 = leg1?.result
    ? leg1.result.homeGoals + (leg2?.result?.awayGoals ?? 0)
    : null;
  const agg2 = leg1?.result
    ? leg1.result.awayGoals + (leg2?.result?.homeGoals ?? 0)
    : null;

  return (
    <div className="px-4 py-3 flex flex-col gap-1.5">
      {[team1, team2].map((team, idx) => {
        if (!team) return null;
        const isUser = team.id === userCtrl;
        const isWinner = team.id === pair.winnerId;
        const agg = idx === 0 ? agg1 : agg2;
        return (
          <div
            key={team.id}
            className={`flex items-center gap-2 text-sm ${isWinner ? 'font-semibold' : 'text-white/70'} ${isUser ? 'text-pitch-300' : ''}`}
          >
            <span
              className="w-5 h-5 rounded text-[9px] flex items-center justify-center font-bold shrink-0"
              style={{ backgroundColor: team.primaryColor, color: team.secondaryColor }}
            >
              {team.shortName}
            </span>
            <span className="flex-1 truncate">{team.name}</span>
            {agg !== null && (
              <span className={`w-6 text-center font-bold ${isWinner ? 'text-white' : 'text-white/40'}`}>
                {agg}
              </span>
            )}
            {isWinner && <span className="text-xs text-gold-400">✓</span>}
          </div>
        );
      })}
      {leg1 && !leg2 && leg1.result && (
        <div className="text-xs text-white/40 mt-1">
          {leg1.result.homeGoals} x {leg1.result.awayGoals}
          {leg1.result.homePenalties != null && (
            <span className="ml-1">({leg1.result.homePenalties} x {leg1.result.awayPenalties} pen.)</span>
          )}
        </div>
      )}
      {leg1?.result && leg2?.result && (
        <div className="text-xs text-white/40 mt-1 flex gap-3">
          <span>Ida: {leg1.result.homeGoals}–{leg1.result.awayGoals}</span>
          <span>Volta: {leg2.result.homeGoals}–{leg2.result.awayGoals}</span>
          {leg2.result.homePenalties != null && (
            <span>({leg2.result.awayPenalties}–{leg2.result.homePenalties} pen.)</span>
          )}
        </div>
      )}
    </div>
  );
}

function getZone(index: number, total: number, format: string): string {
  if (format === 'round_robin') {
    if (index < 4) return 'bg-blue-400';
    if (index < 6) return 'bg-blue-400/60';
    if (index < 12) return 'bg-orange-400/70';
    if (index >= total - 4) return 'bg-red-500';
  }
  return 'bg-transparent';
}

function Legend({ format }: { format: string }) {
  if (format !== 'round_robin') return null;
  return (
    <div className="px-4 py-3 border-t border-white/5 text-xs text-white/60 flex flex-wrap gap-4">
      <span className="flex items-center gap-1"><span className="w-2 h-3 bg-blue-400 rounded" /> Libertadores</span>
      <span className="flex items-center gap-1"><span className="w-2 h-3 bg-orange-400/70 rounded" /> Sul-Americana</span>
      <span className="flex items-center gap-1"><span className="w-2 h-3 bg-red-500 rounded" /> Rebaixamento</span>
    </div>
  );
}
