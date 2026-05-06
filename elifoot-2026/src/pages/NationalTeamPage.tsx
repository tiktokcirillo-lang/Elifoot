import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Flag, Users, Activity, CheckCircle, XCircle, LogOut } from 'lucide-react';

type Tab = 'convocation' | 'results';

export default function NationalTeamPage() {
  const save = useGameStore((s) => s.save);
  const acceptOffer = useGameStore((s) => s.acceptNationalTeamOffer);
  const rejectOffer = useGameStore((s) => s.rejectNationalTeamOffer);
  const resignNt = useGameStore((s) => s.resignNationalTeam);
  const updateSquad = useGameStore((s) => s.updateNationalTeamSquad);
  const [tab, setTab] = useState<Tab>('convocation');

  if (!save) return null;

  // Offer pending
  if (save.nationalTeamOffer && !save.isNationalTeamManager) {
    const offer = save.nationalTeamOffer;
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Flag className="w-5 h-5 text-yellow-400" />
          Convite de Seleção Nacional
        </h1>
        <div className="panel p-6 text-center space-y-4 max-w-lg mx-auto">
          <div className="text-4xl">🏆</div>
          <h2 className="text-lg font-semibold">{offer.teamName}</h2>
          <p className="text-white/60 text-sm">
            A {offer.teamName} está à procura de um técnico e quer você no comando. Salário: R$ {offer.salary}k/mês.
          </p>
          <p className="text-white/40 text-xs">Oferta válida até o dia {offer.expiresAt}.</p>
          <div className="flex gap-3 justify-center pt-2">
            <button
              onClick={acceptOffer}
              className="btn-primary flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" /> Aceitar
            </button>
            <button
              onClick={rejectOffer}
              className="btn-ghost flex items-center gap-2"
            >
              <XCircle className="w-4 h-4" /> Recusar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!save.isNationalTeamManager) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Flag className="w-5 h-5 text-white/40" />
          Seleção Nacional
        </h1>
        <div className="panel p-8 text-center text-white/40 space-y-2">
          <Flag className="w-10 h-10 mx-auto opacity-30" />
          <p>Você ainda não é técnico de nenhuma seleção nacional.</p>
          <p className="text-sm">Construa sua reputação (mínimo 2000 pts) para receber um convite.</p>
          <p className="text-sm mt-2">
            Sua reputação atual:{' '}
            <span className="text-white font-semibold">{save.managerReputation ?? 0} pts</span>
          </p>
        </div>
      </div>
    );
  }

  // Manager of national team
  const ntCountry = save.nationalTeamCountry ?? 'BR';
  const ntName = ntCountry === 'BR' ? 'Seleção Brasileira' : `Seleção ${ntCountry}`;

  // All eligible players (same nationality)
  const allPlayers = save.teams
    .filter((t) => !t.isUserControlled)
    .flatMap((t) => t.squad.map((p) => ({ ...p, teamName: t.name })));
  // Also add user team players
  const userTeam = save.teams.find((t) => t.isUserControlled);
  if (userTeam) {
    userTeam.squad.forEach((p) => allPlayers.push({ ...p, teamName: userTeam.name }));
  }

  const eligible = allPlayers
    .filter((p) => (p.nationality ?? 'BR') === ntCountry)
    .sort((a, b) => b.overall - a.overall);

  const squadIds = new Set(save.nationalTeamSquad ?? []);

  function togglePlayer(id: string) {
    const current = save!.nationalTeamSquad ?? [];
    if (current.includes(id)) {
      updateSquad(current.filter((x) => x !== id));
    } else if (current.length < 23) {
      updateSquad([...current, id]);
    }
  }

  const results = (save.nationalTeamResults ?? []).slice().reverse();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Flag className="w-5 h-5 text-yellow-400" />
          {ntName}
        </h1>
        <button
          onClick={resignNt}
          className="btn-ghost text-xs flex items-center gap-1.5 text-red-400 hover:text-red-300"
        >
          <LogOut className="w-3.5 h-3.5" /> Deixar seleção
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-midnight-800 p-1 rounded-lg w-fit">
        {([['convocation', <Users className="w-4 h-4" />, 'Convocação'], ['results', <Activity className="w-4 h-4" />, 'Resultados']] as const).map(([key, icon, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-colors ${
              tab === key ? 'bg-pitch-600 text-white' : 'text-white/50 hover:text-white'
            }`}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {tab === 'convocation' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-white/50">
            <span>Convocados: <span className="text-white font-semibold">{squadIds.size}/23</span></span>
            <span>Clique para (des)convocar</span>
          </div>
          <div className="panel divide-y divide-white/5">
            {eligible.length === 0 && (
              <div className="p-6 text-center text-white/40 text-sm">Nenhum jogador elegível encontrado.</div>
            )}
            {eligible.map((p) => {
              const called = squadIds.has(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => togglePlayer(p.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-white/5 ${
                    called ? 'bg-pitch-500/10' : ''
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs flex-shrink-0 ${
                    called ? 'border-pitch-500 bg-pitch-500' : 'border-white/20'
                  }`}>
                    {called && '✓'}
                  </span>
                  <span className="flex-1 text-left font-medium">{p.name}</span>
                  <span className="text-white/40 text-xs w-8 text-center">{p.position}</span>
                  <span className="text-white/40 text-xs w-20 text-right truncate">{p.teamName}</span>
                  <span className="text-white font-semibold w-8 text-right">{p.overall}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'results' && (
        <div className="panel divide-y divide-white/5">
          {results.length === 0 && (
            <div className="p-8 text-center text-white/40 text-sm">
              Nenhum jogo disputado ainda.<br />
              A seleção joga automaticamente nas datas FIFA (a cada 28 dias).
            </div>
          )}
          {results.map((r) => {
            const outcome = r.goals > r.opponentGoals ? 'V' : r.goals < r.opponentGoals ? 'D' : 'E';
            const outcomeColor = outcome === 'V' ? 'text-green-400' : outcome === 'D' ? 'text-red-400' : 'text-yellow-400';
            return (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                <span className={`font-bold w-5 text-center ${outcomeColor}`}>{outcome}</span>
                <div className="flex-1">
                  <div className="font-medium">
                    {r.isHome ? ntName : r.opponentName} {r.goals}–{r.opponentGoals} {r.isHome ? r.opponentName : ntName}
                  </div>
                  <div className="text-xs text-white/40">Temporada {r.season} · Dia {r.turn}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
