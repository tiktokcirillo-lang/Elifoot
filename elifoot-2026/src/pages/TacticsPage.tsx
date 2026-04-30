import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import type { Formation, TacticalPosture, PressingLevel } from '@/types';
import { Shield, Zap, Scale, Target, Users } from 'lucide-react';

const POSTURES: { val: TacticalPosture; label: string; desc: string; icon: React.ReactNode }[] = [
  { val: 'attack',    label: 'Ofensivo',     desc: '+20% ataque, -15% defesa. Mais gols, mais riscos.',       icon: <Zap className="w-5 h-5" /> },
  { val: 'balanced',  label: 'Equilibrado',  desc: 'Sem modificadores. Jogo seguro e versátil.',              icon: <Scale className="w-5 h-5" /> },
  { val: 'defensive', label: 'Defensivo',    desc: '+20% defesa, -20% ataque. Difícil de vencer.',            icon: <Shield className="w-5 h-5" /> },
];

const PRESSING_OPTIONS: { val: PressingLevel; label: string; desc: string }[] = [
  { val: 'high',   label: 'Alta',   desc: '+12% criação de chances, mais desgaste físico.' },
  { val: 'medium', label: 'Média',  desc: 'Equilíbrio entre pressão e conservação de energia.' },
  { val: 'low',    label: 'Baixa',  desc: '-10% chances criadas, preserva fitness dos jogadores.' },
];

const FORMATIONS: Formation[] = ['4-3-3', '4-4-2', '4-2-3-1', '3-5-2', '5-3-2', '4-5-1'];

export default function TacticsPage() {
  const save = useGameStore((s) => s.save);
  const setTacticalSetup = useGameStore((s) => s.setTacticalSetup);
  const setFormation = useGameStore((s) => s.setFormation);
  const userTeam = useGameStore((s) => s.getUserTeam());

  const [showSetPiece, setShowSetPiece] = useState(false);

  if (!save || !userTeam) return null;

  const tactics = save.tacticalSetup;

  return (
    <div className="space-y-4">
      <div className="panel p-5">
        <div className="text-xs uppercase tracking-wider text-white/50">Fase 6</div>
        <h2 className="display-font text-3xl">Táticas</h2>
        <div className="text-sm text-white/60">{userTeam.name} · Temporada {save.season}</div>
      </div>

      {/* Postura */}
      <div className="panel p-5">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Target className="w-4 h-4 text-pitch-400" /> Postura Tática
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {POSTURES.map(({ val, label, desc, icon }) => (
            <button
              key={val}
              onClick={() => setTacticalSetup({ ...tactics, posture: val })}
              className={`flex items-start gap-3 p-4 rounded-lg border text-left transition-colors ${
                tactics.posture === val
                  ? 'border-pitch-500 bg-pitch-500/20'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              <span className={tactics.posture === val ? 'text-pitch-400' : 'text-white/40'}>{icon}</span>
              <div>
                <div className="font-semibold text-sm">{label}</div>
                <div className="text-xs text-white/50 mt-1">{desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Pressing */}
      <div className="panel p-5">
        <h3 className="font-semibold mb-3">Pressing</h3>
        <div className="flex gap-2">
          {PRESSING_OPTIONS.map(({ val, label, desc }) => (
            <button
              key={val}
              onClick={() => setTacticalSetup({ ...tactics, pressing: val })}
              className={`flex-1 p-3 rounded-lg border text-left transition-colors ${
                tactics.pressing === val
                  ? 'border-pitch-500 bg-pitch-500/20'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              <div className="font-semibold text-sm">{label}</div>
              <div className="text-xs text-white/50 mt-1">{desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Formação */}
      <div className="panel p-5">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-pitch-400" /> Formação
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {FORMATIONS.map((f) => (
            <button
              key={f}
              onClick={() => setFormation(f)}
              className={`py-2 rounded-lg border text-sm font-semibold transition-colors ${
                userTeam.formation === f
                  ? 'border-pitch-500 bg-pitch-500/20 text-white'
                  : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="text-xs text-white/40 mt-2">
          Formação atual: <span className="text-white">{userTeam.formation}</span>. A escalação é refeita automaticamente ao trocar.
        </div>
      </div>

      {/* Batedores de bola parada */}
      <div className="panel p-5">
        <button
          className="w-full text-left flex items-center justify-between"
          onClick={() => setShowSetPiece((s) => !s)}
        >
          <h3 className="font-semibold">Batedores de Bola Parada</h3>
          <span className="text-white/40 text-sm">{showSetPiece ? 'Fechar' : 'Configurar'}</span>
        </button>

        {showSetPiece && (
          <div className="mt-4 space-y-3">
            <SetPieceSelector
              label="Cobrador de Pênaltis"
              selected={tactics.penaltyTakerId}
              onSelect={(id) => setTacticalSetup({ ...tactics, penaltyTakerId: id })}
            />
            <SetPieceSelector
              label="Cobrador de Escanteios"
              selected={tactics.cornerTakerId}
              onSelect={(id) => setTacticalSetup({ ...tactics, cornerTakerId: id })}
            />
          </div>
        )}
      </div>

      {/* Resumo */}
      <div className="panel p-4 bg-midnight-800 text-sm text-white/60">
        <strong className="text-white">Configuração atual: </strong>
        Postura {POSTURES.find((p) => p.val === tactics.posture)?.label} ·
        Pressing {PRESSING_OPTIONS.find((p) => p.val === tactics.pressing)?.label} ·
        Formação {userTeam.formation}
      </div>
    </div>
  );
}

function SetPieceSelector({
  label, selected, onSelect,
}: {
  label: string;
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  const save = useGameStore((s) => s.save)!;
  const allPlayers = save.teams.find((t) => t.id === save.controlledTeamId)?.squad ?? [];
  const fwdsMids = allPlayers
    .filter((p) => p.position !== 'GK' && p.position !== 'DF')
    .sort((a, b) => b.technique - a.technique);

  return (
    <div>
      <div className="text-xs text-white/50 mb-1">{label}</div>
      <div className="flex flex-wrap gap-1">
        {fwdsMids.slice(0, 8).map((p) => (
          <button
            key={p.id}
            onClick={() => onSelect(p.id)}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              selected === p.id
                ? 'bg-pitch-500/30 border border-pitch-500 text-white'
                : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
            }`}
          >
            {p.name.split(' ')[0]} ({p.technique})
          </button>
        ))}
      </div>
    </div>
  );
}
