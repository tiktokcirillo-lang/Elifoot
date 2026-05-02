import type { ManagerSkillDef } from '@/types';

export const MANAGER_SKILLS: ManagerSkillDef[] = [
  {
    id: 'elite_recruiter',
    name: 'Olheiro de Elite',
    description: 'Jogadores no mercado aparecem com até 10% de desconto no valor pedido.',
    category: 'scouting',
    cost: 500,
  },
  {
    id: 'scout_network',
    name: 'Rede de Scouts',
    description: 'O mercado de transferências exibe 5 jogadores extras para análise.',
    category: 'scouting',
    cost: 400,
  },
  {
    id: 'master_motivator',
    name: 'Motivador Nato',
    description: 'Jogadores mantêm moral 10 pontos acima do normal ao longo da temporada.',
    category: 'motivation',
    cost: 400,
  },
  {
    id: 'iron_mentality',
    name: 'Mentalidade de Ferro',
    description: 'O desgaste físico dos jogadores é 15% mais lento durante a temporada.',
    category: 'motivation',
    cost: 700,
  },
  {
    id: 'tactical_mastermind',
    name: 'Gênio Tático',
    description: 'Desbloqueia as formações 3-4-3 e 4-1-4-1 no menu de táticas.',
    category: 'tactics',
    cost: 800,
  },
  {
    id: 'youth_developer',
    name: 'Formador de Talentos',
    description: 'Jogadores da base recebem +2 OVR bônus ao serem promovidos ao elenco.',
    category: 'youth',
    cost: 600,
  },
  {
    id: 'financial_wizard',
    name: 'Mago das Finanças',
    description: 'Os salários do elenco são reduzidos em 5% no início de cada temporada.',
    category: 'finance',
    cost: 400,
  },
  {
    id: 'board_champion',
    name: 'Querido da Diretoria',
    description: 'A confiança da diretoria começa cada temporada 10 pontos mais alta.',
    category: 'finance',
    cost: 600,
  },
];

export function getSkill(id: string): ManagerSkillDef | undefined {
  return MANAGER_SKILLS.find((s) => s.id === id);
}

export function hasSkill(unlockedSkills: string[], id: string): boolean {
  return unlockedSkills.includes(id);
}

// Retorna o tier de reputação atual com label e estrelas
export function reputationTier(rep: number): { label: string; stars: number; next: number } {
  if (rep < 1000) return { label: 'Regional', stars: 1, next: 1000 };
  if (rep < 2500) return { label: 'Nacional', stars: 2, next: 2500 };
  if (rep < 5000) return { label: 'Continental', stars: 3, next: 5000 };
  if (rep < 7500) return { label: 'Elite', stars: 4, next: 7500 };
  return { label: 'Classe Mundial', stars: 5, next: 10000 };
}
