import { nanoid } from 'nanoid';
import type {
  SaveGame,
  Team,
  BoardObjective,
  ObjectiveType,
  SeasonAward,
  Player,
  NewsItem,
} from '@/types';

function pushNews(save: SaveGame, news: Omit<NewsItem, 'id' | 'read' | 'turn'>): void {
  if (!save.news) save.news = [];
  save.news.unshift({ ...news, id: nanoid(8), turn: save.currentTurn, read: false });
  if (save.news.length > 60) save.news.length = 60;
}
import { sortStandings } from '@/competitions/brasileirao';
import { autoPickStartingEleven, generatePlayer, generateYouthPlayer } from '@/engine/playerGenerator';
import { clamp, createRng } from '@/utils/random';

function recalcPlayerOverall(p: Player): number {
  const w =
    p.position === 'GK' ? { attack: 0.05, defense: 0.40, pace: 0.10, technique: 0.30, stamina: 0.15 }
    : p.position === 'DF' ? { attack: 0.10, defense: 0.40, pace: 0.15, technique: 0.15, stamina: 0.20 }
    : p.position === 'MF' ? { attack: 0.20, defense: 0.20, pace: 0.15, technique: 0.30, stamina: 0.15 }
    : { attack: 0.40, defense: 0.10, pace: 0.20, technique: 0.20, stamina: 0.10 };
  return clamp(Math.round(p.attack * w.attack + p.defense * w.defense + p.pace * w.pace + p.technique * w.technique + p.stamina * w.stamina), 1, 99);
}

// ============================================================
// Detecta se a temporada encerrou
// ============================================================

export function isSeasonOver(save: SaveGame): boolean {
  const roundRobins = save.competitions.filter((c) => c.format === 'round_robin');
  if (roundRobins.length === 0) return false;
  // Aguarda TODAS as ligas terminarem para garantir standings corretos no rebaixamento
  return roundRobins.every((c) => c.finished || c.fixtures.every((f) => f.played));
}

// ============================================================
// Gera objetivos da diretoria com base no tier
// ============================================================

export function generateBoardObjectives(userTeam: Team): BoardObjective[] {
  const tier = userTeam.tier;
  const division = userTeam.division ?? 'A';
  const objectives: BoardObjective[] = [];

  const add = (type: ObjectiveType, description: string, targetValue?: number) => {
    objectives.push({ id: nanoid(8), type, description, targetValue, status: 'pending' });
  };

  // Série C — objetivo principal é subir para a B
  if (division === 'C') {
    add('league_position', 'Promova para a Série B (top 4)', 4);
    add('avoid_relegation', 'Permaneça na Série C (top 16)');
    return objectives;
  }

  // Série B — objetivo principal é subir para a A
  if (division === 'B') {
    add('league_position', 'Promova para a Série A (top 4)', 4);
    add('avoid_relegation', 'Permaneça na Série B (top 16)');
    return objectives;
  }

  // Série A — objetivos por tier
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
  // Determina a divisão e competição principal do usuário
  const userTeamRef = save.teams.find((t) => t.id === save.controlledTeamId);
  const userDivision = userTeamRef?.division ?? 'A';

  const brasileirao = save.competitions.find(
    (c) => c.format === 'round_robin' && !c.id.startsWith('serie_b_') && !c.id.startsWith('serie_c_'),
  );
  const serieBComp = save.competitions.find((c) => c.id.startsWith('serie_b_'));
  const serieCComp = save.competitions.find((c) => c.id.startsWith('serie_c_'));
  const copa = save.competitions.find((c) => c.format === 'pure_knockout');

  // Competição do usuário — usada para posição e objetivos
  const userComp =
    userDivision === 'B' ? (serieBComp ?? brasileirao)
    : userDivision === 'C' ? (serieCComp ?? brasileirao)
    : brasileirao;

  const standings = userComp ? sortStandings(userComp.standings, save.teams) : [];
  const userPosition = standings.findIndex((s) => s.teamId === save.controlledTeamId) + 1;

  // Avaliar objetivos contra a competição correta do usuário
  save.boardObjectives.forEach((obj) => {
    if (obj.status !== 'pending') return;
    switch (obj.type) {
      case 'league_title':
        obj.status = userComp?.championId === save.controlledTeamId ? 'achieved' : 'failed';
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
        // G5 — apenas para times na Série A
        obj.status = userDivision === 'A' && userPosition > 0 && userPosition <= 5 ? 'achieved' : 'failed';
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
  // serieBComp / serieCComp já declarados no início da função

  const promoted: string[] = [];
  const relegated: string[] = [];

  if (brasileirao && serieBComp) {
    const brStandings = sortStandings(brasileirao.standings, save.teams);
    const bStandings  = sortStandings(serieBComp.standings, save.teams);

    const relegatedToB = brStandings.slice(16).map((s) => s.teamId); // posições 17-20 → Série B
    const promotedToA  = bStandings.slice(0, 4).map((s) => s.teamId); // top 4 Série B → Série A
    const relegatedToC = bStandings.slice(16).map((s) => s.teamId);   // posições 17-20 Série B → Série C

    relegated.push(...relegatedToB, ...relegatedToC);
    promoted.push(...promotedToA);

    save.teams.forEach((t) => {
      if (relegatedToB.includes(t.id)) t.division = 'B';
      else if (promotedToA.includes(t.id)) t.division = 'A';
      else if (relegatedToC.includes(t.id)) t.division = 'C';
    });

    if (serieCComp) {
      const cStandings = sortStandings(serieCComp.standings, save.teams);
      const promotedToB = cStandings.slice(0, 4).map((s) => s.teamId); // top 4 Série C → Série B
      promoted.push(...promotedToB);
      save.teams.forEach((t) => {
        if (promotedToB.includes(t.id)) t.division = 'B';
      });

      if (promotedToB.length > 0) {
        save.news.unshift({
          id: nanoid(8),
          turn: save.currentTurn,
          type: 'achievement',
          title: 'Promoção para a Série B!',
          body: `Promovidos da Série C: ${promotedToB.map((id) => save.teams.find((t) => t.id === id)?.name ?? id).join(', ')}.`,
          read: false,
        });
      }
      if (relegatedToC.length > 0) {
        save.news.unshift({
          id: nanoid(8),
          turn: save.currentTurn,
          type: 'general',
          title: 'Rebaixamento para a Série C',
          body: `Rebaixados da Série B: ${relegatedToC.map((id) => save.teams.find((t) => t.id === id)?.name ?? id).join(', ')}.`,
          read: false,
        });
      }
    }

    save.promotionRelegation = { promoted, relegated };

    const promotedToANames = promotedToA.map((id) => save.teams.find((t) => t.id === id)?.name ?? id);
    const relegatedToBNames = relegatedToB.map((id) => save.teams.find((t) => t.id === id)?.name ?? id);
    if (promotedToA.length > 0) {
      save.news.unshift({
        id: nanoid(8),
        turn: save.currentTurn,
        type: 'achievement',
        title: 'Promoção para a Série A!',
        body: `Promovidos da Série B: ${promotedToANames.join(', ')}.`,
        read: false,
      });
    }
    if (relegatedToB.length > 0) {
      save.news.unshift({
        id: nanoid(8),
        turn: save.currentTurn,
        type: 'general',
        title: 'Rebaixamento para a Série B',
        body: `Rebaixados da Série A: ${relegatedToBNames.join(', ')}.`,
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
  // Vencer qualquer título protege o técnico de demissão imediata
  const wonTitleThisSeason = userTitlesThisSeason > 0;
  // Só rebaixamento é falha crítica; não ganhar o título do Brasileiro é tolerado se houver outros troféus
  const relegationFailed = save.boardObjectives.some(
    (o) => o.type === 'avoid_relegation' && o.status === 'failed',
  );
  // Falha total: nenhum objetivo cumprido E confiança baixa (sem títulos de compensação)
  const achievedAny = save.boardObjectives.some((o) => o.status === 'achieved');
  const totalFailure = !achievedAny && !wonTitleThisSeason;

  const criticalFailed = relegationFailed || totalFailure;

  if (criticalFailed && !wonTitleThisSeason) {
    save.managerWarnings = (save.managerWarnings ?? 0) + 1;
    if (save.managerWarnings >= 2 || save.boardConfidence < 15) {
      save.dismissed = true;
    }
  } else {
    // Títulos ou objetivos cumpridos zeram avisos
    if (wonTitleThisSeason || achievedAny) save.managerWarnings = 0;
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

  // defensive_specialist: +3 DEF para DFs e GKs do elenco
  if (skills.includes('defensive_specialist') && userTeam) {
    let count = 0;
    userTeam.squad.forEach((p) => {
      if (p.position === 'DF' || p.position === 'GK') {
        p.defense = clamp(p.defense + 3, 1, 99);
        p.overall = recalcPlayerOverall(p);
        count++;
      }
    });
    if (count > 0) {
      pushNews(save, {
        type: 'achievement',
        title: 'Especialista Defensivo — efeito aplicado',
        body: `${count} zagueiro(s) e goleiro(s) receberam +3 DEF no início da temporada ${save.season}.`,
      });
    }
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
  // Quantidade de jovens depende do nível da Academia (youth infra): 0→3, 1→4, 2→5, 3→6
  const youthLevel = (save.infrastructure?.youth ?? 0) as 0 | 1 | 2 | 3;
  const youthCount = 3 + youthLevel;
  // Bônus de potencial por nível de academia: 0→0, 1→3, 2→6, 3→10
  const potentialBonus = [0, 3, 6, 10][youthLevel] ?? 0;
  save.youthPlayers = Array.from({ length: youthCount }, (_, i) =>
    generateYouthPlayer(save.season * 300 + i + 1, save.season, potentialBonus),
  );

  const qualityLabel = ['padrão (55–70)', 'boa (60–75)', 'alta (65–80)', 'excepcional (70–85)'][youthLevel] ?? 'padrão';
  pushNews(save, {
    type: 'general',
    title: `Academia revelou ${youthCount} jovens talentos`,
    body: `A base do clube revelou ${youthCount} jovens para a temporada ${save.season}. Qualidade de potencial: ${qualityLabel} OVR. Acesse o Elenco para analisá-los.`,
  });
}
