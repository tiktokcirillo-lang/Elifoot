import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { generateAvailableScouts, REGION_LABEL } from '@/engine/scoutingEngine';

const QUALITY_STARS = ['', '★', '★★', '★★★', '★★★★', '★★★★★'];
const QUALITY_COLOR = ['', 'text-gray-400', 'text-blue-400', 'text-yellow-400', 'text-orange-400', 'text-red-400'];

type Tab = 'scouts' | 'reports' | 'loans';

export default function ScoutingPage() {
  const save = useGameStore((s) => s.save);
  const hireScout = useGameStore((s) => s.hireScout);
  const fireScout = useGameStore((s) => s.fireScout);
  const assignScout = useGameStore((s) => s.assignScout);
  const markScoutReportRead = useGameStore((s) => s.markScoutReportRead);
  const signScoutedPlayer = useGameStore((s) => s.signScoutedPlayer);
  const acceptLoanOffer = useGameStore((s) => s.acceptLoanOffer);
  const rejectLoanOffer = useGameStore((s) => s.rejectLoanOffer);

  const [tab, setTab] = useState<Tab>('scouts');

  if (!save) return null;

  const userTeam = save.teams.find((t) => t.id === save.controlledTeamId);
  const availablePool = generateAvailableScouts(save.season * 999);
  const hiredIds = new Set((save.scouts ?? []).map((s) => s.id));
  const availableScouts = availablePool.filter((s) => !hiredIds.has(s.id));
  const hiredScouts = save.scouts ?? [];
  const reports = save.scoutReports ?? [];
  const loans = (save.loanMarket ?? []).filter((o) => o.status === 'available');
  const unreadReports = reports.filter((r) => !r.read).length;

  const getPlayer = (playerId: string) =>
    save.teams.flatMap((t) => t.squad).find((p) => p.id === playerId);

  const tabs: [Tab, string][] = [
    ['scouts', `Scouts (${hiredScouts.length})`],
    ['reports', `Relatórios${unreadReports > 0 ? ` (${unreadReports})` : ''}`],
    ['loans', `Empréstimos (${loans.length})`],
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="display-font text-3xl">Scouting</h1>
        <div className="text-sm text-white/50">Budget: R$ {((userTeam?.budget ?? 0) / 1000).toFixed(1)}M</div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 rounded-lg p-1">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
              tab === key ? 'bg-pitch-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Scouts ── */}
      {tab === 'scouts' && (
        <div className="space-y-4">
          {hiredScouts.length > 0 && (
            <div className="panel p-4">
              <h2 className="font-semibold mb-3">Meus Scouts</h2>
              <div className="space-y-2">
                {hiredScouts.map((scout) => (
                  <div key={scout.id} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{scout.name}</span>
                        <span className={`text-sm ${QUALITY_COLOR[scout.quality]}`}>{QUALITY_STARS[scout.quality]}</span>
                      </div>
                      <div className="text-xs text-white/50">
                        {REGION_LABEL[scout.region]} · R$ {scout.wageMontly}k/mês
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {scout.status === 'scouting' ? (
                        <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded">
                          Em missão — dia {scout.reportDueTurn}
                        </span>
                      ) : (
                        <button
                          onClick={() => assignScout(scout.id)}
                          className="text-xs bg-pitch-600 hover:bg-pitch-700 text-white px-3 py-1 rounded transition-colors"
                        >
                          Enviar para prospecção
                        </button>
                      )}
                      <button
                        onClick={() => fireScout(scout.id)}
                        className="text-xs bg-red-500/20 hover:bg-red-500/40 text-red-400 px-2 py-1 rounded transition-colors"
                      >
                        Demitir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="panel p-4">
            <h2 className="font-semibold mb-1">Scouts Disponíveis</h2>
            <p className="text-xs text-white/40 mb-3">Adiantamento = 3 meses de salário</p>
            {availableScouts.length === 0 ? (
              <p className="text-white/50 text-sm">Todos os scouts disponíveis já foram contratados.</p>
            ) : (
              <div className="space-y-2">
                {availableScouts.map((scout) => (
                  <div key={scout.id} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{scout.name}</span>
                        <span className={`text-sm ${QUALITY_COLOR[scout.quality]}`}>{QUALITY_STARS[scout.quality]}</span>
                      </div>
                      <div className="text-xs text-white/50">
                        {REGION_LABEL[scout.region]} · R$ {scout.wageMontly}k/mês · Adiantamento: R$ {scout.wageMontly * 3}k
                      </div>
                    </div>
                    <button
                      onClick={() => hireScout(scout.id)}
                      disabled={(userTeam?.budget ?? 0) < scout.wageMontly * 3}
                      className="text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-white/10 disabled:text-white/30 disabled:cursor-not-allowed text-white px-3 py-1 rounded transition-colors"
                    >
                      Contratar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Relatórios ── */}
      {tab === 'reports' && (
        <div className="panel p-4">
          {reports.length === 0 ? (
            <div className="text-center py-8 text-white/50">
              <div className="text-4xl mb-3">🔍</div>
              <p>Nenhum relatório disponível.</p>
              <p className="text-sm mt-1">Envie um scout para prospecção na aba Scouts.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <div
                  key={report.id}
                  onClick={() => !report.read && markScoutReportRead(report.id)}
                  className={`rounded-lg p-4 cursor-pointer transition-all ${
                    report.read ? 'bg-white/5' : 'bg-blue-500/10 border border-blue-500/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {!report.read && <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />}
                        <span className="font-semibold">{report.name}</span>
                        <span className="text-xs text-white/50 shrink-0">{report.age} anos · {report.position}</span>
                      </div>
                      <div className="text-xs text-white/50 mb-2">{REGION_LABEL[report.region]}</div>
                      <div className="flex gap-3 text-sm">
                        <span className="text-green-400 font-medium">OVR ~{report.estimatedOVR}</span>
                        {report.estimatedPotential && (
                          <span className="text-yellow-400">POT ~{report.estimatedPotential}</span>
                        )}
                        <span className="text-white/70">~R$ {(report.estimatedValue / 1000).toFixed(1)}M</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); signScoutedPlayer(report.id); }}
                      disabled={(userTeam?.budget ?? 0) < report.estimatedValue || (userTeam?.squad.length ?? 0) >= 35}
                      className="shrink-0 text-xs bg-green-600 hover:bg-green-700 disabled:bg-white/10 disabled:text-white/30 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded transition-colors"
                    >
                      Contratar<br className="hidden sm:block" />
                      <span className="text-[10px] opacity-70">R$ {(report.estimatedValue / 1000).toFixed(1)}M</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Empréstimos ── */}
      {tab === 'loans' && (
        <div className="space-y-4">
          <div className="panel p-4">
            <h2 className="font-semibold mb-3">Ofertas de Empréstimo</h2>
            {loans.length === 0 ? (
              <div className="text-center py-6 text-white/50">
                <p>Nenhuma oferta disponível.</p>
                <p className="text-sm mt-1">Novas ofertas surgem a cada 28 dias.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {loans.map((offer) => {
                  const player = getPlayer(offer.playerId);
                  const fromTeam = save.teams.find((t) => t.id === offer.fromTeamId);
                  if (!player || !fromTeam) return null;
                  return (
                    <div key={offer.id} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-medium">{player.name}</span>
                          <span className="text-xs text-white/50">{player.age} anos · {player.position} · OVR {player.overall}</span>
                        </div>
                        <div className="text-xs text-white/40">
                          {fromTeam.name} · até temp. {offer.loanUntil} · R$ {offer.loanFeeMonthly}k/mês
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => acceptLoanOffer(offer.id)}
                          disabled={(userTeam?.squad.length ?? 0) >= 35}
                          className="text-xs bg-green-600 hover:bg-green-700 disabled:bg-white/10 disabled:text-white/30 disabled:cursor-not-allowed text-white px-3 py-1 rounded transition-colors"
                        >
                          Aceitar
                        </button>
                        <button
                          onClick={() => rejectLoanOffer(offer.id)}
                          className="text-xs bg-red-500/20 hover:bg-red-500/40 text-red-400 px-2 py-1 rounded transition-colors"
                        >
                          Recusar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Empréstimos ativos */}
          {(save.activeLoans ?? []).filter((l) => l.loanedToTeamId === save.controlledTeamId).length > 0 && (
            <div className="panel p-4">
              <h2 className="font-semibold mb-3">Empréstimos Ativos</h2>
              <div className="space-y-2">
                {save.activeLoans.filter((l) => l.loanedToTeamId === save.controlledTeamId).map((loan) => {
                  const player = getPlayer(loan.playerId);
                  const origTeam = save.teams.find((t) => t.id === loan.originalTeamId);
                  if (!player) return null;
                  return (
                    <div key={loan.id} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                      <div>
                        <span className="font-medium">{player.name}</span>
                        <div className="text-xs text-white/40">
                          Cedido por {origTeam?.name ?? '?'} · até temporada {loan.loanUntil} · R$ {loan.loanFeeMonthly}k/mês
                        </div>
                      </div>
                      <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded">Emprestado</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
