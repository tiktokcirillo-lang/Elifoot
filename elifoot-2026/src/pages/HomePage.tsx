import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listSaves, deleteSave } from '@/db/database';
import { useGameStore } from '@/store/gameStore';
import type { SaveGame } from '@/types';
import { Trash2, Play, Plus } from 'lucide-react';

export default function HomePage() {
  const [saves, setSaves] = useState<SaveGame[]>([]);
  const loadGame = useGameStore((s) => s.loadGame);
  const navigate = useNavigate();

  useEffect(() => {
    listSaves().then(setSaves);
  }, []);

  async function handleLoad(id: string) {
    await loadGame(id);
    navigate('/game');
  }

  async function handleDelete(id: string) {
    if (!confirm('Apagar este save permanentemente?')) return;
    await deleteSave(id);
    setSaves(await listSaves());
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <h1 className="display-font text-7xl text-white tracking-wider">ELIFOOT</h1>
          <div className="display-font text-3xl text-gold-500">2026</div>
          <p className="text-white/60 mt-3">
            Gerenciamento de futebol moderno, inspirado nos clássicos
          </p>
        </div>

        <div className="panel p-6 space-y-3">
          <Link to="/new" className="btn-primary w-full flex items-center justify-center gap-2 text-lg py-3">
            <Plus className="w-5 h-5" /> Novo Jogo
          </Link>

          {saves.length > 0 && (
            <>
              <div className="text-sm text-white/50 mt-4 mb-2">Jogos salvos</div>
              <ul className="space-y-2">
                {saves.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-3"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{s.name}</div>
                      <div className="text-xs text-white/50">
                        Téc. {s.managerName} · Temp. {s.season} · Dia {s.currentTurn}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleLoad(s.id)} className="btn-ghost text-sm flex items-center gap-1">
                        <Play className="w-4 h-4" /> Continuar
                      </button>
                      <button onClick={() => handleDelete(s.id)} className="btn-ghost text-sm">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="text-center text-xs text-white/30">
          Save offline via IndexedDB · Funciona como PWA
        </div>
      </div>
    </div>
  );
}
