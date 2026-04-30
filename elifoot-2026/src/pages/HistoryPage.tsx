import { useGameStore } from '@/store/gameStore';
import { Trophy, TrendingUp, TrendingDown } from 'lucide-react';

export default function HistoryPage() {
  const save = useGameStore((s) => s.save);
  if (!save) return null;

  const records = [...save.seasonRecords].reverse();
  const hallOfFame = save.hallOfFame;

  return (
    <div className="space-y-4">
      <div className="panel p-5">
        <div className="text-xs uppercase tracking-wider text-white/50">Fase 7</div>
        <h2 className="display-font text-3xl">Histórico</h2>
        <div className="text-sm text-white/60">
          {records.length} temporada(s) registrada(s)
        </div>
      </div>

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
