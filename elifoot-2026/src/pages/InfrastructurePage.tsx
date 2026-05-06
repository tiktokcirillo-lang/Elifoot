import { useGameStore } from '@/store/gameStore';
import type { Infrastructure } from '@/types';
import { Building2, Heart, TrendingUp, Lock, CheckCircle } from 'lucide-react';

interface FacilityDef {
  key: keyof Infrastructure;
  name: string;
  icon: React.ReactNode;
  description: string;
  levelDescriptions: [string, string, string, string];
  costs: [number, number, number];
}

const FACILITIES: FacilityDef[] = [
  {
    key: 'training',
    name: 'Centro de Treinamento',
    icon: <Building2 className="w-5 h-5 text-pitch-400" />,
    description: 'Melhora a eficácia dos treinos e a recuperação de fitness do elenco.',
    levelDescriptions: [
      'Instalações básicas. Treinos com eficácia padrão.',
      'Equipamentos modernos. +10% evolução semanal dos jogadores.',
      'Centro de alto desempenho. +20% evolução. Recuperação acelerada.',
      'Instalações de classe mundial. +35% evolução. Fitness máximo mais fácil.',
    ],
    costs: [500, 1500, 3000],
  },
  {
    key: 'medical',
    name: 'Departamento Médico',
    icon: <Heart className="w-5 h-5 text-red-400" />,
    description: 'Reduz o tempo de recuperação de lesões do elenco.',
    levelDescriptions: [
      'Estrutura básica. Lesões com prazo normal de recuperação.',
      'Fisioterapeutas especializados. Lesões curam 1 dia mais rápido/semana.',
      'Centro de reabilitação. Lesões curam 2 dias mais rápido/semana.',
      'Departamento de elite. Lesões curam 3 dias mais rápido/semana.',
    ],
    costs: [400, 1200, 2500],
  },
  {
    key: 'youth',
    name: 'Academia de Base',
    icon: <TrendingUp className="w-5 h-5 text-yellow-400" />,
    description: 'Melhora o potencial dos jovens revelados pela base do clube.',
    levelDescriptions: [
      'Escolinha básica. Jovens com potencial padrão (55–70 OVR).',
      'Academia estruturada. Jovens com potencial melhorado (60–75 OVR).',
      'Centro de excelência. Jovens de alta qualidade (65–80 OVR).',
      'Academia de elite. Revelações excepcionais (70–85 OVR).',
    ],
    costs: [600, 2000, 4000],
  },
];

export default function InfrastructurePage() {
  const save = useGameStore((s) => s.save);
  const userTeam = useGameStore((s) => s.getUserTeam());
  const upgradeInfrastructure = useGameStore((s) => s.upgradeInfrastructure);

  if (!save || !userTeam) return null;

  const infra = save.infrastructure ?? { training: 0, medical: 0, youth: 0 };

  return (
    <div className="space-y-4">
      <div className="panel p-5">
        <div className="text-xs uppercase tracking-wider text-white/50">Clube</div>
        <h2 className="display-font text-3xl">Infraestrutura</h2>
        <div className="text-sm text-white/60">{userTeam.name} · Saldo: R$ {(userTeam.budget / 1000).toFixed(1)}M</div>
      </div>

      {FACILITIES.map((fac) => {
        const level = infra[fac.key] as 0 | 1 | 2 | 3;
        const isMax = level >= 3;
        const nextCost: number | null = isMax || level >= fac.costs.length ? null : (fac.costs[level as 0 | 1 | 2] ?? null);
        const canAfford = nextCost !== null && userTeam.budget >= nextCost;

        return (
          <div key={fac.key} className="panel p-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                {fac.icon}
                <div>
                  <h3 className="font-semibold">{fac.name}</h3>
                  <p className="text-xs text-white/50 mt-0.5">{fac.description}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <div className="flex gap-1">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`w-5 h-5 rounded flex items-center justify-center ${
                        i <= level ? 'bg-pitch-500 text-white' : 'bg-white/10 text-white/20'
                      }`}
                    >
                      {i <= level ? <CheckCircle className="w-3 h-3" /> : <span className="text-xs">{i}</span>}
                    </div>
                  ))}
                </div>
                <span className="text-xs text-white/40">Nível {level}/3</span>
              </div>
            </div>

            {/* Descrições por nível */}
            <div className="space-y-1.5 mb-4">
              {fac.levelDescriptions.map((desc, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-2 text-xs rounded px-2 py-1.5 ${
                    i === level
                      ? 'bg-pitch-500/20 border border-pitch-500/40 text-white'
                      : i < level
                      ? 'text-white/30 line-through'
                      : 'text-white/50'
                  }`}
                >
                  <span className={`font-bold shrink-0 ${i === level ? 'text-pitch-400' : 'text-white/20'}`}>
                    {i === 0 ? '0' : i}
                  </span>
                  {desc}
                </div>
              ))}
            </div>

            {/* Botão de upgrade */}
            {isMax ? (
              <div className="flex items-center gap-2 text-sm text-gold-400 font-semibold">
                <CheckCircle className="w-4 h-4" /> Nível máximo atingido
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="text-sm text-white/60">
                  Melhorar para nível {level + 1}:{' '}
                  <span className={canAfford ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>
                    R$ {(((nextCost as number) ?? 0) / 1000).toFixed(1)}M
                  </span>
                </div>
                <button
                  onClick={() => upgradeInfrastructure(fac.key)}
                  disabled={!canAfford}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    canAfford
                      ? 'bg-pitch-500 hover:bg-pitch-600 text-white'
                      : 'bg-white/5 text-white/20 cursor-not-allowed'
                  }`}
                >
                  {canAfford ? 'Melhorar' : <><Lock className="w-3 h-3" /> Sem budget</>}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
