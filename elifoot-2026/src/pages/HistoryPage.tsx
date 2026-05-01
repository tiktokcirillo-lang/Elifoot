import { useGameStore } from '@/store/gameStore';
import { Trophy, TrendingUp, TrendingDown, AlertTriangle, LogOut } from 'lucide-react';
import type { Team } from '@/types';

export default function HistoryPage() {
  const save = useGameStore((s) => s.save);
  const switchTeam = useGameStore((s) => s.switchTeam);
  const resignFromClub = useGameStore((s) => s.resignFromClub);

  if (!save) return null;

  const records = [...save.seasonRecords].reverse();
  const hallOfFame = save.hallOfFame;
  const dismissed = save.dismissed;

  // Times disponíveis para assumir (ordenados por reputação)
  const availableTeams = [...save.teams]
    .filter((t) => !t.isUserControlled && t.country === 'BR')
    .sort((a, b) => b.reputation - a.reputation);

  return (
    <div className="space-y-4">
      <div className="panel p-5">
        <div className="text-xs uppercase tracking-wider text-white/50">Carreira</div>
        <h2 className="display-font text-3xl">Histórico</h2>
        <div className="text-sm text-white/60">
          {records.length} temporada(s) registrada(s)
        </div>
      </div>

      {/* Demissão / escolha de novo clube */}
      {dismissed && (
        <div className="panel p-5 border border-red-500/30">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div>
              <div className="font-semibold text-red-300">
                {save.managerWarnings >= 2 ? 'Você foi demitido' : 'Você pediu demissão'}
              </div>
              <div className="text-sm text-white/50">Escolha um clube para continuar sua carreira</div>
            </div>
          </div>
          <TeamPicker teams={availableTeams} onPick={switchTeam} />
        </div>
      )}

      {/* Resignação voluntária (fim de temporada) */}
      {!dismissed && save.seasonOver && (
        <div className="panel p-4 flex items-center justify-between">
          <div>
            <div className="font-semibold text-sm">Mudar de clube</div>
            <div className="text-xs text-white/50">Temporada encerrada — você pode assumir outro time</div>
          </div>
          <button
            className="flex items-center gap-1.5 text-xs bg-white/10 hover:bg-white/15 text-white/70 px-3 py-2 rounded-lg transition-colors"
            onClick={resignFromClub}
          >
            <LogOut className="w-3.5 h-3.5" /> Pedir demissão
          </button>
        </div>
      )}

      {/* Hall da fama */}
      {hallOfFame.length > 0 && (
        <div className="panel p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-gold-400" /> Hall da Fama
          </h3>
          <div className="space-y-2">
            {hallOfFame.map((entry, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                <div className="w-10 h-10 rounded-lg bg-gold-500/10 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-gold-400" />
                </div>
                <div>
                  <div className="font-semibold text-sm">{entry.championName}</div>
                  <div className="text-xs text-white/50">{entry.competitionName} · Temporada {entry.season}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Histórico por temporada */}
      {records.length === 0 ? (
        <div className="panel p-8 text-center text-white/40">
          Nenhuma temporada completa ainda. Continue jogando!
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((rec) => (
            <div key={rec.season} className="panel p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="display-font text-2xl">Temporada {rec.season}</div>
                  <div className="text-sm text-white/60">{rec.teamName}</div>
                </div>
                <PositionBadge position={rec.leaguePosition} />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <div className="text-white/50 text-xs mb-1">Posição</div>
                  <div className="font-bold text-lg">{rec.leaguePosition}º</div>
                </div>
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <div className="text-white/50 text-xs mb-1">Objetivos</div>
                  <div className="font-bold text-lg">
                    {rec.objectivesAchieved}/{rec.objectivesTotal}
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <div className="text-white/50 text-xs mb-1">Títulos</div>
                  <div className="font-bold text-lg">{rec.titles.length}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-3 text-center">
                  <div className="text-white/50 text-xs mb-1">Saldo final</div>
                  <div className={`font-bold text-lg ${rec.budget >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {rec.budget >= 0 ? <TrendingUp className="w-4 h-4 inline" /> : <TrendingDown className="w-4 h-4 inline" />}
                    {' '}R$ {Math.abs(rec.budget / 1000).toFixed(0)}k
                  </div>
                </div>
              </div>

              {rec.titles.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {rec.titles.map((title, i) => (
                    <span key={i} className="flex items-center gap-1 text-xs bg-gold-500/20 text-gold-300 px-2 py-1 rounded-full">
                      <Trophy className="w-3 h-3" /> {title}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TeamPicker({ teams, onPick }: { teams: Team[]; onPick: (id: string) => void }) {
  const tierLabel: Record<string, string> = {
    elite: 'Elite',
    top: 'Primeira linha',
    mid: 'Média',
    low: 'Baixa',
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {teams.slice(0, 16).map((team) => (
        <button
          key={team.id}
          className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-left"
          onClick={() => onPick(team.id)}
        >
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ backgroundColor: team.primaryColor, color: team.secondaryColor }}
          >
            {team.shortName}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-sm truncate">{team.name}</div>
            <div className="text-xs text-white/40">
              {team.city} · {tierLabel[team.tier]} · Rep {team.reputation}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

function PositionBadge({ position }: { position: number }) {
  const color =
    position === 0   ? 'bg-white/10 text-white/40' :
    position === 1   ? 'bg-gold-500/30 text-gold-300' :
    position <= 4    ? 'bg-blue-500/20 text-blue-300' :
    position <= 6    ? 'bg-blue-400/20 text-blue-300' :
    position <= 16   ? 'bg-white/10 text-white/70' :
                       'bg-red-500/20 text-red-400';

  const label =
    position === 1   ? '🥇 Campeão' :
    position <= 4    ? '🥈 Libertadores' :
    position <= 6    ? 'Libertadores' :
    position <= 16   ? 'Permanência' :
    position === 0   ? '—' :
                       '⬇️ Rebaixado';

  return (
    <div className={`px-3 py-1 rounded-full text-sm font-semibold ${color}`}>
      {label}
    </div>
  );
}
