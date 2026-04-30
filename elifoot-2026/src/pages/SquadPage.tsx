import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import type { Player, Position } from '@/types';
import { Star, Heart, Activity, TrendingUp, ArrowUpCircle, RefreshCw, AlertTriangle } from 'lucide-react';

const POSITION_ORDER: Position[] = ['GK', 'DF', 'MF', 'FW'];
const POSITION_LABEL: Record<Position, string> = {
  GK: 'Goleiros',
  DF: 'Defensores',
  MF: 'Meio-campistas',
  FW: 'Atacantes',
};

export default function SquadPage() {
  const userTeam = useGameStore((s) => s.getUserTeam());
  const save = useGameStore((s) => s.save);
  const setUserStarting11 = useGameStore((s) => s.setUserStarting11);
  const promoteYouthPlayer = useGameStore((s) => s.promoteYouthPlayer);
  const renewContract = useGameStore((s) => s.renewContract);
  const [selected, setSelected] = useState<string[]>(() => userTeam?.starting11 ?? []);

  if (!userTeam || !save) return null;

  function toggleStarter(playerId: string) {
    setSelected((prev) => {
      if (prev.includes(playerId)) return prev.filter((id) => id !== playerId);
      if (prev.length >= 11) return prev; // máximo 11
      return [...prev, playerId];
    });
  }

  function saveLineup() {
    if (selected.length !== 11) {
      alert('Você precisa escolher exatamente 11 jogadores titulares.');
      return;
    }
    setUserStarting11(selected);
    alert('Escalação salva.');
  }

  const grouped = POSITION_ORDER.reduce<Record<Position, Player[]>>((acc, pos) => {
    acc[pos] = userTeam.squad
      .filter((p) => p.position === pos)
      .sort((a, b) => b.overall - a.overall);
    return acc;
  }, { GK: [], DF: [], MF: [], FW: [] });

  return (
    <div className="space-y-4">
      <div className="panel p-5 flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-white/50">Elenco</div>
          <h2 className="display-font text-3xl">{userTeam.name}</h2>
          <div className="text-sm text-white/60">
            Formação atual: <span className="text-white">{userTeam.formation}</span> ·
            Selecionados: <span className="text-white">{selected.length}/11</span> ·
            Elenco:{' '}
            <span className={userTeam.squad.length >= 30 ? 'text-red-400 font-bold' : userTeam.squad.length >= 28 ? 'text-yellow-400' : 'text-white'}>
              {userTeam.squad.length}/30
            </span>
          </div>
        </div>
        <button onClick={saveLineup} className="btn-primary">
          Salvar escalação
        </button>
      </div>

      {POSITION_ORDER.map((pos) => (
        <div key={pos} className="panel p-4">
          <h3 className="display-font text-xl mb-3">{POSITION_LABEL[pos]}</h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {grouped[pos].map((p) => {
              const isStarter = selected.includes(p.id);
              const contractExpired  = p.contractUntil < save.season;
              const contractExpiring = !contractExpired && p.contractUntil <= save.season + 1;
              const contractColor = contractExpired ? 'text-red-400' : contractExpiring ? 'text-yellow-400' : 'text-white/40';
              return (
                <li
                  key={p.id}
                  onClick={() => toggleStarter(p.id)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                    isStarter ? 'bg-pitch-500/20 border border-pitch-500/40' : 'bg-white/5 hover:bg-white/10 border border-transparent'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-midnight-700 flex items-center justify-center font-bold text-sm shrink-0">
                    {p.overall}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate flex items-center gap-1">
                      {isStarter && <Star className="w-3 h-3 text-gold-500 fill-gold-500" />}
                      {(contractExpired || contractExpiring) && <AlertTriangle className={`w-3 h-3 ${contractExpired ? 'text-red-400' : 'text-yellow-400'}`} />}
                      {p.name}
                    </div>
                    <div className="text-xs text-white/50">
                      {p.age} anos · Contrato: <span className={contractColor}>{p.contractUntil}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/60">
                    <span title="Moral" className="flex items-center gap-1">
                      <Heart className="w-3 h-3" /> {p.morale}
                    </span>
                    <span title="Físico" className="flex items-center gap-1">
                      <Activity className="w-3 h-3" /> {p.fitness}
                    </span>
                    {(contractExpired || contractExpiring) && (
                      <button
                        title={`Renovar contrato (bônus: R$ ${p.wageMonthly}k)`}
                        className="flex items-center gap-1 px-2 py-0.5 bg-pitch-500/20 border border-pitch-500/40 rounded hover:bg-pitch-500/30 text-pitch-300"
                        onClick={(e) => { e.stopPropagation(); renewContract(p.id); }}
                      >
                        <RefreshCw className="w-3 h-3" /> Renovar
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      {/* Academia (base) */}
      {save.youthPlayers && save.youthPlayers.length > 0 && (
        <div className="panel p-4">
          <h3 className="display-font text-xl mb-1 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-pitch-400" /> Base / Academia
          </h3>
          <p className="text-xs text-white/50 mb-3">Jovens promissores prontos para subir ao time principal.</p>
          <ul className="space-y-2">
            {save.youthPlayers.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-3 py-2 bg-white/5 rounded-lg border border-white/5">
                <div className="w-10 h-10 rounded-full bg-midnight-700 flex items-center justify-center font-bold text-sm">
                  {p.overall}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{p.name}</div>
                  <div className="text-xs text-white/50">
                    {p.position} · {p.age} anos · OVR {p.overall}
                    {p.potential !== undefined && (
                      <span className="text-pitch-400 ml-1">/ POT {p.potential}</span>
                    )}
                  </div>
                </div>
                <button
                  className="btn-primary text-xs px-3 py-1 flex items-center gap-1"
                  onClick={() => promoteYouthPlayer(p.id)}
                >
                  <ArrowUpCircle className="w-3 h-3" /> Promover
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
