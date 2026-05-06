import { nanoid } from 'nanoid';
import type {
  SaveGame,
  Team,
  BoardObjective,
  ObjectiveType,
  SeasonAward,
} from '@/types';
import { sortStandings } from '@/competitions/brasileirao';
import { autoPickStartingEleven, generatePlayer, generateYouthPlayer } from '@/engine/playerGenerator';
import { clamp, createRng } from '@/utils/random';

// ============================================================
// Detecta se a temporada encerrou
// ============================================================

export function isSeasonOver(save: SaveGame): boolean {
  const brasileirao = save.competitions.find((c) => c.format === 'round_robin');
  if (!brasileirao) return false;
  return brasileirao.finished || brasileirao.fixtures.every((f) => f.played);
}

// ============================================================
// Gera objetivos da diretoria com base no tier
// ============================================================

export function generateBoardObjectives(userTeam: Team): BoardObjective[] {
  const tier = userTeam.tier;
  const objectives: BoardObjective[] = [];

  const add = (type: ObjectiveType, description: string, targetValue?: number) => {
    objectives.push({ id: nanoid(8), type, description, targetValue, status: 'pending' });
  };

  if (tier === 'elite') {
    add('league_title', 'Vença o Brasileirão');
    add('qualify_libertadores', 'Classifique-se para a Libertadores (top 5)');
    add('cup_win', 'Vença a Copa do Brasil');
  } else if (tier === 'top') {
    add('league_position', 'Termine no top 4 do Brasileirão', 4);
    add('avoid_relegation', 'Evite o rebaixamento (top 16)');
    add('qualify_libertadores', 'Classifique-se para a Libertadores (top 5)');
  } else if (tier === 'mid') {
    add('league_position', 'Termine no top 10 do Brasileirão', 10);
    add('avoid_relegation', 'Evite o rebaixamento (top 16)');
  } else {
    add('avoid_relegation', 'Sobreviva na Série A — fique no top 16');
    add('league_position', 'Supere as expectativas — termine no top 14', 14);
  }

  return objectives;
}

// ============================================================
// Processa fim de temporada: avalia objetivos, registra história
// ============================================================

export function processSeasonEnd(save: SaveGame): void {
  const brasileirao = save.competitions.find((c) => c.format === 'round_robin');
  const copa = save.competitions.find((c) => c.format === 'pure_knockout');

  const standings = brasileirao
    ? sortStandings(brasileirao.standings, save.teams)
    : [];
  const userPosition = standings.findIndex((s) => s.teamId === save.controlledTeamId) + 1;

  // Avaliar objetivos
  save.boardObjectives.forEach((obj) => {
    if (obj.status !== 'pending') return;
    switch (obj.type) {
      case 'league_title':
        obj.status = brasileirao?.championId === save.controlledTeamId ? 'achieved' : 'failed';
        break;
      case 'league_position':
        obj.status = userPosition > 0 && userPosition <= (obj.targetValue ?? 4) ? 'achieved' : 'failed';
        break;
      case 'avoid_relegation':
        obj.status = userPosition > 0 && userPosition <= 16 ? 'achieved' : 'failed';
        break;
      case 'cup_win':
        obj.status = copa?.championId === save.controlledTeamId ? 'achieved' : 'failed';
        break;
      case 'qualify_libertadores':
        // 2026: G5 — top 5 vão à fase de grupos da Libertadores
        obj.status = userPosition > 0 && userPosition <= 5 ? 'achieved' : 'failed';
        break;
    }
  });

  // Hall da fama
  save.competitions.forEach((comp) => {
    if (!comp.championId) return;
    const champ = save.teams.find((t) => t.id === comp.championId);
    if (!champ) return;
    if (!save.hallOfFame.some((h) => h.season === save.season && h.competitionName === comp.name)) {
      save.hallOfFame.push({
        season: save.season,
        competitionName: comp.name,
        championName: champ.name,
      });
    }
  });

  // Registro da temporada
  const titles = save.competitions
    .filter((c) => c.championId === save.controlledTeamId)
    .map((c) => c.name);

  const userTeam = save.teams.find((t) => t.id === save.controlledTeamId);
  save.seasonRecords.push({
    season: save.season,
    teamName: userTeam?.name ?? '',
    leaguePosition: userPosition || 0,
    objectivesAchieved: save.boardObjectives.filter((o) => o.status === 'achieved').length,
    objectivesTotal: save.boardObjectives.length,
    titles,
    budget: userTeam?.budget ?? 0,
  });

  save.seasonOver = true;

  // ── Prêmios da temporada ─────────────────────────────────────
  const allPlayers = save.teams.flatMap((t) =>
    t.squad.map((p) => ({ player: p, team: t })),
  );

  const topScorer = allPlayers.reduce<typeof allPlayers[0] | null>(
    (best, curr) => (curr.player.stats.goals > (best?.player.stats.goals ?? -1) ? curr : best),
    null,
  );

  const userTitlesThisSeason = save.competitions.filter(
    (c) => c.championId === save.controlledTeamId,
  ).length;

  // ── Sistema de votação: Bola de Ouro ────────────────────��
  // 30 candidatos pelos melhores overall com participação >= 1 jogo
  const VOTE_WEIGHTS = [15, 12, 10, 8, 7, 5, 4, 3, 2, 1];
  const NUM_JOURNALISTS = 100;
  const NUM_CANDIDATES = 30;

  const candidates = [...allPlayers]
    .filter((x) => x.player.stats.appearances > 0)
    .sort((a, b) => {
      // Score composto: overall + bônus por títulos + bônus por gols
      const titleBonus = (entry: typeof a) =>
        save.competitions.filter((c) => c.championId === entry.team.id).length * 5;
      const scoreA = a.player.overall + titleBonus(a) + Math.floor(a.player.stats.goals * 0.3);
      const scoreB = b.player.overall + titleBonus(b) + Math.floor(b.player.stats.goals * 0.3);
      return scoreB - scoreA;
    })
    .slice(0, NUM_CANDIDATES);

  // Pontuação total por índice de candidato
  const votePoints = new Array(candidates.length).fill(0);
  const firstPlaceVotes = new Array(candidates.length).fill(0);

  const rng30 = createRng(save.season * 7777 + 13);
  for (let j = 0; j < NUM_JOURNALISTS; j++) {
    // Cada jornalista tem uma "preferência" levemente aleatória influenciada pelo score
    const weights = candidates.map((_c, idx) => {
      const base = NUM_CANDIDATES - idx; // 30 para o 1º, 1 para o último
      const noise = rng30() * 8; // variação aleatória
      return base + noise;
    });
    // Selecionar top 10 pelo peso
    const ranked = weights
      .map((w, i) => ({ w, i }))
      .sort((a, b) => b.w - a.w)
      .slice(0, 10);

    ranked.forEach(({ i }, pos) => {
      votePoints[i] += VOTE_WEIGHTS[pos];
      if (pos === 0) firstPlaceVotes[i]++;
    });
  }

  // Ranking final da votação
  const voteRanking = candidates
    .map((c, i) => ({ c, pts: votePoints[i], fp: firstPlaceVotes[i] }))
    .sort((a, b) => b.pts - a.pts || b.fp - a.fp);

  const award: SeasonAward = { season: save.season };

  if (topScorer && topScorer.player.stats.goals > 0) {
    award.artilheiro = {
      playerName: topScorer.player.name,
      teamName: topScorer.team.name,
      goals: topScorer.player.stats.goals,
    };
  }

  // Bola de Ouro — vencedor da votação
  if (voteRanking.length > 0) {
    const winner = voteRanking[0].c;
    award.boladeOuro = {
      playerName: winner.player.name,
      teamName: winner.team.name,
      overall: winner.player.overall,
      position: winner.player.position,
      totalVotes: voteRanking[0].pts,
      firstPlaceVotes: voteRanking[0].fp,
    };
    // Top 5 da votação para exibição
    award.topVoters = voteRanking.slice(0, 5).map((v) => ({
      playerName: v.c.player.name,
      teamName: v.c.team.name,
      points: v.pts,
    }));
  }

  // Troféu Kopa (melhor jogador sub-21 com aparições)
  const kopaCandidate = [...allPlayers]
    .filter((x) => x.player.age <= 21 && x.player.stats.appearances > 0)
    .sort((a, b) => b.player.overall - a.player.overall)[0];
  if (kopaCandidate) {
    award.revelacao = {
      playerName: kopaCandidate.player.name,
      teamName: kopaCandidate.team.name,
      overall: kopaCandidate.player.overall,
      age: kopaCandidate.player.age,
      position: kopaCandidate.player.position,
    };
  }

  // Troféu Yashin (melhor goleiro com aparições)
  const yashinCandidate = [...allPlayers]
    .filter((x) => x.player.position === 'GK' && x.player.stats.appearances > 0)
    .sort((a, b) => b.player.overall - a.player.overall)[0];
  if (yashinCandidate) {
    award.melhorGoleiro = {
      playerName: yashinCandidate.player.name,
      teamName: yashinCandidate.team.name,
      overall: yashinCandidate.player.overall,
      age: yashinCandidate.player.age,
      position: 'GK',
    };
  }

  award.melhorTecnico = {
    managerName: save.managerName,
    teamName: userTeam?.name ?? '',
    titulos: userTitlesThisSeason,
  };

  if (!save.seasonAwards) save.seasonAwards = [];
  save.seasonAwards.push(award);

  // ── Promoção e rebaixamento ──────────────────────────────
  const serieBComp = save.competitions.find((c) => c.id.startsWith('serie_b_'));
  if (brasileirao && serieBComp) {
    const brStandings = sortStandings(brasileirao.standings, save.teams);
    const bStandings  = sortStandings(serieBComp.standings, save.teams);

    const relegated = brStandings.slice(16).map((s) => s.teamId); // posições 17-20
    const promoted  = bStandings.slice(0, 4).map((s) => s.teamId); // top 4 da Série B

    save.teams.forEach((t) => {
      if (relegated.includes(t.id)) t.division = 'B';
      else if (promoted.includes(t.id)) t.division = 'A';
    });

    save.promotionRelegation = { promoted, relegated };

    // Notícia de promoção/rebaixamento
    const promotedNames = promoted.map((id) => save.teams.find((t) => t.id === id)?.name ?? id);
    const relegatedNames = relegated.map((id) => save.teams.find((t) => t.id === id)?.name ?? id);
    if (promoted.length > 0) {
      save.news.unshift({
        id: nanoid(8),
        turn: save.currentTurn,
        type: 'achievement',
        title: 'Promoção para a Série A!',
        body: `Times promovidos: ${promotedNames.join(', ')}.`,
        read: false,
      });
    }
    if (relegated.length > 0) {
      save.news.unshift({
        id: nanoid(8),
        turn: save.currentTurn,
        type: 'general',
        title: 'Rebaixamento para a Série B',
        body: `Times rebaixados: ${relegatedNames.join(', ')}.`,
        read: false,
      });
    }
  }

  // ── XP e reputação do técnico ─────────────────────────────
  let xpGained = 0;
  const achievedCount = save.boardObjectives.filter((o) => o.status === 'achieved').length;
  const failedCount   = save.boardObjectives.filter((o) => o.status === 'failed').length;

  if (userTitlesThisSeason > 0) xpGained += userTitlesThisSeason * 600;
  if (brasileirao?.championId === save.controlledTeamId) xpGained += 400; // bônus por título de liga
  if (userPosition > 0 && userPosition <= 5)  xpGained += 200;
  else if (userPosition > 0 && userPosition <= 10) xpGained += 100;
  if (achievedCount === save.boardObjectives.length && save.boardObjectives.length > 0) xpGained += 150;

  if (save.managerReputation === undefined) save.managerReputation = 0;
  if (save.managerXP        === undefined) save.managerXP         = 0;
  if (save.managerXPSpent   === undefined) save.managerXPSpent    = 0;
  if (!save.unlockedSkills)                save.unlockedSkills     = [];
  if (save.boardConfidence  === undefined) save.boardConfidence    = 60;
  if (!save.careerClubs)                   save.careerClubs        = [];

  save.managerXP += xpGained;
  // Reputação sobe proporcionalmente ao XP (não gasta, apenas reflete acúmulo)
  save.managerReputation = Math.min(10000, save.managerReputation + Math.floor(xpGained * 0.8));

  // ── Confiança da diretoria ────────────────────────────────
  const confidenceDelta =
    achievedCount * 15
    - failedCount * 20
    + (userTitlesThisSeason > 0 ? 20 : 0);
  save.boardConfidence = clamp((save.boardConfidence ?? 60) + confidenceDelta, 0, 100);

  // Registrar clube atual na carreira
  if (userTeam && !save.careerClubs.includes(userTeam.name)) {
    save.careerClubs.push(userTeam.name);
  }

  // ── Verificar objetivos críticos para risco de demissão ───
  const criticalFailed = save.boardObjectives.some(
    (o) =>
      (o.type === 'avoid_relegation' || o.type === 'league_title') &&
      o.status === 'failed',
  );
  if (criticalFailed) {
    save.managerWarnings = (save.managerWarnings ?? 0) + 1;
    if (save.managerWarnings >= 2 || save.boardConfidence < 15) {
      save.dismissed = true;
    }
  } else {
    save.managerWarnings = 0;
  }
}

// ============================================================
// Inicia nova temporada
// ============================================================

export function startNewSeason(save: SaveGame): void {
  const prevSeason = save.season;
  save.season = prevSeason + 1;
  save.currentTurn = 1;
  save.seasonStartTurn = 1;
  save.seasonEndTurn = 280;
  save.seasonOver = false;

  // ── Envelhecer jogadores e lidar com contratos ────────────
  save.teams.forEach((team) => {
    team.squad = team.squad.filter((p) => {
      p.age += 1;
      p.stats = { appearances: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0, minutesPlayed: 0 };
      p.yellowCardsInComp = {};
      p.appearancesInComp = {};
      p.fitness = clamp(p.fitness + 10, 60, 100);
      p.morale = 75;
      p.injuredUntil = undefined;

      // Aposentadoria: probabilidade crescente após 35
      if (p.age > 35) {
        const retirementProb = (p.age - 35) * 0.25;
        if (Math.random() < retirementProb) return false; // remove do elenco
      }

      // Contratos expirados — jogadores saem se não renovados (usuário ou IA)
      if (p.contractUntil < save.season) {
        if (team.isUserControlled) {
          return false; // contrato não renovado → atleta vai embora
        } else {
          if (Math.random() < 0.5) {
            p.contractUntil = save.season + Math.ceil(Math.random() * 3);
          } else {
            return false;
          }
        }
      }
      return true;
    });

    // Repor elenco abaixo de 18 jogadores com jogadores gerados
    const shortage = 18 - team.squad.length;
    if (shortage > 0) {
      const rng = createRng(save.season * 100 + team.squad.length);
      for (let i = 0; i < shortage; i++) {
        const positions = ['GK', 'DF', 'MF', 'FW'] as const;
        const pos = positions[Math.floor(rng() * 4)];
        const newPlayer = generatePlayer({ position: pos, tier: team.tier, isStarter: false, rng });
        newPlayer.contractUntil = save.season + Math.ceil(rng() * 3) + 1;
        team.squad.push(newPlayer);
      }
    }

    // Atualizar escalação
    const { starting, bench } = autoPickStartingEleven(team.squad, team.formation);
    team.starting11 = starting;
    team.bench = bench;
  });

  // ── Gerar novas competições ───────────────────────────────
  // (importado dinamicamente para evitar dependência circular)
  // O gameStore chama generateInitialCompetitions após esta função

  // ── Novos objetivos da diretoria ─────────────────────────
  const userTeam = save.teams.find((t) => t.id === save.controlledTeamId);
  if (userTeam) {
    save.boardObjectives = generateBoardObjectives(userTeam);
  }

  // ── Efeitos de habilidades do técnico ─────────────────────
  const skills = save.unlockedSkills ?? [];

  // financial_wizard: -5% nos salários do elenco do usuário
  if (skills.includes('financial_wizard') && userTeam) {
    userTeam.squad.forEach((p) => {
      p.wageMonthly = Math.max(1, Math.round(p.wageMonthly * 0.95));
    });
  }

  // master_motivator: +10 morale para todos do elenco do usuário
  if (skills.includes('master_motivator') && userTeam) {
    userTeam.squad.forEach((p) => {
      p.morale = clamp(p.morale + 10, 0, 100);
    });
  }

  // board_champion: +10 na confiança da diretoria
  if (skills.includes('board_champion')) {
    save.boardConfidence = clamp((save.boardConfidence ?? 60) + 10, 0, 100);
  }

  // ── Limpar mercado e histórico financeiro ─────────────────
  save.transferMarket = save.transferMarket.filter((l) => l.status !== 'open');
  const keepFrom = Math.max(0, save.currentTurn - 30);
  save.financeHistory = save.financeHistory.filter((r) => r.turn >= keepFrom);

  // ── Expirar ofertas de patrocínio da temporada anterior ───
  if (save.sponsorOffers) {
    save.sponsorOffers = save.sponsorOffers.map((o) => {
      if (o.status === 'pending') return { ...o, status: 'expired' as const };
      if (o.status === 'active' && o.activeUntil != null && o.activeUntil < save.season) {
        return { ...o, status: 'expired' as const };
      }
      return o;
    });
  }

  // ── Nova safra da base ────────────────────────────────────
  save.youthPlayers = [
    generateYouthPlayer(save.season * 300 + 1, save.season),
    generateYouthPlayer(save.season * 300 + 2, save.season),
    generateYouthPlayer(save.season * 300 + 3, save.season),
  ];
}
