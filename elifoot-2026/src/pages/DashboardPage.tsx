import { Link, useNavigate } from 'react-router-dom';
import { useGameStore } from '@/store/gameStore';
import { ChevronRight, FastForward, Target, DollarSign, CheckCircle, XCircle, Clock, RefreshCw, AlertTriangle, Star, Briefcase, MessageSquare } from 'lucide-react';
import { calcWeeklyCashflow } from '@/engine/financeEngine';
import { reputationTier } from '@/data/managerSkills';

export default function DashboardPage() {
  const save = useGameStore((s) => s.save);
  const userTeam = useGameStore((s) => s.getUserTeam());
  const nextFixture = useGameStore((s) => s.getNextUserFixture());
  const advanceTurn = useGameStore((s) => s.advanceTurn);
  const startNewSeason = useGameStore((s) => s.startNewSeason);
  const closeGame = useGameStore((s) => s.closeGame);
  const resolvePlayerInteraction = useGameStore((s) => s.resolvePlayerInteraction);
  const navigate = useNavigate();

  if (!save || !userTeam) return null;

  // Tela de demissão
  if (save.dismissed) {
    return (
      <div className="panel p-8 text-center border border-red-500/40">
        <div className="text-5xl mb-4">😔</div>
        <div className="display-font text-3xl text-red-400 mb-3">Você foi demitido!</div>
        <p className="text-white/70 mb-6">
          A diretoria encerrou sua passagem pelo {userTeam.name} após falhas consecutivas nos objetivos críticos.
        </p>
        <button
          onClick={() => { closeGame(); navigate('/'); }}
          className="btn-primary"
        >
          Voltar ao menu principal
        </button>
      </div>
    );
  }

  const competition = nextFixture
    ? save.competitions.find((c) => c.id === nextFixture.competitionId)
    : undefined;

  const homeTeam = nextFixture && save.teams.find((t) => t.id === nextFixture.homeTeamId);
  const awayTeam = nextFixture && save.teams.find((t) => t.id === nextFixture.awayTeamId);
  const isUserHome = nextFixture?.homeTeamId === userTeam.id;

  const cashflow = calcWeeklyCashflow(save);
  const achievedObjectives = save.boardObjectives?.filter((o) => o.status === 'achieved') ?? [];

  // Últimas 5 partidas do Brasileirão
  const brasileirao = save.competitions.find((c) => c.format === 'round_robin');
  const lastFixtures = (brasileirao?.fixtures ?? [])
    .filter((f) => f.played && f.result && (f.homeTeamId === userTeam.id || f.awayTeamId === userTeam.id))
    .sort((a, b) => b.scheduledTurn - a.scheduledTurn)
    .slice(0, 5);
  const formResults = lastFixtures.map((f) => {
    const isHome = f.homeTeamId === userTeam.id;
    const scored = isHome ? f.result!.homeGoals : f.result!.awayGoals;
    const conceded = isHome ? f.result!.awayGoals : f.result!.homeGoals;
    return scored > conceded ? 'V' : scored < conceded ? 'D' : 'E';
  });

  // Mostrar botão de nova temporada quando a temporada acabou
  if (save.seasonOver) {
    const lastRecord = save.seasonRecords[save.seasonRecords.length - 1];
    const rep = save.managerReputation ?? 0;
    const tier = reputationTier(rep);
    return (
      <div className="space-y-6">
        <div className="panel p-6 text-center border border-gold-500/30">
          <div className="display-font text-4xl text-gold-400 mb-2">Temporada {save.season} Encerrada!</div>
          {lastRecord && (
            <div className="text-white/70 mb-4 space-y-1">
              <p>Posição final: <strong className="text-white">{lastRecord.leaguePosition}º lugar</strong></p>
              <p>Objetivos cumpridos: <strong className="text-white">{lastRecord.objectivesAchieved}/{lastRecord.objectivesTotal}</strong></p>
              {lastRecord.titles.length > 0 && (
                <p>Títulos: <strong className="text-gold-300">{lastRecord.titles.join(', ')}</strong></p>
              )}
            </div>
          )}
          {/* Badge de reputação */}
          <div className="inline-flex items-center gap-2 bg-white/5 rounded-full px-4 py-2 mb-4 text-sm">
            <Briefcase className="w-4 h-4 text-yellow-400" />
            <span className="text-white/70">Reputação:</span>
            <span className="font-bold text-yellow-400">{rep.toLocaleString('pt-BR')}</span>
            <span className="text-white/50">({tier.label})</span>
            <span className="flex gap-0.5 ml-1">
              {[1,2,3,4,5].map((i) => (
                <Star key={i} className={`w-3 h-3 ${i <= tier.stars ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'}`} />
              ))}
            </span>
          </div>
          <div className="flex flex-col gap-3 max-w-xs mx-auto">
            <button
              onClick={() => startNewSeason()}
              className="btn-primary flex items-center justify-center gap-2 py-3 text-lg"
            >
              <RefreshCw className="w-5 h-5" /> Iniciar Temporada {save.season + 1}
            </button>
            <Link to="/game/career" className="btn-ghost text-sm flex items-center justify-center gap-2">
              <Briefcase className="w-4 h-4" /> Ver Carreira & Habilidades
            </Link>
            <Link to="/game/history" className="btn-ghost text-sm flex items-center justify-center gap-2">
              Ver historial completo
            </Link>
          </div>
        </div>

        {/* Objetivos encerrados */}
        {save.boardObjectives && save.boardObjectives.length > 0 && (
          <div className="panel p-5">
            <h3 className="font-semibold mb-3">Resultado dos Objetivos</h3>
            <ul className="space-y-2">
              {save.boardObjectives.map((obj) => (
                <li key={obj.id} className="flex items-center gap-3 text-sm">
                  {obj.status === 'achieved' ? <CheckCircle className="w-4 h-4 text-green-400 shrink-0" /> :
                   obj.status === 'failed'   ? <XCircle className="w-4 h-4 text-red-400 shrink-0" /> :
                                               <Clock className="w-4 h-4 text-white/40 shrink-0" />}
                  <span className={obj.status === 'achieved' ? 'text-green-400' : obj.status === 'failed' ? 'text-red-400' : 'text-white/70'}>
                    {obj.description}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Próxima partida */}
      <div className="panel p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs uppercase tracking-wider text-white/50">Próxima partida</div>
          {formResults.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-white/30">Forma:</span>
              {formResults.map((r, i) => (
                <span key={i} className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  r === 'V' ? 'bg-green-500 text-white' :
                  r === 'D' ? 'bg-red-500 text-white' :
                  'bg-yellow-500 text-white'
                }`}>{r}</span>
              ))}
            </div>
          )}
        </div>
        {nextFixture && competition && homeTeam && awayTeam ? (
          <div>
            <div className="text-sm text-white/60 mb-3">
              {competition.shortName} · Rodada {nextFixture.round} · Dia {nextFixture.scheduledTurn}
            </div>
            <div className="flex items-center justify-between gap-4 mb-4">
              <TeamCard team={homeTeam} highlight={isUserHome} />
              <div className="text-2xl display-font text-white/40">VS</div>
              <TeamCard team={awayTeam} highlight={!isUserHome} reverse />
            </div>
            <div className="flex gap-3">
              {nextFixture.scheduledTurn === save.currentTurn ? (
                <Link
                  to={`/game/match/${nextFixture.id}`}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  Jogar partida <ChevronRight className="w-4 h-4" />
                </Link>
              ) : (
                <button
                  onClick={() => advanceTurn()}
                  className="btn-gold flex-1 flex items-center justify-center gap-2"
                >
                  <FastForward className="w-4 h-4" />
                  Avançar para o dia da partida
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-white/60 py-4 text-center">
            Sem mais partidas agendadas.
          </div>
        )}
      </div>

      {/* Aviso de demissão */}
      {(save.managerWarnings ?? 0) > 0 && (
        <div className="panel p-4 border border-red-500/40 bg-red-900/10 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-red-400 text-sm">Aviso da diretoria</div>
            <div className="text-xs text-white/70 mt-0.5">
              Você falhou nos objetivos críticos da última temporada. Mais uma temporada consecutiva com falhas e você será demitido.
            </div>
          </div>
        </div>
      )}

      {/* Objetivos + Finanças (grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Objetivos */}
        <div className="panel p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Target className="w-4 h-4 text-gold-400" /> Objetivos
            </h3>
            <span className="text-xs text-white/40">
              {achievedObjectives.length}/{(save.boardObjectives ?? []).length} cumpridos
            </span>
          </div>
          {(save.boardObjectives ?? []).length === 0 ? (
            <p className="text-white/40 text-sm">Carregando...</p>
          ) : (
            <ul className="space-y-1.5">
              {(save.boardObjectives ?? []).slice(0, 3).map((obj) => (
                <li key={obj.id} className="flex items-center gap-2 text-sm">
                  {obj.status === 'achieved' ? <CheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0" /> :
                   obj.status === 'failed'   ? <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" /> :
                                               <Clock className="w-3.5 h-3.5 text-white/30 shrink-0" />}
                  <span className={
                    obj.status === 'achieved' ? 'text-green-400' :
                    obj.status === 'failed'   ? 'text-red-400' :
                                                'text-white/70'
                  }>{obj.description}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Finanças resumidas */}
        <div className="panel p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-400" /> Finanças
            </h3>
            <Link to="/game/finance" className="text-xs text-pitch-400 hover:text-pitch-300">Ver mais</Link>
          </div>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-white/60">Saldo atual</span>
              <span className={userTeam.budget >= 0 ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>
                R$ {(userTeam.budget / 1000).toFixed(1)}M
              </span>
            </div>
            <div className="flex justify-between text-white/50">
              <span>Patrocínios/semana</span>
              <span className="text-green-300">+R$ {(cashflow.sponsorIncome / 1000).toFixed(2)}M</span>
            </div>
            <div className="flex justify-between text-white/50">
              <span>Salários/semana</span>
              <span className="text-red-300">-R$ {(cashflow.weeklyWages / 1000).toFixed(2)}M</span>
            </div>
            <div className="flex justify-between font-semibold border-t border-white/10 pt-1.5 mt-1">
              <span>Saldo líquido/sem.</span>
              <span className={cashflow.net >= 0 ? 'text-green-400' : 'text-red-400'}>
                {cashflow.net >= 0 ? '+' : ''}R$ {(cashflow.net / 1000).toFixed(2)}M
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Interações com jogadores */}
      {(save.playerInteractions ?? []).filter((i) => !i.resolved).length > 0 && (
        <div className="panel p-4 border border-yellow-500/30">
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <MessageSquare className="w-4 h-4 text-yellow-400" /> Jogadores querem falar
          </h3>
          <div className="space-y-4">
            {(save.playerInteractions ?? []).filter((i) => !i.resolved).map((interaction) => (
              <div key={interaction.id} className="bg-white/5 rounded-lg p-3">
                <p className="text-sm text-white/80 mb-2">{interaction.message}</p>
                <div className="flex flex-wrap gap-2">
                  {interaction.options.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => resolvePlayerInteraction(interaction.id, idx)}
                      className={`text-xs px-3 py-1.5 rounded transition-colors ${
                        opt.moraleEffect > 0
                          ? 'bg-green-500/20 hover:bg-green-500/40 text-green-300'
                          : opt.moraleEffect < 0
                          ? 'bg-red-500/20 hover:bg-red-500/40 text-red-300'
                          : 'bg-white/10 hover:bg-white/20 text-white/70'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Avançar dia */}
      <div className="panel p-5 flex items-center justify-between">
        <div>
          <div className="font-semibold">Pular dia</div>
          <div className="text-sm text-white/60">Simula partidas dos outros times e processa finanças</div>
        </div>
        <button onClick={() => advanceTurn()} className="btn-primary flex items-center gap-2">
          <FastForward className="w-4 h-4" /> Avançar
        </button>
      </div>

      {/* Notícias */}
      <div className="panel p-5">
        <h3 className="display-font text-2xl mb-3">Notícias</h3>
        {save.news.length === 0 ? (
          <div className="text-white/50 text-sm">Nenhuma notícia ainda.</div>
        ) : (
          <ul className="space-y-2 max-h-96 overflow-auto">
            {save.news.slice(0, 20).map((n) => (
              <li key={n.id} className="bg-white/5 rounded-lg px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-pitch-500">{n.type}</span>
                  <span className="text-xs text-white/40">Dia {n.turn}</span>
                </div>
                <div className="font-semibold text-sm">{n.title}</div>
                <div className="text-xs text-white/60">{n.body}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function TeamCard({
  team, highlight, reverse,
}: {
  team: { name: string; shortName: string; primaryColor: string; secondaryColor: string };
  highlight?: boolean;
  reverse?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 ${reverse ? 'flex-row-reverse' : ''}`}>
      <div
        className={`w-14 h-14 rounded-lg flex items-center justify-center font-bold ${highlight ? 'ring-2 ring-pitch-500' : ''}`}
        style={{ backgroundColor: team.primaryColor, color: team.secondaryColor }}
      >
        {team.shortName}
      </div>
      <div className={reverse ? 'text-right' : ''}>
        <div className="font-semibold leading-tight">{team.name}</div>
      </div>
    </div>
  );
}
