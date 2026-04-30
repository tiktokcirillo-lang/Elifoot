import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import type { Player, Position } from '@/types';
import { Star, Heart, Activity } from 'lucide-react';

const POSITION_ORDER: Position[] = ['GK', 'DF', 'MF', 'FW'];
const POSITION_LABEL: Record<Position, string> = {
  GK: 'Goleiros',
  DF: 'Defensores',
  MF: 'Meio-campistas',
  FW: 'Atacantes',
};

export default function SquadPage() {
  const userTeam = useGameStore((s) => s.getUserTeam());
  const setUserStarting11 = useGameStore((s) => s.setUserStarting11);
  const [selected, setSelected] = useState<string[]>(() => userTeam?.starting11 ?? []);

  if (!userTeam) return null;

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
            Selecionados: <span className="text-white">{selected.length}/11</span>
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
              return (
                <li
                  key={p.id}
                  onClick={() => toggleStarter(p.id)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                    isStarter ? 'bg-pitch-500/20 border border-pitch-500/40' : 'bg-white/5 hover:bg-white/10 border border-transparent'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-midnight-700 flex items-center justify-center font-bold text-sm">
                    {p.overall}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate flex items-center gap-1">
                      {isStarter && <Star className="w-3 h-3 text-gold-500 fill-gold-500" />}
                      {p.name}
                    </div>
                    <div className="text-xs text-white/60">
                      {p.age} anos · {p.foot === 'R' ? 'Pé direito' : p.foot === 'L' ? 'Pé esquerdo' : 'Ambidestro'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/60">
                    <span title="Moral" className="flex items-center gap-1">
                      <Heart className="w-3 h-3" /> {p.morale}
                    </span>
                    <span title="Físico" className="flex items-center gap-1">
                      <Activity className="w-3 h-3" /> {p.fitness}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
