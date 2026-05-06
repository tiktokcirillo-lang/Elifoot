import { generateSquad, autoPickStartingEleven } from '@/engine/playerGenerator';
import type { Team } from '@/types';

const SERIE_C_CLUBS: {
  id: string; name: string; shortName: string; city: string;
  primaryColor: string; secondaryColor: string;
}[] = [
  { id: 'c_csa',  name: 'CSA',              shortName: 'CSA', city: 'Maceió',          primaryColor: '#003087', secondaryColor: '#FFD700' },
  { id: 'c_nau',  name: 'Náutico',          shortName: 'NAU', city: 'Recife',           primaryColor: '#CC0000', secondaryColor: '#FFFFFF' },
  { id: 'c_bpb',  name: 'Botafogo PB',      shortName: 'BPB', city: 'João Pessoa',     primaryColor: '#000000', secondaryColor: '#FFFFFF' },
  { id: 'c_flo',  name: 'Floresta',         shortName: 'FLO', city: 'Fortaleza',        primaryColor: '#007A33', secondaryColor: '#FFFFFF' },
  { id: 'c_app',  name: 'Aparecidense',     shortName: 'APP', city: 'Aparecida de G.',  primaryColor: '#FF6600', secondaryColor: '#000000' },
  { id: 'c_cax',  name: 'Caxias',           shortName: 'CAX', city: 'Caxias do Sul',    primaryColor: '#FF0000', secondaryColor: '#FFFFFF' },
  { id: 'c_alt',  name: 'Altos',            shortName: 'ALT', city: 'Teresina',         primaryColor: '#0000CC', secondaryColor: '#FFFFFF' },
  { id: 'c_con',  name: 'Confiança',        shortName: 'CON', city: 'Aracaju',          primaryColor: '#003399', secondaryColor: '#FFFFFF' },
  { id: 'c_vrd',  name: 'Volta Redonda',    shortName: 'VRD', city: 'Volta Redonda',    primaryColor: '#CC0000', secondaryColor: '#000000' },
  { id: 'c_ypi',  name: 'Ypiranga',         shortName: 'YPI', city: 'Erechim',          primaryColor: '#CC0000', secondaryColor: '#FFFFFF' },
  { id: 'c_jac',  name: 'Jacuipense',       shortName: 'JAC', city: 'Riachão do J.',    primaryColor: '#007A33', secondaryColor: '#FFD700' },
  { id: 'c_ret',  name: 'Retrô',            shortName: 'RET', city: 'Recife',           primaryColor: '#E87722', secondaryColor: '#FFFFFF' },
  { id: 'c_ita',  name: 'Itabaiana',        shortName: 'ITA', city: 'Itabaiana',        primaryColor: '#003087', secondaryColor: '#FFFFFF' },
  { id: 'c_ana',  name: 'Anapolina',        shortName: 'ANA', city: 'Anápolis',         primaryColor: '#CC0000', secondaryColor: '#000000' },
  { id: 'c_gus',  name: 'Guarany Sobral',   shortName: 'GUS', city: 'Sobral',           primaryColor: '#0000CC', secondaryColor: '#FFFFFF' },
  { id: 'c_prj',  name: 'Portuguesa RJ',    shortName: 'PRJ', city: 'Rio de Janeiro',   primaryColor: '#CC0000', secondaryColor: '#009C3B' },
  { id: 'c_sae',  name: 'Santo André',      shortName: 'SAE', city: 'Santo André',      primaryColor: '#CC0000', secondaryColor: '#FFFFFF' },
  { id: 'c_tre',  name: 'Treze',            shortName: 'TRE', city: 'Campina Grande',   primaryColor: '#CC0000', secondaryColor: '#000000' },
  { id: 'c_bgo',  name: 'Bragantino PA',    shortName: 'BGO', city: 'Bragança',         primaryColor: '#003087', secondaryColor: '#FFFFFF' },
  { id: 'c_sjf',  name: 'São José RS',      shortName: 'SJF', city: 'Porto Alegre',     primaryColor: '#003087', secondaryColor: '#FFD700' },
];

export function buildSerieCTeams(): Team[] {
  return SERIE_C_CLUBS.map((club, i) => {
    const squad = generateSquad('low', 19000 + i * 37);
    squad.forEach((p) => { if (!p.nationality) p.nationality = 'BR'; });
    const { starting, bench } = autoPickStartingEleven(squad, '4-4-2');
    return {
      id: club.id,
      name: club.name,
      shortName: club.shortName,
      city: club.city,
      country: 'Brasil',
      primaryColor: club.primaryColor,
      secondaryColor: club.secondaryColor,
      tier: 'low',
      reputation: 15 + Math.floor((i * 7 + 3) % 25),
      budget: 800 + Math.floor((i * 317 + 100) % 1500),
      squad,
      formation: '4-4-2' as const,
      starting11: starting,
      bench,
      isUserControlled: false,
      division: 'C' as const,
    };
  });
}
