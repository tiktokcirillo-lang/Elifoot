import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import type { Team, Player, SaveGame } from '@/types';
import TeamBadge from '@/components/TeamBadge';
import { Search, X, ShoppingCart, ChevronLeft } from 'lucide-react';

const POS_ORDER = ['GK', 'DF', 'MF', 'FW'] as const;
const POS_LABEL: Record<string, string> = { GK: 'Goleiro', DF: 'Defensor', MF: 'Meio-campo', FW: 'Atacante' };
const STAT_LABEL: Array<{ key: keyof Player; label: string }> = [
  { key: 'attack', label: 'ATK' },
  { key: 'defense', label: 'DEF' },
  { key: 'pace', label: 'PAC' },
  { key: 'technique', label: 'TEC' },
];

type CompGroup = { label: string; teamIds: string[] };

function useCompGroups(save: SaveGame | null) {
  if (!save) return [] as CompGroup[];
  const groups: CompGroup[] = [];
  for (const comp of save.competitions) {
    if (comp.teamIds.length > 0) {
      groups.push({ label: comp.name, teamIds: comp.teamIds });
    }
  }
  // deduplicate teams across groups — show each team only in first comp it appears
  const seen = new Set<string>();
  return groups.map((g) => ({
    ...g,
    teamIds: g.teamIds.filter((id) => {
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    }),
  })).filter((g) => g.teamIds.length > 0);
}

export default function TeamsPage() {
  const save = useGameStore((s) => s.save);
  const makeDirectOffer = useGameStore((s) => s.makeDirectOffer);
  const [search, setSearch] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [offerPlayer, setOfferPlayer] = useState<Player | null>(null);
  const [offerAmount, setOfferAmount] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!save) return null;

  const groups = useCompGroups(save);
  const userTeamId = save.controlledTeamId;

  const filteredGroups = search.trim()
    ? [{
        label: 'Resultados',
        teamIds: save.teams
          .filter((t) =>
            t.id !== userTeamId &&
            (t.name.toLowerCase().includes(search.toLowerCase()) ||
             t.shortName.toLowerCase().includes(search.toLowerCase()))
          )
          .map((t) => t.id),
      }]
    : groups.map((g) => ({ ...g, teamIds: g.teamIds.filter((id) => id !== userTeamId) }))
         .filter((g) => g.teamIds.length > 0);

  function handleOffer() {
    if (!offerPlayer || !selectedTeam) return;
    const millions = parseFloat(offerAmount);
    if (isNaN(millions) || millions <= 0) return;
    const amt = Math.round(millions * 1000);
    const result = makeDirectOffer(offerPlayer.id, selectedTeam.id, amt);
    if (result === 'ok') {
      setFeedback(`Proposta de R$ ${millions.toFixed(1)}M enviada para ${selectedTeam.name}!`);
    } else if (result === 'already_offered') {
      setFeedback('Você já fez uma proposta por este jogador.');
    } else if (result === 'no_budget') {
      setFeedback('Orçamento insuficiente.');
    } else {
      setFeedback('Jogador não encontrado.');
    }
    setOfferPlayer(null);
    setOfferAmount('');
  }

  return (
    <div className="space-y-4">
      <div className="panel p-5">
        <div className="text-xs uppercase tracking-wider text-white/50">Explorar</div>
        <h2 className="display-font text-3xl">Times &amp; Elencos</h2>
        <p className="text-sm text-white/50 mt-1">
          Clique em qualquer time para ver o elenco e fazer propostas diretamente.
        </p>
      </div>

      {feedback && (
        <div className="panel p-4 border border-pitch-500/40 bg-pitch-900/20 flex items-center justify-between gap-3 text-sm text-pitch-300">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Team detail view */}
      {selectedTeam ? (
        <TeamDetail
          team={selectedTeam}
          userTeamId={userTeamId}
          userBudget={save.teams.find((t) => t.id === userTeamId)?.budget ?? 0}
          onBack={() => setSelectedTeam(null)}
          onOfferPlayer={(p) => { setOfferPlayer(p); setOfferAmount((p.marketValue / 1000).toFixed(1)); }}
        />
      ) : (
        <>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder="Buscar time..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-midnight-800 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-pitch-500"
            />
          </div>

          {/* Team groups */}
          {filteredGroups.map((group) => (
            <div key={group.label} className="panel overflow-hidden">
              <div className="bg-white/5 px-4 py-2 text-xs uppercase tracking-wider font-semibold text-white/60">
                {group.label}
              </div>
              <div className="divide-y divide-white/5">
                {group.teamIds.map((id) => {
                  const team = save.teams.find((t) => t.id === id);
                  if (!team) return null;
                  return (
                    <button
                      key={id}
                      onClick={() => setSelectedTeam(team)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                    >
                      <TeamBadge team={team} size={32} />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate">{team.name}</div>
                        <div className="text-xs text-white/40">{team.city} · {team.squad.length} jogadores</div>
                      </div>
                      <div className="text-xs text-white/30">Ver elenco →</div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </>
      )}

      {/* Offer modal */}
      {offerPlayer && selectedTeam && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="panel p-6 w-full max-w-sm space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-bold text-lg">{offerPlayer.name}</div>
                <div className="text-xs text-white/50">
                  {POS_LABEL[offerPlayer.position]} · Overall {offerPlayer.overall} · {offerPlayer.age} anos
                </div>
              </div>
              <button onClick={() => setOfferPlayer(null)}><X className="w-5 h-5 text-white/50" /></button>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              {STAT_LABEL.map(({ key, label }) => (
                <div key={key} className="bg-white/5 rounded-lg p-2">
                  <div className="text-white/40 uppercase">{label}</div>
                  <div className="font-bold text-white">{offerPlayer[key] as number}</div>
                </div>
              ))}
            </div>

            <div className="text-xs text-white/50">
              Valor de mercado estimado: <span className="text-gold-400 font-semibold">R$ {(offerPlayer.marketValue / 1000).toFixed(1)}M</span>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-white/40">R$</span>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={offerAmount}
                  onChange={(e) => setOfferAmount(e.target.value)}
                  className="w-full bg-midnight-700 border border-white/10 rounded-lg pl-9 pr-10 py-2 text-sm text-white"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-white/40">M</span>
              </div>
              <button
                className="btn-primary flex items-center gap-2"
                onClick={handleOffer}
              >
                <ShoppingCart className="w-4 h-4" /> Propor
              </button>
            </div>
            <p className="text-[11px] text-white/30">
              Propostas acima de 90% do valor são aceitas automaticamente. Abaixo de 60% são rejeitadas imediatamente.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function TeamDetail({
  team, userTeamId, userBudget, onBack, onOfferPlayer,
}: {
  team: Team;
  userTeamId: string;
  userBudget: number;
  onBack: () => void;
  onOfferPlayer: (p: Player) => void;
}) {
  const isOwnTeam = team.id === userTeamId;
  const byPos = POS_ORDER.map((pos) => ({
    pos,
    players: team.squad.filter((p) => p.position === pos).sort((a, b) => b.overall - a.overall),
  })).filter((g) => g.players.length > 0);

  return (
    <div className="space-y-3">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> Voltar para times
      </button>

      <div className="panel p-5 flex items-center gap-4">
        <TeamBadge team={team} size={52} />
        <div>
          <div className="font-bold text-xl">{team.name}</div>
          <div className="text-sm text-white/50">{team.city} · {team.squad.length} jogadores</div>
          <div className="text-xs text-white/30 mt-0.5">
            Orçamento: R$ {(team.budget / 1000).toFixed(0)}M
          </div>
        </div>
      </div>

      {byPos.map(({ pos, players }) => (
        <div key={pos} className="panel overflow-hidden">
          <div className="bg-white/5 px-4 py-2 text-xs uppercase tracking-wider font-semibold text-white/60">
            {POS_LABEL[pos]}
          </div>
          <div className="divide-y divide-white/5">
            {players.map((player) => (
              <div key={player.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-10 h-10 rounded-full bg-midnight-700 flex items-center justify-center text-sm font-bold text-white/80 shrink-0">
                  {player.overall}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{player.name}</div>
                  <div className="text-xs text-white/40">
                    {player.age} anos · Pot {player.potential} · R$ {(player.marketValue / 1000).toFixed(1)}M
                  </div>
                </div>
                <div className="flex gap-2 text-xs text-white/40 shrink-0">
                  <span>ATK {player.attack}</span>
                  <span>DEF {player.defense}</span>
                </div>
                {!isOwnTeam && (
                  <button
                    className="btn-primary text-xs px-3 py-1.5 shrink-0"
                    disabled={userBudget <= 0}
                    onClick={() => onOfferPlayer(player)}
                  >
                    Propor
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
