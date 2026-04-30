import { useState } from 'react';
import { useGameStore, isTransferWindowOpen } from '@/store/gameStore';
import type { Player } from '@/types';
import { ShoppingCart, X, Tag, ArrowRightLeft, ChevronDown, ChevronUp, Lock } from 'lucide-react';

type Tab = 'market' | 'my_players' | 'my_bids';

export default function TransferPage() {
  const [tab, setTab] = useState<Tab>('market');
  const save = useGameStore((s) => s.save);

  if (!save) return null;

  const windowOpen = isTransferWindowOpen(save.currentTurn);
  const closedMessage =
    save.currentTurn < 133
      ? `Próxima janela: meio da temporada (turno 133)`
      : `Próxima janela: pré-temporada da próxima temporada`;

  return (
    <div className="space-y-4">
      <div className="panel p-5">
        <div className="text-xs uppercase tracking-wider text-white/50">Fase 2-4</div>
        <h2 className="display-font text-3xl">Mercado de Transferências</h2>
        <div className="text-sm text-white/60">Dia atual: {save.currentTurn}</div>
      </div>

      {/* Janela de transferências */}
      {windowOpen ? (
        <div className="panel p-3 border border-pitch-500/40 bg-pitch-900/20 flex items-center gap-2 text-sm text-pitch-400">
          <ArrowRightLeft className="w-4 h-4 shrink-0" />
          Janela de transferências <strong>aberta</strong> — negocie até o turno {save.currentTurn <= 28 ? 28 : 161}.
        </div>
      ) : (
        <div className="panel p-3 border border-white/10 flex items-center gap-2 text-sm text-white/50">
          <Lock className="w-4 h-4 shrink-0" />
          Janela fechada. {closedMessage}.
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-midnight-800 rounded-lg p-1">
        {(['market', 'my_players', 'my_bids'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 text-sm py-2 rounded-md transition-colors ${
              tab === t ? 'bg-pitch-600 text-white font-semibold' : 'text-white/60 hover:text-white'
            }`}
          >
            {t === 'market' ? 'Disponíveis' : t === 'my_players' ? 'Meus Jogadores' : 'Minhas Ofertas'}
          </button>
        ))}
      </div>

      {tab === 'market' && <MarketTab windowOpen={windowOpen} />}
      {tab === 'my_players' && <MyPlayersTab windowOpen={windowOpen} />}
      {tab === 'my_bids' && <MyBidsTab />}
    </div>
  );
}

// ── Aba: Mercado (jogadores de IA à venda) ────────────────────

function MarketTab({ windowOpen }: { windowOpen: boolean }) {
  const save = useGameStore((s) => s.save)!;
  const makeBid = useGameStore((s) => s.makeBid);
  const [bidAmounts, setBidAmounts] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<string | null>(null);

  const openListings = (save.transferMarket ?? []).filter(
    (l) => l.status === 'open' && l.fromTeamId !== save.controlledTeamId,
  );

  if (openListings.length === 0) {
    return (
      <div className="panel p-8 text-center text-white/40">
        Nenhum jogador disponível no momento. Avance alguns turnos.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {openListings.map((listing) => {
        const sellerTeam = save.teams.find((t) => t.id === listing.fromTeamId);
        const player = sellerTeam?.squad.find((p) => p.id === listing.playerId);
        if (!player || !sellerTeam) return null;

        const userBid = listing.bids.find((b) => b.fromTeamId === save.controlledTeamId);
        const isExpanded = expanded === listing.id;

        return (
          <div key={listing.id} className="panel p-4">
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => setExpanded(isExpanded ? null : listing.id)}
            >
              <PlayerBadge player={player} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">{player.name}</div>
                <div className="text-xs text-white/50">
                  {player.position} · {player.age} anos · Overall {player.overall}
                </div>
                <div className="text-xs text-white/40">{sellerTeam.name}</div>
              </div>
              <div className="text-right">
                <div className="text-gold-400 font-semibold text-sm">
                  R$ {(listing.askingPrice / 1000).toFixed(1)}M
                </div>
                {userBid && (
                  <div className="text-xs text-pitch-400">Oferta enviada</div>
                )}
              </div>
              {isExpanded ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
            </div>

            {isExpanded && !userBid && (
              <div className="mt-3 pt-3 border-t border-white/10">
                <PlayerStats player={player} />
                <div className="flex gap-2 mt-3">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-white/40">R$</span>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder={`${(listing.askingPrice / 1000).toFixed(1)}`}
                      value={bidAmounts[listing.id] ?? ''}
                      onChange={(e) => setBidAmounts((prev) => ({ ...prev, [listing.id]: e.target.value }))}
                      className="w-full bg-midnight-700 border border-white/10 rounded-lg pl-9 pr-10 py-2 text-sm text-white"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-white/40">M</span>
                  </div>
                  <button
                    className="btn-primary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    disabled={!windowOpen}
                    title={!windowOpen ? 'Janela de transferências fechada' : undefined}
                    onClick={() => {
                      const millions = parseFloat(bidAmounts[listing.id] ?? '0');
                      const amt = Math.round(millions * 1000);
                      if (amt > 0) {
                        makeBid(listing.id, amt);
                        setBidAmounts((prev) => ({ ...prev, [listing.id]: '' }));
                      }
                    }}
                  >
                    <ShoppingCart className="w-4 h-4" /> Ofertar
                  </button>
                </div>
              </div>
            )}

            {isExpanded && userBid && (
              <div className="mt-3 pt-3 border-t border-white/10">
                <PlayerStats player={player} />
                <div className="mt-2 text-sm text-pitch-400">
                  Sua oferta: R$ {(userBid.amount / 1000).toFixed(1)}M — Status: {userBid.status === 'pending' ? 'Aguardando' : userBid.status === 'accepted' ? 'Aceita' : 'Recusada'}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Aba: Meus Jogadores ───────────────────────────────────────

function MyPlayersTab({ windowOpen }: { windowOpen: boolean }) {
  const save = useGameStore((s) => s.save)!;
  const listPlayerForSale = useGameStore((s) => s.listPlayerForSale);
  const withdrawListing = useGameStore((s) => s.withdrawListing);
  const acceptBid = useGameStore((s) => s.acceptBid);
  const rejectBid = useGameStore((s) => s.rejectBid);
  const [prices, setPrices] = useState<Record<string, string>>({});

  const userTeam = save.teams.find((t) => t.id === save.controlledTeamId)!;
  const myListings = (save.transferMarket ?? []).filter(
    (l) => l.fromTeamId === save.controlledTeamId && l.status === 'open',
  );
  const listedPlayerIds = new Set(myListings.map((l) => l.playerId));

  return (
    <div className="space-y-4">
      {/* Ofertas recebidas */}
      {myListings.some((l) => l.bids.some((b) => b.status === 'pending')) && (
        <div className="panel p-4 border border-gold-500/30">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Tag className="w-4 h-4 text-gold-400" /> Ofertas recebidas
          </h3>
          {myListings.map((listing) => {
            const player = userTeam.squad.find((p) => p.id === listing.playerId);
            const pendingBids = listing.bids.filter((b) => b.status === 'pending');
            if (!player || pendingBids.length === 0) return null;
            return (
              <div key={listing.id} className="mb-3">
                <div className="text-sm font-semibold mb-1">{player.name}</div>
                {pendingBids.map((bid) => {
                  const bidder = save.teams.find((t) => t.id === bid.fromTeamId);
                  return (
                    <div key={bid.id} className="flex items-center gap-2 text-sm py-1">
                      <span className="text-white/70">{bidder?.name ?? 'Clube'}</span>
                      <span className="text-gold-400 font-semibold">R$ {(bid.amount / 1000).toFixed(1)}M</span>
                      <div className="ml-auto flex gap-2">
                        <button
                          className="btn-primary text-xs px-3 py-1"
                          onClick={() => acceptBid(listing.id, bid.id)}
                        >
                          Aceitar
                        </button>
                        <button
                          className="btn-ghost text-xs px-3 py-1"
                          onClick={() => rejectBid(listing.id, bid.id)}
                        >
                          Recusar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* Lista do elenco */}
      <div className="panel divide-y divide-white/5">
        {userTeam.squad
          .slice()
          .sort((a, b) => b.overall - a.overall)
          .map((player) => {
            const isListed = listedPlayerIds.has(player.id);
            const listing = myListings.find((l) => l.playerId === player.id);
            return (
              <div key={player.id} className="flex items-center gap-3 px-4 py-3">
                <PlayerBadge player={player} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold">{player.name}</div>
                  <div className="text-xs text-white/50">
                    {player.position} · {player.age} anos · Overall {player.overall} · Valor R$ {(player.marketValue / 1000).toFixed(1)}M
                  </div>
                </div>
                {isListed ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gold-400">Listado</span>
                    <button
                      className="btn-ghost text-xs px-2 py-1"
                      onClick={() => listing && withdrawListing(listing.id)}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder={`${(player.marketValue / 1000).toFixed(1)}`}
                        value={prices[player.id] ?? ''}
                        onChange={(e) => setPrices((prev) => ({ ...prev, [player.id]: e.target.value }))}
                        className="w-28 bg-midnight-700 border border-white/10 rounded pl-1 pr-5 py-1 text-xs text-white"
                      />
                      <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-white/40">M</span>
                    </div>
                    <button
                      className="btn-primary text-xs px-2 py-1 disabled:opacity-40 disabled:cursor-not-allowed"
                      disabled={!windowOpen}
                      title={!windowOpen ? 'Janela de transferências fechada' : undefined}
                      onClick={() => {
                        const millions = parseFloat(prices[player.id] ?? '0');
                        const price = Math.round(millions * 1000);
                        if (price > 0) {
                          listPlayerForSale(player.id, price);
                          setPrices((prev) => ({ ...prev, [player.id]: '' }));
                        }
                      }}
                    >
                      <ArrowRightLeft className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}

// ── Aba: Minhas Ofertas ───────────────────────────────────────

function MyBidsTab() {
  const save = useGameStore((s) => s.save)!;

  const myBids = (save.transferMarket ?? [])
    .filter((l) => l.bids.some((b) => b.fromTeamId === save.controlledTeamId))
    .map((l) => ({
      listing: l,
      bid: l.bids.find((b) => b.fromTeamId === save.controlledTeamId)!,
    }));

  if (myBids.length === 0) {
    return (
      <div className="panel p-8 text-center text-white/40">
        Você não fez nenhuma oferta ainda.
      </div>
    );
  }

  return (
    <div className="panel divide-y divide-white/5">
      {myBids.map(({ listing, bid }) => {
        const sellerTeam = save.teams.find((t) => t.id === listing.fromTeamId);
        const player = sellerTeam?.squad.find((p) => p.id === listing.playerId)
          ?? save.teams.flatMap((t) => t.squad).find((p) => p.id === listing.playerId);
        if (!player) return null;

        const statusColor =
          bid.status === 'accepted' ? 'text-green-400' :
          bid.status === 'rejected' ? 'text-red-400' : 'text-white/60';

        return (
          <div key={`${listing.id}-${bid.id}`} className="flex items-center gap-3 px-4 py-3">
            <PlayerBadge player={player} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold">{player.name}</div>
              <div className="text-xs text-white/50">{sellerTeam?.name}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-gold-400">R$ {(bid.amount / 1000).toFixed(1)}M</div>
              <div className={`text-xs capitalize ${statusColor}`}>
                {bid.status === 'pending' ? 'Aguardando' : bid.status === 'accepted' ? 'Aceita' : 'Recusada'}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Componentes auxiliares ────────────────────────────────────

function PlayerBadge({ player }: { player: Player }) {
  const colors: Record<string, string> = {
    GK: 'bg-yellow-600', DF: 'bg-blue-700', MF: 'bg-green-700', FW: 'bg-red-700',
  };
  return (
    <div
      className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold ${colors[player.position] ?? 'bg-midnight-600'}`}
    >
      <div className="text-center leading-tight">
        <div>{player.position}</div>
        <div className="text-[10px]">{player.overall}</div>
      </div>
    </div>
  );
}

function PlayerStats({ player }: { player: Player }) {
  return (
    <div className="grid grid-cols-5 gap-2 text-xs text-center">
      {[
        { label: 'ATK', value: player.attack },
        { label: 'DEF', value: player.defense },
        { label: 'VEL', value: player.pace },
        { label: 'TEC', value: player.technique },
        { label: 'FIS', value: player.stamina },
      ].map(({ label, value }) => (
        <div key={label} className="bg-midnight-700 rounded p-1">
          <div className="text-white/50">{label}</div>
          <div className="font-bold">{value}</div>
        </div>
      ))}
    </div>
  );
}
