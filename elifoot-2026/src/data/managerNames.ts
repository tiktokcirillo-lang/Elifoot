import { nanoid } from 'nanoid';
import type { AiManager, SaveGame, Team } from '@/types';
import { createRng } from '@/utils/random';

const FIRST_NAMES = [
  'Abel', 'Artur', 'Cláudio', 'Cristóvão', 'Dorival', 'Enderson', 'Fábio',
  'Fernando', 'Guilherme', 'Hélio', 'Jair', 'Jorge', 'Luís', 'Marcelo',
  'Mano', 'Milton', 'Paulo', 'Pedro', 'Rafael', 'Renato', 'Ricardo', 'Roberto',
  'Roger', 'Rogério', 'Sérgio', 'Tite', 'Vagner', 'Vanderlei', 'Zé',
  'Carlos', 'Antonio', 'Maurício', 'André', 'Alexandre', 'Leandro',
];

const LAST_NAMES = [
  'Alves', 'Araújo', 'Barbosa', 'Barroca', 'Borges', 'Carille', 'Castro',
  'Cunha', 'Diniz', 'Ferreira', 'Gomes', 'Grossi', 'Lima', 'Lourenço',
  'Maldonado', 'Mancini', 'Moreira', 'Neves', 'Oliveira', 'Pereira',
  'Pinheiro', 'Ramagem', 'Ribeiro', 'Sampaoli', 'Santos', 'Seabra',
  'Silva', 'Soares', 'Souza', 'Teixeira', 'Torres', 'Vieira', 'Zanetti',
  'Ceni', 'Gaúcho', 'Felipão', 'Luxemburgo', 'Pioli', 'Ancelotti',
];

function pickName(rng: () => number): string {
  const first = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)];
  const last  = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)];
  return `${first} ${last}`;
}

export function generateAiManagers(teams: Team[], season: number): AiManager[] {
  return teams
    .filter((t) => !t.isUserControlled)
    .map((team, idx) => {
      const rng = createRng(season * 10000 + idx + 1);
      const startRep = Math.floor(rng() * 2000);
      const startTitles = Math.floor(rng() * 3);
      return {
        id: nanoid(8),
        teamId: team.id,
        teamName: team.name,
        name: pickName(rng),
        reputation: startRep,
        titles: startTitles,
        seasons: 1,
      } satisfies AiManager;
    });
}

// Rep score for an AI team based on where they finished in a round-robin
function repDeltaForPosition(pos: number, totalTeams: number): number {
  const ratio = pos / totalTeams;
  if (ratio <= 0.1) return 600;   // top 10% — título ou muito perto
  if (ratio <= 0.25) return 300;
  if (ratio <= 0.5)  return 100;
  if (ratio <= 0.75) return 0;
  return -150;                    // bottom 25%
}

export function updateAiManagersAfterSeason(save: SaveGame): void {
  if (!save.aiManagers || save.aiManagers.length === 0) return;

  const roundRobins = save.competitions.filter((c) => c.format === 'round_robin');

  for (const mgr of save.aiManagers) {
    mgr.seasons += 1;
    let repDelta = 0;
    let titled = false;

    for (const comp of roundRobins) {
      const standings = comp.standings.filter((s) => s.teamId === mgr.teamId);
      if (standings.length === 0) continue;

      // Determine position in this competition
      const allSorted = [...comp.standings].sort((a, b) => {
        const ptsDiff = b.points - a.points;
        if (ptsDiff !== 0) return ptsDiff;
        return (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst);
      });
      const pos = allSorted.findIndex((s) => s.teamId === mgr.teamId) + 1;
      if (pos === 0) continue;

      const delta = repDeltaForPosition(pos, allSorted.length);
      repDelta += delta;

      // Champion?
      if (comp.championId === mgr.teamId) {
        titled = true;
        repDelta += 400;
      }
    }

    // Knockout titles
    for (const comp of save.competitions) {
      if (comp.format !== 'round_robin' && comp.championId === mgr.teamId) {
        titled = true;
        repDelta += 600;
      }
    }

    if (titled) mgr.titles += 1;
    mgr.reputation = Math.min(10000, Math.max(0, mgr.reputation + repDelta));

    // Update team name if team changed name (shouldn't happen, but safety)
    const team = save.teams.find((t) => t.id === mgr.teamId);
    if (team) mgr.teamName = team.name;
  }

  // Occasionally shuffle managers between teams (rare — 10% chance per off-season)
  const rng = createRng(save.season * 9999 + 7);
  if (rng() < 0.10 && save.aiManagers.length > 1) {
    const a = Math.floor(rng() * save.aiManagers.length);
    let b = Math.floor(rng() * save.aiManagers.length);
    if (b === a) b = (a + 1) % save.aiManagers.length;
    const tmpTeam = save.aiManagers[a].teamId;
    const tmpName = save.aiManagers[a].teamName;
    save.aiManagers[a].teamId = save.aiManagers[b].teamId;
    save.aiManagers[a].teamName = save.aiManagers[b].teamName;
    save.aiManagers[b].teamId = tmpTeam;
    save.aiManagers[b].teamName = tmpName;
  }
}

// Sorted list of top managers (AI + user combined) for display
export function allManagerRanking(save: SaveGame): Array<{
  name: string; teamName: string; reputation: number; titles: number; seasons: number; isUser: boolean;
}> {
  const list = (save.aiManagers ?? []).map((m) => ({
    name: m.name,
    teamName: m.teamName,
    reputation: m.reputation,
    titles: m.titles,
    seasons: m.seasons,
    isUser: false,
  }));

  const userTeam = save.teams.find((t) => t.id === save.controlledTeamId);
  list.push({
    name: save.managerName,
    teamName: userTeam?.name ?? '—',
    reputation: save.managerReputation ?? 0,
    titles: save.seasonRecords?.filter((r) => r.titles && r.titles.length > 0).length ?? 0,
    seasons: (save.season - 2026) + 1,
    isUser: true,
  });

  return list.sort((a, b) => b.reputation - a.reputation);
}
