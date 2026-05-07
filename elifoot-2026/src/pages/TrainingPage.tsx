import { useGameStore } from '@/store/gameStore';
import type { TrainingIntensity, TrainingType } from '@/types';
import { Dumbbell, Zap, Shield, Wind, Brain, Bed, ChevronRight } from 'lucide-react';
import { calcWeeklyGrowth } from '@/engine/trainingEngine';

const TRAINING_TYPES: { type: TrainingType; label: string; desc: string; icon: React.ReactNode }[] = [
  { type: 'attack',    label: 'Ataque',     desc: '+Ataque para atacantes e meias',       icon: <Zap className="w-5 h-5" /> },
  { type: 'defense',   label: 'Defesa',     desc: '+Defesa para zagueiros e goleiros',    icon: <Shield className="w-5 h-5" /> },
  { type: 'fitness',   label: 'Condição',   desc: '+Pace e stamina, recupera físico',     icon: <Wind className="w-5 h-5" /> },
  { type: 'technique', label: 'Técnica',    desc: '+Técnica para todo o elenco',          icon: <Dumbbell className="w-5 h-5" /> },
  { type: 'tactics',   label: 'Tática',     desc: 'Melhora equilibrada de todos os atrs', icon: <Brain className="w-5 h-5" /> },
  { type: 'rest',      label: 'Descanso',   desc: 'Recuperação máxima de físico',         icon: <Bed className="w-5 h-5" /> },
];

const INTENSITIES: { val: TrainingIntensity; label: string; desc: string; color: string }[] = [
  { val: 'light',  label: 'Leve',    desc: 'Ganho menor, fitness recupera +2',    color: 'text-blue-400' },
  { val: 'normal', label: 'Normal',  desc: 'Ganho equilibrado, fitness -2',       color: 'text-white' },
  { val: 'heavy',  label: 'Intenso', desc: 'Ganho maior, risco leve de lesão',    color: 'text-orange-400' },
];

export default function TrainingPage() {
  const save = useGameStore((s) => s.save);
  const setTrainingPlan = useGameStore((s) => s.setTrainingPlan);
  const userTeam = useGameStore((s) => s.getUserTeam());

  if (!save || !userTeam) return null;

  const plan = save.trainingPlan;
  const nextTrainingTurn = Math.ceil(save.currentTurn / 7) * 7;
  const skills = save.unlockedSkills ?? [];
  const hasTalentCoach = skills.includes('talent_coach');
  const hasDefensiveSpec = skills.includes('defensive_specialist');

  return (
    <div className="space-y-4">
      <div className="panel p-5">
        <div className="text-xs uppercase tracking-wider text-white/50">Fase 4</div>
        <h2 className="display-font text-3xl">Treinamento</h2>
        <div className="text-sm text-white/60">
          Próximo treinamento: dia {nextTrainingTurn} · Plano atual:{' '}
          <span className="text-white font-semibold">
            {TRAINING_TYPES.find((t) => t.type === plan.type)?.label} —{' '}
            {INTENSITIES.find((i) => i.val === plan.intensity)?.label}
          </span>
        </div>
      </div>

      {/* Habilidades do técnico ativas */}
      {(hasTalentCoach || hasDefensiveSpec) && (
        <div className="panel p-4 border border-pitch-500/20 bg-pitch-900/20">
          <div className="text-xs uppercase tracking-wider text-white/40 mb-2">Habilidades do Técnico Ativas</div>
          <div className="flex flex-wrap gap-2">
            {hasTalentCoach && (
              <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2 text-xs">
                <span className="text-green-400 font-bold">🎓 Coach de Jovens</span>
                <span className="text-white/60">jogadores ≤23 anos crescem <span className="text-green-400 font-semibold">+40%</span> por semana</span>
              </div>
            )}
            {hasDefensiveSpec && (
              <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 rounded-lg px-3 py-2 text-xs">
                <span className="text-purple-400 font-bold">🛡 Especialista Defensivo</span>
                <span className="text-white/60">GK/DF recebem <span className="text-purple-400 font-semibold">+3 DEF</span> ao início de cada temporada</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tipo de treinamento */}
      <div className="panel p-5">
        <h3 className="font-semibold mb-3">Foco do treino</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {TRAINING_TYPES.map(({ type, label, desc, icon }) => (
            <button
              key={type}
              onClick={() => setTrainingPlan({ ...plan, type })}
              className={`flex items-start gap-3 p-3 rounded-lg border transition-colors text-left ${
                plan.type === type
                  ? 'border-pitch-500 bg-pitch-500/20'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              <span className={plan.type === type ? 'text-pitch-400' : 'text-white/50'}>{icon}</span>
              <div>
                <div className="font-semibold text-sm">{label}</div>
                <div className="text-xs text-white/50 leading-tight mt-0.5">{desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Intensidade */}
      <div className="panel p-5">
        <h3 className="font-semibold mb-3">Intensidade</h3>
        <div className="flex gap-2">
          {INTENSITIES.map(({ val, label, desc, color }) => (
            <button
              key={val}
              onClick={() => setTrainingPlan({ ...plan, intensity: val })}
              className={`flex-1 p-3 rounded-lg border transition-colors text-left ${
                plan.intensity === val
                  ? 'border-pitch-500 bg-pitch-500/20'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              <div className={`font-semibold text-sm ${color}`}>{label}</div>
              <div className="text-xs text-white/50 mt-1">{desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Elenco — desenvolvimento */}
      <div className="panel p-5">
        <h3 className="font-semibold mb-3">Elenco — desenvolvimento</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-white/50">
              <tr>
                <th className="text-left py-2">Jogador</th>
                <th className="text-center py-2">OVR</th>
                <th className="text-center py-2">ATK</th>
                <th className="text-center py-2">DEF</th>
                <th className="text-center py-2">VEL</th>
                <th className="text-center py-2">TEC</th>
                <th className="text-center py-2">FIS</th>
                <th className="text-center py-2">Físico</th>
                <th className="text-center py-2">Cresc.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {userTeam.squad
                .slice()
                .sort((a, b) => b.overall - a.overall)
                .map((p) => {
                  const weeklyGain = calcWeeklyGrowth(p, plan);
                  const isInjured = p.injuredUntil && p.injuredUntil > save.currentTurn;
                  const gainColor =
                    weeklyGain >= 1.5 ? 'text-green-400' :
                    weeklyGain >= 0.5 ? 'text-yellow-400' :
                    'text-white/30';
                  return (
                    <tr key={p.id} className={isInjured ? 'opacity-40' : ''}>
                      <td className="py-2 pr-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-6 text-[10px] text-center rounded font-bold py-0.5 ${posColor(p.position)}`}>
                            {p.position}
                          </span>
                          <span className="truncate max-w-[120px]">{p.name}</span>
                          {isInjured && (
                            <span className="text-[10px] text-red-400 bg-red-400/10 px-1 rounded">Lesão</span>
                          )}
                        </div>
                        <div className="text-xs text-white/40 flex items-center gap-1">
                          {p.age} anos
                          {hasTalentCoach && p.age <= 23 && (
                            <span className="text-[9px] bg-green-500/20 text-green-400 px-1 rounded font-bold">+40%</span>
                          )}
                        </div>
                      </td>
                      <td className="text-center py-2 font-bold">{p.overall}</td>
                      <td className="text-center py-2">{p.attack}</td>
                      <td className="text-center py-2">{p.defense}</td>
                      <td className="text-center py-2">{p.pace}</td>
                      <td className="text-center py-2">{p.technique}</td>
                      <td className="text-center py-2">{p.stamina}</td>
                      <td className="text-center py-2">
                        <div className="w-16 h-1.5 bg-white/10 rounded overflow-hidden mx-auto">
                          <div
                            className={`h-full rounded ${p.fitness >= 80 ? 'bg-green-500' : p.fitness >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${p.fitness}%` }}
                          />
                        </div>
                        <div className="text-xs text-white/40 mt-0.5">{p.fitness}%</div>
                      </td>
                      <td className="text-center py-2">
                        {weeklyGain > 0 ? (
                          <span className={`text-xs font-semibold ${gainColor}`}>+{weeklyGain.toFixed(1)}</span>
                        ) : (
                          <span className="text-xs text-white/20">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legenda */}
      <div className="panel p-4 text-xs text-white/50 flex flex-wrap gap-4">
        <span>Cresc. = ganho estimado de OVR por semana com o plano atual</span>
        <span className="flex items-center gap-1"><ChevronRight className="w-3 h-3 text-green-400" /> ≥ +1.5 (jovem)</span>
        <span className="flex items-center gap-1"><ChevronRight className="w-3 h-3 text-yellow-400" /> ≥ +0.5 (médio)</span>
        <span className="flex items-center gap-1"><ChevronRight className="w-3 h-3 text-white/40" /> — (veterano/sem ganho)</span>
      </div>
    </div>
  );
}

function posColor(pos: string): string {
  return pos === 'GK' ? 'bg-yellow-700 text-yellow-100'
    : pos === 'DF' ? 'bg-blue-700 text-blue-100'
    : pos === 'MF' ? 'bg-green-700 text-green-100'
    : 'bg-red-700 text-red-100';
}
