export interface SponsorBrand {
  id: string;
  name: string;
  tier: 'elite' | 'top' | 'mid' | 'low';
  maxDealPerSeason: number; // em milhares
  minReputation: number;
}

export const SPONSOR_BRANDS: SponsorBrand[] = [
  { id: 'nike',        name: 'Nike',        tier: 'elite', maxDealPerSeason: 120_000, minReputation: 75 },
  { id: 'adidas',      name: 'Adidas',      tier: 'elite', maxDealPerSeason: 100_000, minReputation: 70 },
  { id: 'puma',        name: 'Puma',        tier: 'top',   maxDealPerSeason:  65_000, minReputation: 55 },
  { id: 'new_balance', name: 'New Balance', tier: 'top',   maxDealPerSeason:  55_000, minReputation: 50 },
  { id: 'umbro',       name: 'Umbro',       tier: 'mid',   maxDealPerSeason:  30_000, minReputation: 35 },
  { id: 'kappa',       name: 'Kappa',       tier: 'mid',   maxDealPerSeason:  25_000, minReputation: 30 },
  { id: 'penalty',     name: 'Penalty',     tier: 'low',   maxDealPerSeason:  15_000, minReputation: 15 },
  { id: 'topper',      name: 'Topper',      tier: 'low',   maxDealPerSeason:  10_000, minReputation:  0 },
];
