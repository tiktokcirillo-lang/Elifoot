import type { SaveGame, NewsItem } from '@/types';
import { sortStandings } from '@/competitions/brasileirao';
import { getRivalry } from '@/data/rivalries';

type NewsSnippet = Omit<NewsItem, 'id' | 'read' | 'turn'>;

function formString(results: string[]): string {
  return results.map((r) => r === 'W' ? 'V' : r === 'L' ? 'D' : 'E').join('');
}

function countStreak(results: string[], type: string): number {
  let count = 0;
  for (const r of results) {
    if (r === type) count++;
    else break;
  }
  return count;
}

function getLastResults(save: SaveGame, teamId: string, n = 5): string[] {
  const brasileirao = save.competitions.find((c) => c.format === 'round_robin');
  if (!brasileirao) return [];
  return brasileirao.fixtures
    .filter((f) => f.played && f.result && (f.homeTeamId === teamId || f.awayTeamId === teamId))
    .sort((a, b) => b.scheduledTurn - a.scheduledTurn)
    .slice(0, n)
    .map((f) => {
      const isHome = f.homeTeamId === teamId;
      const scored = isHome ? f.result!.homeGoals : f.result!.awayGoals;
      const conceded = isHome ? f.result!.awayGoals : f.result!.homeGoals;
      return scored > conceded ? 'W' : scored < conceded ? 'L' : 'D';
    });
}

// Artilheiro da temporada (Brasileirão)
function getTopScorer(save: SaveGame): { name: string; teamName: string; goals: number } | null {
  const brasileirao = save.competitions.find((c) => c.format === 'round_robin');
  if (!brasileirao) return null;
  let best: { name: string; teamName: string; goals: number } | null = null;
  for (const team of save.teams) {
    if (!brasileirao.teamIds.includes(team.id)) continue;
    for (const p of team.squad) {
      if (!best || p.stats.goals > best.goals) {
        best = { name: p.name, teamName: team.name, goals: p.stats.goals };
      }
    }
  }
  return best && best.goals > 0 ? best : null;
}

export function generateNarrativeNews(save: SaveGame): NewsSnippet[] {
  const items: NewsSnippet[] = [];
  const userTeam = save.teams.find((t) => t.id === save.controlledTeamId);
  if (!userTeam) return items;

  const brasileirao = save.competitions.find((c) => c.format === 'round_robin');
  if (!brasileirao) return items;

  const standings = sortStandings(brasileirao.standings, save.teams, brasileirao.id, brasileirao.fixtures);
  const userPos = standings.findIndex((s) => s.teamId === save.controlledTeamId) + 1;
  const userStanding = standings.find((s) => s.teamId === save.controlledTeamId);
  const played = userStanding?.played ?? 0;

  if (played === 0) return items;

  const results = getLastResults(save, save.controlledTeamId, 5);
  const form = formString(results);
  const winStreak = countStreak(results, 'W');
  const loseStreak = countStreak(results, 'L');

  // Sequência de vitórias
  if (winStreak >= 4) {
    items.push({
      type: 'achievement',
      title: `🔥 ${winStreak} vitórias seguidas — ${userTeam.shortName} em chamas!`,
      body: `Forma: ${form}. A torcida está empolgada com a série invicta do ${userTeam.name}.`,
    });
  } else if (winStreak === 3) {
    items.push({
      type: 'achievement',
      title: `${userTeam.shortName} encadeia 3 vitórias`,
      body: `Boa fase! Forma recente: ${form}. Time cresce na tabela.`,
    });
  }

  // Sequência de derrotas
  if (loseStreak >= 4) {
    items.push({
      type: 'general',
      title: `⚠️ Crise em ${userTeam.shortName}: ${loseStreak} derrotas consecutivas`,
      body: `Forma: ${form}. Imprensa e torcida pedem explicações. A pressão aumenta no ${userTeam.name}.`,
    });
  } else if (loseStreak === 3) {
    items.push({
      type: 'general',
      title: `${userTeam.shortName} perde pela 3ª vez seguida`,
      body: `Forma recente: ${form}. Necessário reencontrar o caminho das vitórias.`,
    });
  }

  // Briga pelo título (após 20 rodadas)
  if (played >= 20 && userPos <= 3) {
    const leader = standings[0];
    const leaderTeam = save.teams.find((t) => t.id === leader.teamId);
    const gap = leader.points - (userStanding?.points ?? 0);
    if (gap <= 5) {
      items.push({
        type: 'achievement',
        title: `${userTeam.shortName} no G3 — briga pelo título em aberto`,
        body: `${userStanding?.points} pts, ${userPos}º lugar. ${gap === 0 ? 'Empate com o líder.' : `${gap} ponto(s) do ${leaderTeam?.shortName ?? 'líder'}.`}`,
      });
    }
  }

  // Ameaça de rebaixamento (após 15 rodadas)
  if (played >= 15 && userPos >= 17) {
    items.push({
      type: 'general',
      title: `${userTeam.shortName} na zona de rebaixamento`,
      body: `${userPos}º lugar com ${userStanding?.points} pts em ${played} jogos. Urgente reencontrar o caminho.`,
    });
  }

  // Artilheiro do Brasileirão (a cada 10 jogos disputados)
  if (played > 0 && played % 10 === 0) {
    const top = getTopScorer(save);
    if (top && top.goals >= 5) {
      items.push({
        type: 'general',
        title: `Artilheiro do Brasileirão: ${top.name} (${top.goals} gols)`,
        body: `${top.name} lidera a artilharia pelo ${top.teamName} com ${top.goals} gols na temporada.`,
      });
    }
  }

  return items;
}

// Gera notícia de derby após resultado
export function generateDerbyNews(
  save: SaveGame,
  userTeamId: string,
  opponentId: string,
  userGoals: number,
  oppGoals: number,
): NewsSnippet | null {
  const rivalry = getRivalry(userTeamId, opponentId);
  if (!rivalry) return null;

  const userTeam = save.teams.find((t) => t.id === userTeamId);
  const oppTeam = save.teams.find((t) => t.id === opponentId);
  if (!userTeam || !oppTeam) return null;

  const won = userGoals > oppGoals;
  const drew = userGoals === oppGoals;
  const badge = rivalry.tier === 'classico' ? '🏆' : '⚽';

  if (won) {
    return {
      type: 'achievement',
      title: `${badge} CLÁSSICO! ${userTeam.shortName} vence o ${rivalry.name}`,
      body: `${userTeam.name} ${userGoals} × ${oppGoals} ${oppTeam.name}. Vitória especial — vale muito mais que 3 pontos!`,
    };
  }
  if (drew) {
    return {
      type: 'general',
      title: `${badge} ${rivalry.name}: empate dramático`,
      body: `${userTeam.name} ${userGoals} × ${oppGoals} ${oppTeam.name}. Clássico equilibrado — um ponto cada.`,
    };
  }
  return {
    type: 'general',
    title: `${badge} Derrota no clássico — ${rivalry.name}`,
    body: `${userTeam.name} ${userGoals} × ${oppGoals} ${oppTeam.name}. Resultado doloroso para a torcida.`,
  };
}

// Calcula efeito de moral pós-clássico
export function derbyMoraleEffect(won: boolean, drew: boolean, tier: 'classico' | 'derby'): number {
  const multiplier = tier === 'classico' ? 1.5 : 1.0;
  if (won) return Math.round(15 * multiplier);
  if (drew) return 3;
  return Math.round(-12 * multiplier);
}
