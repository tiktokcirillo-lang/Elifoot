import { useGameStore } from '@/store/gameStore';
import { Trophy, Star, Zap, TrendingUp, Award } from 'lucide-react';

type PlayerWithTeam = {
  name: string;
  teamName: string;
  teamShort: string;
  age: number;
  position: string;
  overall: number;
  goals: number;
  appearances: number;
};

function posColor(pos: string): string {
  return pos === 'GK' ? 'bg-yellow-700 text-yellow-100'
    : pos === 'DF' ? 'bg-blue-700 text-blue-100'
    : pos === 'MF' ? 'bg-green-700 text-green-100'
    : 'bg-red-700 text-red-100';
}

export default function RankingsPage() {
  const save = useGameStore((s) => s.save);
  if (!save) return null;

  // Agrega todos os jogadores com seus times
  const allPlayers: PlayerWithTeam[] = save.teams.flatMap((t) =>
    t.squad.map((p) => ({
      name: p.name,
      teamName: t.name,
      teamShort: t.shortName,
      age: p.age,
      position: p.position,
      overall: p.overall,
      goals: p.stats.goals,
      appearances: p.stats.appearances,
    })),
  );

  const topScorers = [...allPlayers]
    .filter((p) => p.goals > 0)
    .sort((a, b) => b.goals - a.goals || b.overall - a.overall)
    .slice(0, 15);

  const bestPlayers = [...allPlayers]
    .sort((a, b) => b.overall - a.overall)
    .slice(0, 15);

  const bestYoung = [...allPlayers]
    .filter((p) => p.age <= 23 && p.appearances > 0)
    .sort((a, b) => b.overall - a.overall)
    .slice(0, 10);

  // Prêmios das últimas temporadas
  const recentAwards = [...(save.seasonAwards ?? [])].reverse().slice(0, 3);

  return (
    <div className="space-y-4">
      <div className="panel p-5">
        <div className="text-xs uppercase tracking-wider text-white/50">Rankings & Prêmios</div>
        <h2 className="display-font text-3xl">Hall da Fama</h2>
        <div className="text-sm text-white/60">
          Temporada {save.season} · Artilheiros, melhores jogadores e premiações
        </div>
      </div>

      {/* Prêmios das últimas temporadas */}
      {recentAwards.length > 0 && (
        <div className="panel p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-yellow-400" /> Prêmios por Temporada
          </h3>
          <div className="space-y-4">
            {recentAwards.map((award) => (
              <div key={award.season} className="border border-white/10 rounded-lg p-3">
                <div className="text-xs uppercase tracking-wider text-white/40 mb-2">
                  Temporada {award.season}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {award.artilheiro && (
                    <div className="bg-white/5 rounded-lg p-2 text-center">
                      <div className="text-[10px] uppercase text-white/40 mb-1">Artilheiro</div>
                      <Zap className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
                      <div className="text-xs font-semibold truncate">{award.artilheiro.playerName}</div>
                      <div className="text-[10px] text-white/50">{award.artilheiro.teamName}</div>
                      <div className="text-xs text-yellow-400 font-bold mt-1">{award.artilheiro.goals} gols</div>
                    </div>
                  )}
                  {award.boladeOuro && (
                    <div className="bg-white/5 rounded-lg p-2 text-center">
                      <div className="text-[10px] uppercase text-white/40 mb-1">Bola de Ouro</div>
                      <Star className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
                      <div className="text-xs font-semibold truncate">{award.boladeOuro.playerName}</div>
                      <div className="text-[10px] text-white/50">{award.boladeOuro.teamName}</div>
                      <div className="text-xs text-pitch-400 font-bold mt-1">OVR {award.boladeOuro.overall}</div>
                    </div>
                  )}
                  {award.revelacao && (
                    <div className="bg-white/5 rounded-lg p-2 text-center">
                      <div className="text-[10px] uppercase text-white/40 mb-1">Revelação</div>
                      <TrendingUp className="w-4 h-4 text-green-400 mx-auto mb-1" />
                      <div className="text-xs font-semibold truncate">{award.revelacao.playerName}</div>
                      <div className="text-[10px] text-white/50">{award.revelacao.teamName}</div>
                      <div className="text-xs text-green-400 font-bold mt-1">{award.revelacao.age} anos</div>
                    </div>
                  )}
                  {award.melhorTecnico && (
                    <div className="bg-white/5 rounded-lg p-2 text-center">
                      <div className="text-[10px] uppercase text-white/40 mb-1">Melhor Técnico</div>
                      <Trophy className="w-4 h-4 text-orange-400 mx-auto mb-1" />
                      <div className="text-xs font-semibold truncate">{award.melhorTecnico.managerName}</div>
                      <div className="text-[10px] text-white/50">{award.melhorTecnico.teamName}</div>
                      <div className="text-xs text-orange-400 font-bold mt-1">
                        {award.melhorTecnico.titulos} título(s)
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {/* Artilheiros da temporada */}
        <div className="panel p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" /> Artilheiros da Temporada
          </h3>
          {topScorers.length === 0 ? (
            <p className="text-sm text-white/40 text-center py-4">
              Nenhum gol marcado ainda nesta temporada.
            </p>
          ) : (
            <div className="space-y-1">
              {topScorers.map((p, i) => (
                <div key={`${p.name}-${p.teamShort}`} className="flex items-center gap-2 py-1.5 border-b border-white/5">
                  <span className={`text-xs w-5 font-bold ${i === 0 ? 'text-yellow-400' : 'text-white/40'}`}>
                    {i + 1}
                  </span>
                  <span className={`w-6 text-[10px] text-center rounded font-bold py-0.5 ${posColor(p.position)}`}>
                    {p.position}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{p.name}</div>
                    <div className="text-xs text-white/40">{p.teamShort} · {p.appearances} jogos</div>
                  </div>
                  <span className="text-sm font-bold text-yellow-400">{p.goals}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Melhores jogadores em campo */}
        <div className="panel p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-pitch-400" /> Melhores Jogadores
          </h3>
          <div className="space-y-1">
            {bestPlayers.map((p, i) => (
              <div key={`${p.name}-${p.teamShort}-${i}`} className="flex items-center gap-2 py-1.5 border-b border-white/5">
                <span className={`text-xs w-5 font-bold ${i === 0 ? 'text-yellow-400' : 'text-white/40'}`}>
                  {i + 1}
                </span>
                <span className={`w-6 text-[10px] text-center rounded font-bold py-0.5 ${posColor(p.position)}`}>
                  {p.position}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{p.name}</div>
                  <div className="text-xs text-white/40">{p.teamShort} · {p.age} anos</div>
                </div>
                <span className="text-sm font-bold text-pitch-400">{p.overall}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Melhores jovens */}
      <div className="panel p-5">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-400" /> Melhores Jovens (até 23 anos)
        </h3>
        {bestYoung.length === 0 ? (
          <p className="text-sm text-white/40 text-center py-4">
            Nenhum jovem com jogos disputados ainda.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-1">
            {bestYoung.map((p, i) => (
              <div key={`${p.name}-${i}`} className="flex items-center gap-2 py-1.5 border-b border-white/5">
                <span className={`text-xs w-5 font-bold ${i === 0 ? 'text-green-400' : 'text-white/40'}`}>
                  {i + 1}
                </span>
                <span className={`w-6 text-[10px] text-center rounded font-bold py-0.5 ${posColor(p.position)}`}>
                  {p.position}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{p.name}</div>
                  <div className="text-xs text-white/40">{p.teamShort} · {p.age} anos</div>
                </div>
                <span className="text-sm font-bold text-green-400">{p.overall}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hall da Fama (campeões por temporada) */}
      {save.hallOfFame.length > 0 && (
        <div className="panel p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-400" /> Campeões
          </h3>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {[...save.hallOfFame].reverse().map((entry, i) => (
              <div key={i} className="flex items-center gap-3 py-1.5 border-b border-white/5">
                <span className="text-xs text-white/40 w-12">T{entry.season}</span>
                <Trophy className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
                <span className="text-sm font-semibold truncate">{entry.championName}</span>
                <span className="text-xs text-white/40 ml-auto truncate">{entry.competitionName}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
