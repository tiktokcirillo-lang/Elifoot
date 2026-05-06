export type RivalryTier = 'classico' | 'derby';

export interface Rivalry {
  rivalId: string;
  name: string;
  tier: RivalryTier;
}

export const RIVALRIES: Record<string, Rivalry[]> = {
  // Rio de Janeiro
  fla: [
    { rivalId: 'flu', name: 'Fla-Flu', tier: 'classico' },
    { rivalId: 'vas', name: 'Clássico dos Milhões', tier: 'classico' },
    { rivalId: 'bot', name: 'Clássico Vovô', tier: 'derby' },
  ],
  flu: [
    { rivalId: 'fla', name: 'Fla-Flu', tier: 'classico' },
    { rivalId: 'vas', name: 'Clássico dos Gigantes', tier: 'classico' },
    { rivalId: 'bot', name: 'Botafogo × Fluminense', tier: 'derby' },
  ],
  vas: [
    { rivalId: 'fla', name: 'Clássico dos Milhões', tier: 'classico' },
    { rivalId: 'flu', name: 'Clássico dos Gigantes', tier: 'classico' },
    { rivalId: 'bot', name: 'Clássico da Colina', tier: 'derby' },
  ],
  bot: [
    { rivalId: 'fla', name: 'Clássico Vovô', tier: 'derby' },
    { rivalId: 'flu', name: 'Botafogo × Fluminense', tier: 'derby' },
    { rivalId: 'vas', name: 'Clássico da Colina', tier: 'derby' },
  ],
  // São Paulo
  pal: [
    { rivalId: 'cor', name: 'Dérbi Paulista', tier: 'classico' },
    { rivalId: 'sao', name: 'Choque-Rei', tier: 'classico' },
    { rivalId: 'rbb', name: 'Clássico Alviverde', tier: 'derby' },
  ],
  cor: [
    { rivalId: 'pal', name: 'Dérbi Paulista', tier: 'classico' },
    { rivalId: 'sao', name: 'Majestoso', tier: 'classico' },
    { rivalId: 'rbb', name: 'Dérbi do Estado', tier: 'derby' },
  ],
  sao: [
    { rivalId: 'pal', name: 'Choque-Rei', tier: 'classico' },
    { rivalId: 'cor', name: 'Majestoso', tier: 'classico' },
    { rivalId: 'rbb', name: 'Clássico Tricolor', tier: 'derby' },
  ],
  rbb: [
    { rivalId: 'pal', name: 'Clássico Alviverde', tier: 'derby' },
    { rivalId: 'cor', name: 'Dérbi do Estado', tier: 'derby' },
    { rivalId: 'sao', name: 'Clássico Tricolor', tier: 'derby' },
  ],
  // Rio Grande do Sul
  gre: [{ rivalId: 'int', name: 'Grenal', tier: 'classico' }],
  int: [{ rivalId: 'gre', name: 'Grenal', tier: 'classico' }],
  // Minas Gerais
  atm: [{ rivalId: 'cru', name: 'Superclássico das Gerais', tier: 'classico' }],
  cru: [{ rivalId: 'atm', name: 'Superclássico das Gerais', tier: 'classico' }],
  // Nordeste
  bah: [{ rivalId: 'for', name: 'Clássico do Nordeste', tier: 'derby' }],
  for: [{ rivalId: 'bah', name: 'Clássico do Nordeste', tier: 'derby' }],
};

export function getRivalry(teamId: string, opponentId: string): Rivalry | null {
  return RIVALRIES[teamId]?.find((r) => r.rivalId === opponentId) ?? null;
}

export function isDerby(teamAId: string, teamBId: string): boolean {
  return !!getRivalry(teamAId, teamBId);
}
