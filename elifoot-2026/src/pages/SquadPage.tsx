import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import type { Player, Position } from '@/types';
import { Star, Heart, Activity, TrendingUp, ArrowUpCircle, AlertTriangle, Crown, DollarSign, ArrowLeftRight, X, FileText } from 'lucide-react';

const POS_OPTIONS: Position[] = ['GK', 'DF', 'MF', 'FW'];
const POS_COLOR: Record<Position, string> = {
  GK: 'bg-yellow-600/30 text-yellow-300 border-yellow-600/40',
  DF: 'bg-blue-600/30 text-blue-300 border-blue-600/40',
  MF: 'bg-green-600/30 text-green-300 border-green-600/40',
  FW: 'bg-red-600/30 text-red-300 border-red-600/40',
};

const POSITION_ORDER: Position[] = ['GK', 'DF', 'MF', 'FW'];
const POSITION_LABEL: Record<Position, string> = {
  GK: 'Goleiros',
  DF: 'Defensores',
  MF: 'Meio-campistas',
  FW: 'Atacantes',
};

export default function SquadPage() {
  const userTeam = useGameStore((s) => s.getUserTeam());
  const save = useGameStore((s) => s.save);
  const setUserStarting11 = useGameStore((s) => s.setUserStarting11);
  const promoteYouthPlayer = useGameStore((s) => s.promoteYouthPlayer);
  const negotiateContract = useGameStore((s) => s.negotiateContract);
  const changePlayerPosition = useGameStore((s) => s.changePlayerPosition);
  const sellPlayerDirectly = useGameStore((s) => s.sellPlayerDirectly);
  const loanPlayerOut = useGameStore((s) => s.loanPlayerOut);
  const [selected, setSelected] = useState<string[]>(() => userTeam?.starting11 ?? []);
  const [posPickerId, setPosPickerId] = useState<string | null>(null);
  const [dealPlayer, setDealPlayer] = useState<Player | null>(null);
  const [dealMode, setDealMode] = useState<'sell' | 'loan' | null>(null);
  const [dealAmount, setDealAmount] = useState('');
  const [dealSeasons, setDealSeasons] = useState('1');
  const [dealFeedback, setDealFeedback] = useState<string | null>(null);
  const [negotiatePlayer, setNegotiatePlayer] = useState<Player | null>(null);
  const [negotiateFeedback, setNegotiateFeedback] = useState<string | null>(null);

  function openDeal(p: Player, mode: 'sell' | 'loan', e: React.MouseEvent) {
    e.stopPropagation();
    setDealPlayer(p);
    setDealMode(mode);
    setDealAmount((p.marketValue / 1000).toFixed(1));
    setDealSeasons('1');
  }

  function confirmDeal() {
    if (!dealPlayer || !dealMode) return;
    const millions = parseFloat(dealAmount);
    if (isNaN(millions) || millions < 0) return;
    const amt = Math.round(millions * 1000);
    if (dealMode === 'sell') {
      const r = sellPlayerDirectly(dealPlayer.id, amt);
      const msgs: Record<string, string> = {
        ok: `✓ ${dealPlayer.name} vendido por R$ ${millions.toFixed(1)}M!`,
        no_buyer: 'Nenhum time com budget suficiente encontrado. Tente um valor menor.',
        min_squad: 'Elenco mínimo atingido. Você precisa de mais jogadores antes de vender.',
        not_found: 'Jogador não encontrado.',
      };
      setDealFeedback(msgs[r] ?? r);
    } else {
      const fee = Math.round(millions * 1000);
      const seasons = Math.max(1, parseInt(dealSeasons) || 1);
      const r = loanPlayerOut(dealPlayer.id, fee, seasons);
      const msgs: Record<string, string> = {
        ok: `✓ ${dealPlayer.name} emprestado por ${seasons} temporada(s) a R$ ${millions.toFixed(1)}M/mês!`,
        min_squad: 'Elenco mínimo atingido.',
        not_found: 'Jogador não encontrado.',
      };
      setDealFeedback(msgs[r] ?? r);
    }
    setDealPlayer(null);
    setDealMode(null);
  }

  const captainId = save?.tacticalSetup?.captainId ?? null;

  if (!userTeam || !save) return null;

  function toggleStarter(playerId: string) {
    setSelected((prev) => {
      if (prev.includes(playerId)) return prev.filter((id) => id !== playerId);
      if (prev.length >= 11) return prev; // máximo 11
      return [...prev, playerId];
    });
  }

  function saveLineup() {
    if (selected.length !== 11) {
      alert('Você precisa escolher exatamente 11 jogadores titulares.');
      return;
    }
    setUserStarting11(selected);
    alert('Escalação salva.');
  }

  // Última nota de cada jogador (percorre matchRatings de trás para frente)
  const latestRatingMap: Record<string, number> = {};
  for (let i = (save.matchRatings ?? []).length - 1; i >= 0; i--) {
    const mr = save.matchRatings[i];
    for (const [pid, rating] of Object.entries(mr.ratings)) {
      if (!(pid in latestRatingMap)) latestRatingMap[pid] = rating;
    }
  }

  const grouped = POSITION_ORDER.reduce<Record<Position, Player[]>>((acc, pos) => {
    acc[pos] = userTeam.squad
      .filter((p) => p.position === pos)
      .sort((a, b) => b.overall - a.overall);
    return acc;
  }, { GK: [], DF: [], MF: [], FW: [] });

  return (
    <div className="space-y-4">
      {dealFeedback && (
        <div className="panel p-4 border border-pitch-500/40 bg-pitch-900/20 flex items-center justify-between gap-3 text-sm text-pitch-300">
          <span>{dealFeedback}</span>
          <button onClick={() => setDealFeedback(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="panel p-5 flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-white/50">Elenco</div>
          <h2 className="display-font text-3xl">{userTeam.name}</h2>
          <div className="text-sm text-white/60">
            Formação atual: <span className="text-white">{userTeam.formation}</span> ·
            Selecionados: <span className="text-white">{selected.length}/11</span> ·
            Elenco:{' '}
            <span className={userTeam.squad.length >= 35 ? 'text-red-400 font-bold' : userTeam.squad.length >= 32 ? 'text-yellow-400' : 'text-white'}>
              {userTeam.squad.length}/35
            </span>
          </div>
        </div>
        <button onClick={saveLineup} className="btn-primary">
          Salvar escalação
        </button>
      </div>

      {POSITION_ORDER.map((pos) => (
        <div key={pos} className="panel p-4">
          <h3 className="display-font text-xl mb-3">{POSITION_LABEL[pos]}</h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {grouped[pos].map((p) => {
              const isStarter = selected.includes(p.id);
              const contractExpired  = p.contractUntil < save.season;
              const contractExpiring = !contractExpired && p.contractUntil <= save.season + 1;
              const contractColor = contractExpired ? 'text-red-400' : contractExpiring ? 'text-yellow-400' : 'text-white/40';
              const leavingFree = p.leavingFree === true;
              const hasProneness = (p.injuryProneness ?? 0) >= 30;
              const proneLevel = (p.injuryProneness ?? 0) >= 60 ? 'alto' : 'médio';
              return (
                <li
                  key={p.id}
                  onClick={() => toggleStarter(p.id)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                    isStarter ? 'bg-pitch-500/20 border border-pitch-500/40' : 'bg-white/5 hover:bg-white/10 border border-transparent'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-midnight-700 flex items-center justify-center font-bold text-sm shrink-0">
                    {p.overall}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate flex items-center gap-1">
                      {isStarter && <Star className="w-3 h-3 text-gold-500 fill-gold-500" />}
                      {p.id === captainId && <Crown className="w-3 h-3 text-yellow-400" aria-label="Capitão" />}
                      {(contractExpired || contractExpiring) && !leavingFree && <AlertTriangle className={`w-3 h-3 ${contractExpired ? 'text-red-400' : 'text-yellow-400'}`} />}
                      {leavingFree && <span className="text-[9px] bg-red-500/20 text-red-400 px-1 py-0.5 rounded font-medium leading-none">Sai livre</span>}
                      {hasProneness && <span className={`text-[9px] px-1 py-0.5 rounded font-medium leading-none ${proneLevel === 'alto' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'}`} title={`Histórico de lesões — risco ${proneLevel}`}>🩹 {proneLevel === 'alto' ? 'Alto risco' : 'Risco'}</span>}
                      {p.name}
                    </div>
                    <div className="text-xs text-white/50">
                      {p.age} anos · Contrato: <span className={contractColor}>{p.contractUntil}</span>
                      {p.releaseClause && <span className="ml-2 text-blue-400" title={`Cláusula rescisória: R$ ${(p.releaseClause / 1000).toFixed(1)}M`}>🔒 R$ {(p.releaseClause / 1000).toFixed(1)}M</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/60">
                    {latestRatingMap[p.id] !== undefined && (
                      <span className={`font-bold px-1.5 py-0.5 rounded text-white ${
                        latestRatingMap[p.id] >= 9 ? 'bg-yellow-500' :
                        latestRatingMap[p.id] >= 7 ? 'bg-green-600' :
                        latestRatingMap[p.id] >= 5 ? 'bg-yellow-700' : 'bg-red-600'
                      }`} title="Nota última partida">
                        {latestRatingMap[p.id]}
                      </span>
                    )}
                    <span title="Moral" className="flex items-center gap-1">
                      <Heart className="w-3 h-3" /> {p.morale}
                    </span>
                    <span title="Físico" className="flex items-center gap-1">
                      <Activity className="w-3 h-3" /> {p.fitness}
                    </span>

                    {/* Vender / Emprestar */}
                    <button
                      title="Vender jogador"
                      className="flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-white/10 text-white/40 hover:text-green-400 hover:border-green-500/40 transition-colors"
                      onClick={(e) => openDeal(p, 'sell', e)}
                    >
                      <DollarSign className="w-3 h-3" />
                    </button>
                    <button
                      title="Emprestar jogador"
                      className="flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-white/10 text-white/40 hover:text-blue-400 hover:border-blue-500/40 transition-colors"
                      onClick={(e) => openDeal(p, 'loan', e)}
                    >
                      <ArrowLeftRight className="w-3 h-3" />
                    </button>

                    {/* Seletor de posição */}
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                      <button
                        title="Alterar posição"
                        className={`px-2 py-0.5 rounded border text-[10px] font-bold ${POS_COLOR[p.position]}`}
                        onClick={() => setPosPickerId(posPickerId === p.id ? null : p.id)}
                      >
                        {p.position}
                      </button>
                      {posPickerId === p.id && (
                        <div className="absolute right-0 top-6 z-20 flex gap-1 bg-midnight-800 border border-white/10 rounded-lg p-1 shadow-xl">
                          {POS_OPTIONS.map((pos) => (
                            <button
                              key={pos}
                              className={`px-2 py-1 rounded text-[10px] font-bold border ${
                                pos === p.position ? POS_COLOR[pos] : 'border-white/10 text-white/50 hover:bg-white/10'
                              }`}
                              onClick={() => {
                                changePlayerPosition(p.id, pos);
                                setPosPickerId(null);
                              }}
                            >
                              {pos}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {(contractExpired || contractExpiring) && !leavingFree && (
                      <button
                        title="Negociar renovação de contrato"
                        className="flex items-center gap-1 px-2 py-0.5 bg-pitch-500/20 border border-pitch-500/40 rounded hover:bg-pitch-500/30 text-pitch-300"
                        onClick={(e) => { e.stopPropagation(); setNegotiatePlayer(p); setNegotiateFeedback(null); }}
                      >
                        <FileText className="w-3 h-3" /> Negociar
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      {/* Academia (base) */}
      {save.youthPlayers && save.youthPlayers.length > 0 && (
        <div className="panel p-4">
          <h3 className="display-font text-xl mb-1 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-pitch-400" /> Base / Academia
          </h3>
          <p className="text-xs text-white/50 mb-3">Jovens promissores prontos para subir ao time principal.</p>
          <ul className="space-y-2">
            {save.youthPlayers.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-3 py-2 bg-white/5 rounded-lg border border-white/5">
                <div className="w-10 h-10 rounded-full bg-midnight-700 flex items-center justify-center font-bold text-sm">
                  {p.overall}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{p.name}</div>
                  <div className="text-xs text-white/50">
                    {p.position} · {p.age} anos · OVR {p.overall}
                    {p.potential !== undefined && (
                      <span className="text-pitch-400 ml-1">/ POT {p.potential}</span>
                    )}
                  </div>
                </div>
                <button
                  className="btn-primary text-xs px-3 py-1 flex items-center gap-1"
                  onClick={() => promoteYouthPlayer(p.id)}
                >
                  <ArrowUpCircle className="w-3 h-3" /> Promover
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {/* Modal negociar contrato */}
      {negotiatePlayer && (() => {
        const p = negotiatePlayer;
        const demandPct = p.overall >= 86 ? 0.50 : p.overall >= 81 ? 0.30 : p.overall >= 71 ? 0.20 : 0.12;
        const wageFullDemand = Math.round(p.wageMonthly * (1 + demandPct));
        const wageCounter   = Math.round(p.wageMonthly * (1 + demandPct * 0.55));
        const wageMinimal   = Math.round(p.wageMonthly * 1.06);

        function handleChoice(choice: 'full' | 'counter' | 'minimal' | 'refuse') {
          const result = negotiateContract(p.id, choice);
          if (result === 'ok') {
            setNegotiatePlayer(null);
            const labels: Record<string, string> = {
              full:    `✓ Contrato renovado — ${p.name} aceitou a proposta completa.`,
              counter: `✓ Contrato renovado com contraproposta — ${p.name} aceitou.`,
              minimal: `✓ Contrato renovado com reajuste mínimo.`,
              refuse:  `${p.name} marcado para sair no final do contrato.`,
            };
            setDealFeedback(labels[choice] ?? '✓ Ok');
          } else if (result === 'refused') {
            setNegotiateFeedback(`${p.name} rejeitou a proposta — vai sair ao final do contrato.`);
          } else if (result === 'no_budget') {
            setNegotiateFeedback('Saldo insuficiente para pagar o bônus de assinatura.');
          } else {
            setNegotiatePlayer(null);
          }
        }

        return (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="panel p-6 w-full max-w-sm space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-bold text-lg">{p.name}</div>
                  <div className="text-xs text-white/50">
                    {p.position} · {p.age} anos · OVR {p.overall} · Atual: R$ {p.wageMonthly}k/mês
                  </div>
                </div>
                <button onClick={() => setNegotiatePlayer(null)}><X className="w-5 h-5 text-white/50" /></button>
              </div>

              <div className="text-xs text-white/50 border-b border-white/10 pb-2">
                Contrato expira em <span className="text-yellow-400 font-semibold">{p.contractUntil}</span> · Temporada atual: {save.season}
              </div>

              {negotiateFeedback && (
                <div className="text-xs bg-red-500/10 border border-red-500/30 text-red-300 rounded px-3 py-2">
                  {negotiateFeedback}
                </div>
              )}

              <div className="space-y-2">
                <button
                  className="w-full text-left px-4 py-3 rounded-lg border border-pitch-500/40 bg-pitch-500/10 hover:bg-pitch-500/20 transition-colors"
                  onClick={() => handleChoice('full')}
                >
                  <div className="text-sm font-semibold text-pitch-300">Aceitar exigência</div>
                  <div className="text-xs text-white/50 mt-0.5">
                    R$ {wageFullDemand}k/mês · 3 anos · Bônus: R$ {p.wageMonthly}k
                  </div>
                </button>

                <button
                  className="w-full text-left px-4 py-3 rounded-lg border border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
                  onClick={() => handleChoice('counter')}
                >
                  <div className="text-sm font-semibold text-blue-300">Contraproposta</div>
                  <div className="text-xs text-white/50 mt-0.5">
                    R$ {wageCounter}k/mês · 2 anos · Jogador pode recusar
                  </div>
                </button>

                <button
                  className="w-full text-left px-4 py-3 rounded-lg border border-yellow-600/40 bg-yellow-600/10 hover:bg-yellow-600/20 transition-colors"
                  onClick={() => handleChoice('minimal')}
                >
                  <div className="text-sm font-semibold text-yellow-300">Reajuste mínimo (+6%)</div>
                  <div className="text-xs text-white/50 mt-0.5">
                    R$ {wageMinimal}k/mês · 1 ano · Jogador pode recusar
                  </div>
                </button>

                <button
                  className="w-full text-left px-4 py-3 rounded-lg border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 transition-colors"
                  onClick={() => handleChoice('refuse')}
                >
                  <div className="text-sm font-semibold text-red-400">Recusar negociação</div>
                  <div className="text-xs text-white/50 mt-0.5">
                    Jogador marcado para sair livre no fim do contrato
                  </div>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal vender / emprestar */}
      {dealPlayer && dealMode && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="panel p-6 w-full max-w-sm space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-bold text-lg">{dealPlayer.name}</div>
                <div className="text-xs text-white/50">
                  {dealPlayer.position} · {dealPlayer.age} anos · Overall {dealPlayer.overall}
                </div>
              </div>
              <button onClick={() => setDealPlayer(null)}><X className="w-5 h-5 text-white/50" /></button>
            </div>

            <div className="flex gap-2">
              <button
                className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${dealMode === 'sell' ? 'bg-green-600/20 border-green-500/50 text-green-300' : 'border-white/10 text-white/40 hover:bg-white/5'}`}
                onClick={() => setDealMode('sell')}
              >
                <DollarSign className="w-4 h-4 inline mr-1" /> Vender
              </button>
              <button
                className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${dealMode === 'loan' ? 'bg-blue-600/20 border-blue-500/50 text-blue-300' : 'border-white/10 text-white/40 hover:bg-white/5'}`}
                onClick={() => setDealMode('loan')}
              >
                <ArrowLeftRight className="w-4 h-4 inline mr-1" /> Emprestar
              </button>
            </div>

            <div className="text-xs text-white/40">
              Valor de mercado: <span className="text-gold-400 font-semibold">R$ {(dealPlayer.marketValue / 1000).toFixed(1)}M</span>
            </div>

            <div>
              <label className="text-xs text-white/50 mb-1 block">
                {dealMode === 'sell' ? 'Preço de venda (R$ M)' : 'Taxa mensal (R$ M/mês)'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-white/40">R$</span>
                <input
                  type="number" step="0.1" min="0"
                  value={dealAmount}
                  onChange={(e) => setDealAmount(e.target.value)}
                  className="w-full bg-midnight-700 border border-white/10 rounded-lg pl-9 pr-10 py-2 text-sm text-white"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-white/40">M</span>
              </div>
            </div>

            {dealMode === 'loan' && (
              <div>
                <label className="text-xs text-white/50 mb-1 block">Duração (temporadas)</label>
                <div className="flex gap-2">
                  {[1, 2, 3].map((s) => (
                    <button
                      key={s}
                      className={`flex-1 py-2 text-sm rounded-lg border ${dealSeasons === String(s) ? 'bg-blue-600/20 border-blue-500/50 text-blue-300' : 'border-white/10 text-white/40 hover:bg-white/5'}`}
                      onClick={() => setDealSeasons(String(s))}
                    >
                      {s} temp.
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button className="btn-primary w-full" onClick={confirmDeal}>
              Confirmar {dealMode === 'sell' ? 'venda' : 'empréstimo'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
