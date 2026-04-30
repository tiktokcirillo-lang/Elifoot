import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/store/gameStore';
import { buildBrasileiraoTeams } from '@/data/brasileiraoTeams';
import { ArrowLeft } from 'lucide-react';

const teamsPreview = buildBrasileiraoTeams();

export default function NewGamePage() {
  const [managerName, setManagerName] = useState('');
  const [saveName, setSaveName] = useState('Carreira 1');
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const newGame = useGameStore((s) => s.newGame);
  const navigate = useNavigate();

  async function handleStart() {
    if (!managerName.trim() || !selectedTeam) return;
    await newGame(managerName.trim(), selectedTeam, saveName.trim() || 'Carreira');
    navigate('/game');
  }

  return (
    <div className="min-h-screen p-6 max-w-4xl mx-auto">
      <button onClick={() => navigate('/')} className="btn-ghost mb-6 flex items-center gap-2">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>

      <h2 className="display-font text-4xl mb-6">Novo jogo</h2>

      <div className="panel p-6 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm text-white/70 mb-1 block">Nome do técnico</span>
          <input
            type="text"
            value={managerName}
            onChange={(e) => setManagerName(e.target.value)}
            placeholder="Seu nome"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-pitch-500"
          />
        </label>
        <label className="block">
          <span className="text-sm text-white/70 mb-1 block">Nome do save</span>
          <input
            type="text"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-pitch-500"
          />
        </label>
      </div>

      <h3 className="display-font text-2xl mb-3">Escolha seu time</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-8">
        {teamsPreview.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelectedTeam(t.id)}
            className={`panel p-3 text-left transition-all hover:scale-[1.02] ${selectedTeam === t.id ? 'ring-2 ring-pitch-500' : ''}`}
          >
            <div
              className="w-full aspect-square rounded mb-2 flex items-center justify-center font-bold"
              style={{ backgroundColor: t.primaryColor, color: t.secondaryColor }}
            >
              {t.shortName}
            </div>
            <div className="text-xs font-semibold truncate">{t.name}</div>
            <div className="text-[10px] text-white/50">{t.tier.toUpperCase()}</div>
          </button>
        ))}
      </div>

      <button
        onClick={handleStart}
        disabled={!managerName.trim() || !selectedTeam}
        className="btn-primary text-lg w-full py-3 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Começar carreira
      </button>
    </div>
  );
}
