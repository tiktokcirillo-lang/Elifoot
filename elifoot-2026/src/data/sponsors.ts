export type SponsorSlot = 'master' | 'kit' | 'secondary';

export interface SponsorBonusDef {
  condition: 'title' | 'libertadores' | 'top3_league' | 'fan_high';
  amount: number; // em milhares (adicional por temporada quando atingido)
  description: string;
}

export interface SponsorBrand {
  id: string;
  name: string;
  slot: SponsorSlot;
  category: string; // label de exibição
  tier: 'elite' | 'top' | 'mid' | 'low';
  maxDealPerSeason: number; // em milhares
  minReputation: number;
  color: string; // cor da marca para visual
  bonusPool?: SponsorBonusDef[]; // bônus que este brand pode incluir no contrato
}

// ── MASTER sponsors (frente da camisa — maior valor) ──────────────────────────
const MASTER_BRANDS: SponsorBrand[] = [
  {
    id: 'itau',       name: 'Itaú',          slot: 'master', category: 'Banco',
    tier: 'elite',  maxDealPerSeason: 140_000, minReputation: 78, color: '#f96400',
    bonusPool: [
      { condition: 'title',       amount: 20_000, description: '+R$ 20M por título' },
      { condition: 'libertadores',amount: 12_000, description: '+R$ 12M por Libertadores' },
    ],
  },
  {
    id: 'bradesco',   name: 'Bradesco',       slot: 'master', category: 'Banco',
    tier: 'elite',  maxDealPerSeason: 120_000, minReputation: 75, color: '#cc0000',
    bonusPool: [
      { condition: 'title',       amount: 15_000, description: '+R$ 15M por título' },
      { condition: 'top3_league', amount:  8_000, description: '+R$ 8M por top 3' },
    ],
  },
  {
    id: 'bb',         name: 'Banco do Brasil',slot: 'master', category: 'Banco',
    tier: 'elite',  maxDealPerSeason: 110_000, minReputation: 72, color: '#fcb900',
    bonusPool: [
      { condition: 'libertadores',amount: 10_000, description: '+R$ 10M por Libertadores' },
      { condition: 'fan_high',    amount:  5_000, description: '+R$ 5M por engajamento alto' },
    ],
  },
  {
    id: 'santander',  name: 'Santander',      slot: 'master', category: 'Banco',
    tier: 'top',    maxDealPerSeason:  90_000, minReputation: 68, color: '#ec0000',
    bonusPool: [
      { condition: 'title',       amount: 12_000, description: '+R$ 12M por título' },
    ],
  },
  {
    id: 'claro',      name: 'Claro',          slot: 'master', category: 'Telecom',
    tier: 'elite',  maxDealPerSeason: 100_000, minReputation: 73, color: '#e4002b',
    bonusPool: [
      { condition: 'title',       amount: 15_000, description: '+R$ 15M por título' },
      { condition: 'fan_high',    amount:  6_000, description: '+R$ 6M por torcida engajada' },
    ],
  },
  {
    id: 'tim',        name: 'TIM',            slot: 'master', category: 'Telecom',
    tier: 'top',    maxDealPerSeason:  80_000, minReputation: 65, color: '#003087',
    bonusPool: [
      { condition: 'top3_league', amount:  8_000, description: '+R$ 8M por top 3' },
    ],
  },
  {
    id: 'vivo',       name: 'Vivo',           slot: 'master', category: 'Telecom',
    tier: 'top',    maxDealPerSeason:  75_000, minReputation: 62, color: '#660099',
    bonusPool: [
      { condition: 'libertadores',amount:  8_000, description: '+R$ 8M por Libertadores' },
    ],
  },
  {
    id: 'betano',     name: 'Betano',         slot: 'master', category: 'Apostas',
    tier: 'top',    maxDealPerSeason:  85_000, minReputation: 60, color: '#ffcf00',
    bonusPool: [
      { condition: 'title',       amount: 10_000, description: '+R$ 10M por título' },
      { condition: 'top3_league', amount:  5_000, description: '+R$ 5M por top 3' },
    ],
  },
  {
    id: 'bet365',     name: 'Bet365',         slot: 'master', category: 'Apostas',
    tier: 'top',    maxDealPerSeason:  80_000, minReputation: 58, color: '#047857',
    bonusPool: [
      { condition: 'libertadores',amount:  8_000, description: '+R$ 8M por Libertadores' },
    ],
  },
  {
    id: 'sportingbet',name: 'Sportingbet',    slot: 'master', category: 'Apostas',
    tier: 'mid',    maxDealPerSeason:  45_000, minReputation: 42, color: '#1e3a5f',
    bonusPool: [
      { condition: 'title',       amount:  5_000, description: '+R$ 5M por título' },
    ],
  },
  {
    id: 'latam',      name: 'LATAM',          slot: 'master', category: 'Aérea',
    tier: 'top',    maxDealPerSeason:  70_000, minReputation: 65, color: '#d91c38',
    bonusPool: [
      { condition: 'libertadores',amount:  8_000, description: '+R$ 8M por Libertadores' },
    ],
  },
  {
    id: 'caixa',      name: 'Caixa',          slot: 'master', category: 'Banco',
    tier: 'mid',    maxDealPerSeason:  40_000, minReputation: 40, color: '#0068b4',
    bonusPool: [
      { condition: 'fan_high',    amount:  4_000, description: '+R$ 4M por torcida engajada' },
    ],
  },
  {
    id: 'carrefour',  name: 'Carrefour',      slot: 'master', category: 'Varejo',
    tier: 'mid',    maxDealPerSeason:  35_000, minReputation: 38, color: '#007dc6',
    bonusPool: [],
  },
  {
    id: 'lojas_amer', name: 'Lojas Americanas',slot: 'master', category: 'Varejo',
    tier: 'low',    maxDealPerSeason:  18_000, minReputation: 20, color: '#cc0000',
    bonusPool: [],
  },
  {
    id: 'mercado_livre',name: 'Mercado Livre',slot: 'master', category: 'E-commerce',
    tier: 'top',    maxDealPerSeason:  60_000, minReputation: 58, color: '#ffe600',
    bonusPool: [
      { condition: 'title',       amount:  8_000, description: '+R$ 8M por título' },
    ],
  },
];

// ── KIT MANUFACTURERS (fornecedor de material esportivo) ──────────────────────
const KIT_BRANDS: SponsorBrand[] = [
  {
    id: 'nike',       name: 'Nike',           slot: 'kit', category: 'Material esportivo',
    tier: 'elite',  maxDealPerSeason: 80_000, minReputation: 78, color: '#000000',
    bonusPool: [
      { condition: 'title',       amount: 10_000, description: '+R$ 10M por título' },
      { condition: 'fan_high',    amount:  5_000, description: '+R$ 5M por torcida engajada' },
    ],
  },
  {
    id: 'adidas',     name: 'Adidas',         slot: 'kit', category: 'Material esportivo',
    tier: 'elite',  maxDealPerSeason: 70_000, minReputation: 73, color: '#000000',
    bonusPool: [
      { condition: 'title',       amount:  8_000, description: '+R$ 8M por título' },
      { condition: 'libertadores',amount:  6_000, description: '+R$ 6M por Libertadores' },
    ],
  },
  {
    id: 'puma',       name: 'Puma',           slot: 'kit', category: 'Material esportivo',
    tier: 'top',    maxDealPerSeason: 45_000, minReputation: 58, color: '#d40f14',
    bonusPool: [
      { condition: 'top3_league', amount:  5_000, description: '+R$ 5M por top 3' },
    ],
  },
  {
    id: 'new_balance',name: 'New Balance',    slot: 'kit', category: 'Material esportivo',
    tier: 'top',    maxDealPerSeason: 38_000, minReputation: 52, color: '#e3001b',
    bonusPool: [
      { condition: 'fan_high',    amount:  3_000, description: '+R$ 3M por torcida engajada' },
    ],
  },
  {
    id: 'umbro',      name: 'Umbro',          slot: 'kit', category: 'Material esportivo',
    tier: 'mid',    maxDealPerSeason: 20_000, minReputation: 35, color: '#004b8d',
    bonusPool: [],
  },
  {
    id: 'kappa',      name: 'Kappa',          slot: 'kit', category: 'Material esportivo',
    tier: 'mid',    maxDealPerSeason: 16_000, minReputation: 28, color: '#cc0000',
    bonusPool: [],
  },
  {
    id: 'penalty',    name: 'Penalty',        slot: 'kit', category: 'Material esportivo',
    tier: 'low',    maxDealPerSeason:  9_000, minReputation: 15, color: '#0000cc',
    bonusPool: [],
  },
  {
    id: 'topper',     name: 'Topper',         slot: 'kit', category: 'Material esportivo',
    tier: 'low',    maxDealPerSeason:  6_000, minReputation:  0, color: '#333333',
    bonusPool: [],
  },
  {
    id: 'athleta',    name: 'Athleta',        slot: 'kit', category: 'Material esportivo',
    tier: 'low',    maxDealPerSeason:  7_500, minReputation:  8, color: '#1a1a2e',
    bonusPool: [],
  },
];

// ── SECONDARY sponsors (manga, placa de treino, etc.) ─────────────────────────
const SECONDARY_BRANDS: SponsorBrand[] = [
  {
    id: 'redbull',    name: 'Red Bull',       slot: 'secondary', category: 'Energy drink',
    tier: 'top',    maxDealPerSeason: 25_000, minReputation: 60, color: '#cc1e10',
    bonusPool: [
      { condition: 'title',       amount:  4_000, description: '+R$ 4M por título' },
    ],
  },
  {
    id: 'heineken',   name: 'Heineken',       slot: 'secondary', category: 'Cerveja',
    tier: 'top',    maxDealPerSeason: 22_000, minReputation: 55, color: '#008200',
    bonusPool: [
      { condition: 'libertadores',amount:  4_000, description: '+R$ 4M por Libertadores' },
    ],
  },
  {
    id: 'brahma',     name: 'Brahma',         slot: 'secondary', category: 'Cerveja',
    tier: 'mid',    maxDealPerSeason: 14_000, minReputation: 35, color: '#ff6600',
    bonusPool: [
      { condition: 'fan_high',    amount:  2_000, description: '+R$ 2M por torcida engajada' },
    ],
  },
  {
    id: 'budweiser',  name: 'Budweiser',      slot: 'secondary', category: 'Cerveja',
    tier: 'mid',    maxDealPerSeason: 16_000, minReputation: 42, color: '#c8102e',
    bonusPool: [],
  },
  {
    id: 'toyota',     name: 'Toyota',         slot: 'secondary', category: 'Automóvel',
    tier: 'top',    maxDealPerSeason: 20_000, minReputation: 50, color: '#eb0a1e',
    bonusPool: [
      { condition: 'top3_league', amount:  3_000, description: '+R$ 3M por top 3' },
    ],
  },
  {
    id: 'vw',         name: 'Volkswagen',     slot: 'secondary', category: 'Automóvel',
    tier: 'mid',    maxDealPerSeason: 15_000, minReputation: 38, color: '#001e50',
    bonusPool: [],
  },
  {
    id: 'fiat',       name: 'Fiat',           slot: 'secondary', category: 'Automóvel',
    tier: 'mid',    maxDealPerSeason: 12_000, minReputation: 30, color: '#b7000e',
    bonusPool: [],
  },
  {
    id: 'samsung',    name: 'Samsung',        slot: 'secondary', category: 'Tecnologia',
    tier: 'top',    maxDealPerSeason: 18_000, minReputation: 52, color: '#1428a0',
    bonusPool: [
      { condition: 'title',       amount:  3_000, description: '+R$ 3M por título' },
    ],
  },
  {
    id: 'lg',         name: 'LG',             slot: 'secondary', category: 'Tecnologia',
    tier: 'mid',    maxDealPerSeason: 12_000, minReputation: 35, color: '#a50034',
    bonusPool: [],
  },
  {
    id: 'porto_seg',  name: 'Porto Seguro',   slot: 'secondary', category: 'Seguros',
    tier: 'mid',    maxDealPerSeason: 13_000, minReputation: 32, color: '#003399',
    bonusPool: [],
  },
  {
    id: 'monster',    name: 'Monster Energy', slot: 'secondary', category: 'Energy drink',
    tier: 'mid',    maxDealPerSeason: 10_000, minReputation: 28, color: '#3d9900',
    bonusPool: [],
  },
  {
    id: 'chevrolet',  name: 'Chevrolet',      slot: 'secondary', category: 'Automóvel',
    tier: 'low',    maxDealPerSeason:  8_000, minReputation: 15, color: '#f5c518',
    bonusPool: [],
  },
];

export const SPONSOR_BRANDS: SponsorBrand[] = [
  ...MASTER_BRANDS,
  ...KIT_BRANDS,
  ...SECONDARY_BRANDS,
];

export function brandsForSlot(slot: SponsorSlot): SponsorBrand[] {
  return SPONSOR_BRANDS.filter((b) => b.slot === slot);
}

export const SLOT_LABELS: Record<SponsorSlot, string> = {
  master:    'Patrocinador Master',
  kit:       'Fornecedor de Material',
  secondary: 'Patrocinador Secundário',
};

export const SLOT_COLORS: Record<SponsorSlot, string> = {
  master:    'text-gold-400 border-gold-500/30 bg-gold-500/5',
  kit:       'text-blue-400 border-blue-500/30 bg-blue-500/5',
  secondary: 'text-purple-400 border-purple-500/30 bg-purple-500/5',
};
