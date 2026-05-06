import type { Team } from '@/types';
import { generateSquad, autoPickStartingEleven } from '@/engine/playerGenerator';

interface SerieBSeed {
  id: string;
  name: string;
  shortName: string;
  city: string;
  tier: Team['tier'];
  reputation: number;
  budget: number;
  primaryColor: string;
  secondaryColor: string;
}

const SERIE_B_SEEDS: SerieBSeed[] = [
  { id: 'b_ame', name: 'América Mineiro',       shortName: 'AME', city: 'Belo Horizonte', tier: 'mid', reputation: 52, budget: 14000, primaryColor: '#005F30', secondaryColor: '#FFFFFF' },
  { id: 'b_spo', name: 'Sport Recife',           shortName: 'SPO', city: 'Recife',         tier: 'mid', reputation: 50, budget: 12000, primaryColor: '#BB0000', secondaryColor: '#000000' },
  { id: 'b_cot', name: 'Coritiba',               shortName: 'COT', city: 'Curitiba',       tier: 'mid', reputation: 51, budget: 13000, primaryColor: '#006400', secondaryColor: '#FFFFFF' },
  { id: 'b_crb', name: 'CRB',                    shortName: 'CRB', city: 'Maceió',         tier: 'low', reputation: 38, budget: 7000,  primaryColor: '#003399', secondaryColor: '#CC0000' },
  { id: 'b_chp', name: 'Chapecoense',            shortName: 'CHP', city: 'Chapecó',        tier: 'low', reputation: 40, budget: 8000,  primaryColor: '#007A4D', secondaryColor: '#FFFFFF' },
  { id: 'b_pay', name: 'Paysandu',               shortName: 'PAY', city: 'Belém',          tier: 'low', reputation: 42, budget: 8500,  primaryColor: '#003099', secondaryColor: '#FFFFFF' },
  { id: 'b_opf', name: 'Operário Ferroviário',   shortName: 'OPF', city: 'Ponta Grossa',   tier: 'low', reputation: 35, budget: 6500,  primaryColor: '#000000', secondaryColor: '#FFFFFF' },
  { id: 'b_vln', name: 'Vila Nova',              shortName: 'VLN', city: 'Goiânia',        tier: 'low', reputation: 36, budget: 7000,  primaryColor: '#CC0000', secondaryColor: '#000000' },
  { id: 'b_brq', name: 'Brusque',                shortName: 'BRQ', city: 'Brusque',        tier: 'low', reputation: 30, budget: 5500,  primaryColor: '#003399', secondaryColor: '#CC0000' },
  { id: 'b_fig', name: 'Figueirense',            shortName: 'FIG', city: 'Florianópolis',  tier: 'low', reputation: 38, budget: 7500,  primaryColor: '#000000', secondaryColor: '#FFFFFF' },
  { id: 'b_scr', name: 'Santa Cruz',             shortName: 'SCR', city: 'Recife',         tier: 'low', reputation: 37, budget: 7000,  primaryColor: '#CC0000', secondaryColor: '#000000' },
  { id: 'b_sco', name: 'Sampaio Corrêa',         shortName: 'SCO', city: 'São Luís',       tier: 'low', reputation: 32, budget: 6000,  primaryColor: '#003399', secondaryColor: '#CC0000' },
  { id: 'b_abc', name: 'ABC',                    shortName: 'ABC', city: 'Natal',          tier: 'low', reputation: 33, budget: 6000,  primaryColor: '#CC0000', secondaryColor: '#000000' },
  { id: 'b_fer', name: 'Ferroviária',            shortName: 'FER', city: 'Araraquara',     tier: 'low', reputation: 31, budget: 5500,  primaryColor: '#CC0000', secondaryColor: '#FFFFFF' },
  { id: 'b_bts', name: 'Botafogo SP',            shortName: 'BTS', city: 'Ribeirão Preto', tier: 'low', reputation: 39, budget: 8000,  primaryColor: '#000000', secondaryColor: '#FFFFFF' },
  { id: 'b_goi', name: 'Goiás',                  shortName: 'GOI', city: 'Goiânia',        tier: 'mid', reputation: 48, budget: 11000, primaryColor: '#007A4D', secondaryColor: '#FFFFFF' },
  { id: 'b_tom', name: 'Tombense',               shortName: 'TOM', city: 'Tombos',         tier: 'low', reputation: 28, budget: 5000,  primaryColor: '#CC0000', secondaryColor: '#000000' },
  { id: 'b_lon', name: 'Londrina',               shortName: 'LON', city: 'Londrina',       tier: 'low', reputation: 34, budget: 6500,  primaryColor: '#CC0000', secondaryColor: '#FFFFFF' },
  { id: 'b_rem', name: 'Remo',                   shortName: 'REM', city: 'Belém',          tier: 'low', reputation: 36, budget: 7000,  primaryColor: '#003399', secondaryColor: '#FFFFFF' },
  { id: 'b_mac', name: 'Maringá FC',             shortName: 'MAR', city: 'Maringá',        tier: 'low', reputation: 27, budget: 5000,  primaryColor: '#003399', secondaryColor: '#CC0000' },
];

export function buildSerieBTeams(): Team[] {
  return SERIE_B_SEEDS.map((seed, i) => {
    const squad = generateSquad(seed.tier, 9000 + i * 37);
    // Add nationality to all players
    squad.forEach((p) => { if (!p.nationality) p.nationality = 'BR'; });
    const { starting, bench } = autoPickStartingEleven(squad, '4-4-2');
    return {
      id: seed.id,
      name: seed.name,
      shortName: seed.shortName,
      city: seed.city,
      country: 'BR',
      primaryColor: seed.primaryColor,
      secondaryColor: seed.secondaryColor,
      tier: seed.tier,
      reputation: seed.reputation,
      budget: seed.budget,
      squad,
      formation: '4-4-2' as const,
      starting11: starting,
      bench,
      isUserControlled: false,
      division: 'B' as const,
    };
  });
}
