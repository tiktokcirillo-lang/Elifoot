import { useGameStore } from '@/store/gameStore';
import { Trophy, Target, Star, Shield, TrendingUp, Users } from 'lucide-react';

export default function AwardsPage() {
  const save = useGameStore((s) => s.save);
  if (!save) return null;

  const awards = (save.seasonAwards ?? []).slice().reverse(); // mais recentes primeiro

  if (awards.length === 0) {
    return (
      <div className="panel p-8 text-center text-white/40">
        Nenhuma premiação ainda. Complete a primeira temporada para ver os prêmios.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="panel p-5">
        <div className="text-xs uppercase tracking-wider text-white/50">Temporadas</div>
        <h2 className="display-font text-3xl">Prêmios & Premiações</h2>
        <div className="text-sm text-white/60">{awards.length} temporada(s) registrada(s)</div>
      </div>

      {awards.map((award) => (
        <div key={award.season} className="panel p-5 space-y-4">
          <div className="flex items-center gap-3 border-b border-white/10 pb-3">
            <Trophy className="w-5 h-5 text-gold-400" />
            <h3 className="display-font text-2xl text-gold-400">Temporada {award.season}</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Artilheiro */}
            {award.artilheiro && (
              <AwardCard
                icon={<Target className="w-4 h-4 text-red-400" />}
                title="Artilheiro"
                name={award.artilheiro.playerName}
                team={award.artilheiro.teamName}
                detail={`${award.artilheiro.goals} gols`}
                color="text-red-400"
              />
            )}

            {/* Bola de Ouro */}
            {award.boladeOuro && (
              <AwardCard
                icon={<Star className="w-4 h-4 text-gold-400 fill-gold-400" />}
                title="Bola de Ouro"
                name={award.boladeOuro.playerName}
                team={award.boladeOuro.teamName}
                detail={`OVR ${award.boladeOuro.overall} · ${award.boladeOuro.totalVotes} pts`}
                color="text-gold-400"
              />
            )}

            {/* Revelação (Troféu Kopa) */}
            {award.revelacao && (
              <AwardCard
                icon={<TrendingUp className="w-4 h-4 text-green-400" />}
                title="Revelação (sub-21)"
                name={award.revelacao.playerName}
                team={award.revelacao.teamName}
                detail={`${award.revelacao.age} anos · OVR ${award.revelacao.overall}`}
                color="text-green-400"
              />
            )}

            {/* Melhor Goleiro (Troféu Yashin) */}
            {award.melhorGoleiro && (
              <AwardCard
                icon={<Shield className="w-4 h-4 text-blue-400" />}
                title="Melhor Goleiro"
                name={award.melhorGoleiro.playerName}
                team={award.melhorGoleiro.teamName}
                detail={`OVR ${award.melhorGoleiro.overall}`}
                color="text-blue-400"
              />
            )}

            {/* Melhor Técnico */}
            {award.melhorTecnico && (
              <AwardCard
                icon={<Users className="w-4 h-4 text-purple-400" />}
                title="Melhor Técnico"
                name={award.melhorTecnico.managerName}
                team={award.melhorTecnico.teamName}
                detail={award.melhorTecnico.titulos > 0 ? `${award.melhorTecnico.titulos} título(s)` : 'Temporada regular'}
                color="text-purple-400"
              />
            )}
          </div>

          {/* Top 5 da votação Bola de Ouro */}
          {award.topVoters && award.topVoters.length > 0 && (
            <div className="mt-2">
              <div className="text-xs uppercase tracking-wider text-white/40 mb-2">Votação — Bola de Ouro</div>
              <ol className="space-y-1">
                {award.topVoters.map((v, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <span className={`w-6 text-center font-bold ${i === 0 ? 'text-gold-400' : i === 1 ? 'text-white/60' : 'text-white/40'}`}>
                      {i + 1}
                    </span>
                    <span className="flex-1 truncate">{v.playerName}</span>
                    <span className="text-white/50 text-xs truncate">{v.teamName}</span>
                    <span className="text-gold-300 font-semibold text-xs">{v.points} pts</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function AwardCard({
  icon, title, name, team, detail, color,
}: {
  icon: React.ReactNode;
  title: string;
  name: string;
  team: string;
  detail: string;
  color: string;
}) {
  return (
    <div className="bg-white/5 rounded-xl p-4 border border-white/5">
      <div className={`flex items-center gap-2 text-xs uppercase tracking-wider ${color} mb-2`}>
        {icon} {title}
      </div>
      <div className="font-semibold text-base">{name}</div>
      <div className="text-sm text-white/50">{team}</div>
      <div className={`text-xs mt-1 font-medium ${color}`}>{detail}</div>
    </div>
  );
}
