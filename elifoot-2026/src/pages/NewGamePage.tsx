import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGameStore } from '@/store/gameStore';
import { buildBrasileiraoTeams } from '@/data/brasileiraoTeams';
import { loadCustomTeams } from '@/pages/CustomTeamPage';
import type { CustomTeamSeed } from '@/pages/CustomTeamPage';
import { ArrowLeft, Plus, Pencil } from 'lucide-react';
import TeamBadge from '@/components/TeamBadge';

const brTeamsPreview = buildBrasileiraoTeams();

export default function NewGamePage() {
  const [managerName, setManagerName] = useState('');
  const [saveName, setSaveName] = useState('Carreira 1');
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [customTeams, setCustomTeams] = useState<CustomTeamSeed[]>([]);
  const newGame = useGameStore((s) => s.newGame);
  const navigate = useNavigate();

  useEffect(() => {
    setCustomTeams(loadCustomTeams());
  }, []);

  async function handleStart() {
    if (!managerName.trim() || !selectedTeam) return;
    await newGame(managerName.trim(), selectedTeam, saveName.trim() || 'Carreira');
    navigate('/game');
  }

  const teamCard = (id: string, shortName: string, name: string, tier: string, primary: string, secondary: string) => (
    <button
      key={id}
      onClick={() => setSelectedTeam(id)}
      className={`panel p-3 text-left transition-all hover:scale-[1.02] ${selectedTeam === id ? 'ring-2 ring-pitch-500' : ''}`}
    >
      <div className="w-full flex justify-center mb-2">
        <TeamBadge team={{ id, shortName, primaryColor: primary, secondaryColor: secondary }} size={64} />
      </div>
      <div className="text-xs font-semibold truncate">{name}</div>
      <div className="text-[10px] text-white/50">{tier.toUpperCase()}</div>
    </button>
  );

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

      {/* Times do Brasileirão */}
      <h3 className="display-font text-2xl mb-3">Escolha seu time</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
        {brTeamsPreview.map((t) =>
          teamCard(t.id, t.shortName, t.name, t.tier, t.primaryColor, t.secondaryColor)
        )}
      </div>

      {/* Times customizados */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="display-font text-2xl">Times Personalizados</h3>
        <Link to="/custom-team" className="btn-ghost text-xs flex items-center gap-1">
          <Pencil className="w-3 h-3" /> Gerenciar
        </Link>
      </div>

      {customTeams.length === 0 ? (
        <Link
          to="/custom-team"
          className="panel p-4 mb-8 flex items-center gap-3 text-white/50 hover:text-white transition-colors border border-dashed border-white/20"
        >
          <Plus className="w-5 h-5" />
          <span className="text-sm">Criar seu próprio time para jogar no Brasileirão</span>
        </Link>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-8">
          {customTeams.map((t) =>
            teamCard(t.id, t.shortName, t.name, t.tier, t.primaryColor, t.secondaryColor)
          )}
          <Link
            to="/custom-team"
            className="panel p-3 flex flex-col items-center justify-center text-white/40 hover:text-white transition-colors border-dashed border border-white/20 aspect-square"
          >
            <Plus className="w-6 h-6 mb-1" />
            <span className="text-xs">Novo time</span>
          </Link>
        </div>
      )}

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
