import { useGameStore } from '@/store/gameStore';
import { DollarSign, CheckCircle, XCircle, Clock, AlertCircle, TrendingUp, Users, Shirt } from 'lucide-react';
import type { SponsorOffer } from '@/types';
import { SLOT_LABELS, SLOT_COLORS } from '@/data/sponsors';

function fmtM(value: number) {
  return `R$ ${(value / 1000).toFixed(1)}M`;
}

const SLOT_ICONS: Record<string, React.ReactNode> = {
  master:    <DollarSign className="w-4 h-4" />,
  kit:       <Shirt className="w-4 h-4" />,
  secondary: <TrendingUp className="w-4 h-4" />,
};

function fanMultInfo(fanSatisfaction: number): { text: string; cls: string } | null {
  if (fanSatisfaction >= 85) return { text: `+20% receita de patrocínio (torcida: ${fanSatisfaction}%)`, cls: 'text-green-400 bg-green-500/10 border-green-500/20' };
  if (fanSatisfaction >= 70) return { text: `+10% receita de patrocínio (torcida: ${fanSatisfaction}%)`, cls: 'text-green-400/80 bg-green-500/5 border-green-500/10' };
  if (fanSatisfaction < 50)  return { text: `-10% receita de patrocínio (torcida: ${fanSatisfaction}%)`, cls: 'text-red-400 bg-red-500/10 border-red-500/20' };
  return null;
}

function statusBadge(status: SponsorOffer['status']) {
  switch (status) {
    case 'active':   return { text: 'Ativo',    cls: 'text-green-400 bg-green-500/10' };
    case 'pending':  return { text: 'Pendente', cls: 'text-yellow-400 bg-yellow-500/10' };
    case 'expired':  return { text: 'Expirado', cls: 'text-white/40 bg-white/5' };
    case 'rejected': return { text: 'Recusado', cls: 'text-red-400 bg-red-500/10' };
  }
}

interface SlotSectionProps {
  slot: 'master' | 'kit' | 'secondary';
  activeDeal: SponsorOffer | undefined;
  pendingOffers: SponsorOffer[];
  currentTurn: number;
  onAccept: (id: string) => void;
  onNegotiate: (id: string) => void;
  onReject: (id: string) => void;
}

function SlotSection({ slot, activeDeal, pendingOffers, currentTurn, onAccept, onNegotiate, onReject }: SlotSectionProps) {
  const weeklyActive = activeDeal ? Math.round(activeDeal.valuePerSeason / 40) : null;

  return (
    <div className="panel p-5">
      <h3 className={`font-semibold mb-4 flex items-center gap-2 ${SLOT_COLORS[slot].split(' ')[0]}`}>
        {SLOT_ICONS[slot]}
        {SLOT_LABELS[slot]}
      </h3>

      {/* Active contract */}
      {activeDeal ? (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {activeDeal.brandColor && (
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: activeDeal.brandColor }} />
              )}
              <span className="display-font text-lg">{activeDeal.brandName}</span>
              {activeDeal.brandCategory && (
                <span className="text-xs text-white/40 bg-white/5 px-1.5 py-0.5 rounded">{activeDeal.brandCategory}</span>
              )}
            </div>
            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Ativo</span>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="bg-white/5 rounded-lg p-2.5 text-center">
              <div className="text-white/40 text-[10px] mb-0.5">Por temporada</div>
              <div className="font-bold text-sm">{fmtM(activeDeal.valuePerSeason)}</div>
            </div>
            <div className="bg-white/5 rounded-lg p-2.5 text-center">
              <div className="text-white/40 text-[10px] mb-0.5">Por semana</div>
              <div className="font-bold text-sm text-green-400">R$ {weeklyActive?.toLocaleString('pt-BR')}k</div>
            </div>
            <div className="bg-white/5 rounded-lg p-2.5 text-center">
              <div className="text-white/40 text-[10px] mb-0.5">Válido até</div>
              <div className="font-bold text-sm">Temp. {activeDeal.activeUntil}</div>
            </div>
          </div>
          {activeDeal.bonuses && activeDeal.bonuses.length > 0 && (
            <div className="mt-3">
              <div className="text-[10px] text-white/40 mb-1.5 uppercase tracking-wider">Bônus por performance</div>
              <div className="flex flex-wrap gap-1.5">
                {activeDeal.bonuses.map((b, i) => (
                  <span key={i} className="text-xs bg-yellow-400/10 text-yellow-300 border border-yellow-400/20 px-2 py-0.5 rounded-full">
                    {b.description}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white/3 border border-white/8 rounded-xl p-4 text-center text-white/25 text-sm mb-4">
          <AlertCircle className="w-5 h-5 mx-auto mb-1 opacity-25" />
          Sem contrato ativo
        </div>
      )}

      {/* Pending offers */}
      {pendingOffers.length > 0 && (
        <div className="space-y-2.5">
          <div className="text-[10px] text-white/40 font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3 h-3" /> Propostas pendentes
          </div>
          {pendingOffers.map((offer) => {
            const turnsLeft = offer.expiresAt - currentTurn;
            const wkVal = Math.round(offer.valuePerSeason / 40);
            return (
              <div key={offer.id} className="bg-yellow-500/5 border border-yellow-500/15 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {offer.brandColor && (
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: offer.brandColor }} />
                      )}
                      <span className="font-semibold">{offer.brandName}</span>
                      {offer.brandCategory && (
                        <span className="text-xs text-white/40">{offer.brandCategory}</span>
                      )}
                      {offer.counterOffered && (
                        <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">Negociada</span>
                      )}
                    </div>
                    <div className="text-sm text-white/70 mb-1">
                      {fmtM(offer.valuePerSeason)}/temp. · {offer.seasons} temp. · ≈ R$ {wkVal.toLocaleString('pt-BR')}k/sem
                    </div>
                    {offer.bonuses && offer.bonuses.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-1.5">
                        {offer.bonuses.map((b, i) => (
                          <span key={i} className="text-[10px] bg-yellow-400/10 text-yellow-400 border border-yellow-400/10 px-1.5 py-0.5 rounded-full">
                            {b.description}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="text-xs text-white/30">Expira em {turnsLeft} dia(s)</div>
                    {activeDeal && (
                      <div className="text-xs text-yellow-400/60 mt-0.5">⚠ Encerra contrato com {activeDeal.brandName}</div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button
                      onClick={() => onAccept(offer.id)}
                      className="flex items-center gap-1 text-xs bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <CheckCircle className="w-3 h-3" /> Aceitar
                    </button>
                    {!offer.counterOffered && (
                      <button
                        onClick={() => onNegotiate(offer.id)}
                        className="flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <TrendingUp className="w-3 h-3" /> +20%
                      </button>
                    )}
                    <button
                      onClick={() => onReject(offer.id)}
                      className="flex items-center gap-1 text-xs bg-white/8 hover:bg-white/15 text-white/60 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <XCircle className="w-3 h-3" /> Recusar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function SponsorsPage() {
  const save = useGameStore((s) => s.save);
  const acceptSponsorOffer = useGameStore((s) => s.acceptSponsorOffer);
  const rejectSponsorOffer = useGameStore((s) => s.rejectSponsorOffer);
  const negotiateSponsorOffer = useGameStore((s) => s.negotiateSponsorOffer);

  if (!save) return null;

  const slots = ['master', 'kit', 'secondary'] as const;
  const fanSat = save.fanSatisfaction ?? 50;
  const multInfo = fanMultInfo(fanSat);

  const getActive = (slot: 'master' | 'kit' | 'secondary') =>
    save.sponsorOffers.find(
      (o) =>
        (o.slot === slot || (!o.slot && slot === 'master')) &&
        o.status === 'active' &&
        o.activeUntil != null &&
        o.activeUntil >= save.season,
    );

  const getPending = (slot: 'master' | 'kit' | 'secondary') =>
    save.sponsorOffers.filter((o) => o.slot === slot && o.status === 'pending');

  const history = save.sponsorOffers.filter(
    (o) => o.status !== 'active' && o.status !== 'pending',
  );

  const totalWeekly = slots.reduce((sum, slot) => {
    const deal = getActive(slot);
    return sum + (deal ? Math.round(deal.valuePerSeason / 40) : 0);
  }, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="panel p-5">
        <div className="text-xs uppercase tracking-wider text-white/50">Gestão do clube</div>
        <h2 className="display-font text-3xl">Patrocínios</h2>
        <div className="text-sm text-white/60 mt-0.5">3 slots independentes: master, material esportivo e secundário</div>
        <div className="flex flex-wrap items-center gap-3 mt-3">
          {totalWeekly > 0 && (
            <div className="flex items-center gap-1.5 text-sm">
              <span className="text-white/40">Receita semanal total:</span>
              <span className="font-bold text-green-400">R$ {totalWeekly.toLocaleString('pt-BR')}k</span>
            </div>
          )}
          {multInfo && (
            <div className={`inline-flex items-center gap-1.5 text-xs border px-2.5 py-1 rounded-full ${multInfo.cls}`}>
              <Users className="w-3 h-3" /> {multInfo.text}
            </div>
          )}
        </div>
      </div>

      {/* 3 slot sections */}
      {slots.map((slot) => (
        <SlotSection
          key={slot}
          slot={slot}
          activeDeal={getActive(slot)}
          pendingOffers={getPending(slot)}
          currentTurn={save.currentTurn}
          onAccept={acceptSponsorOffer}
          onNegotiate={negotiateSponsorOffer}
          onReject={rejectSponsorOffer}
        />
      ))}

      {/* History */}
      {history.length > 0 && (
        <div className="panel p-5">
          <h3 className="font-semibold mb-3">Histórico</h3>
          <div className="space-y-1.5">
            {[...history].reverse().map((offer) => {
              const { text, cls } = statusBadge(offer.status);
              return (
                <div
                  key={offer.id}
                  className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                >
                  <div>
                    <span className="font-medium text-sm">{offer.brandName}</span>
                    <span className="text-white/40 text-xs ml-2">
                      {offer.slot ? SLOT_LABELS[offer.slot] : ''} · {fmtM(offer.valuePerSeason)}/temp.
                      {offer.activeSince ? ` · ${offer.activeSince}–${offer.activeUntil}` : ''}
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${cls}`}>{text}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {save.sponsorOffers.length === 0 && (
        <div className="panel p-8 text-center text-white/40 text-sm">
          Nenhuma proposta ainda. Avance turnos para receber ofertas de marcas.
        </div>
      )}
    </div>
  );
}
