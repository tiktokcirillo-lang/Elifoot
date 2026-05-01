import { useGameStore } from '@/store/gameStore';
import { DollarSign, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import type { SponsorOffer } from '@/types';

function fmtM(value: number) {
  return `R$ ${(value / 1000).toFixed(1)}M`;
}

function statusLabel(status: SponsorOffer['status']) {
  switch (status) {
    case 'active':   return { text: 'Ativo',    cls: 'text-green-400 bg-green-500/10' };
    case 'pending':  return { text: 'Pendente', cls: 'text-yellow-400 bg-yellow-500/10' };
    case 'expired':  return { text: 'Expirado', cls: 'text-white/40 bg-white/5' };
    case 'rejected': return { text: 'Recusado', cls: 'text-red-400 bg-red-500/10' };
  }
}

export default function SponsorsPage() {
  const save = useGameStore((s) => s.save);
  const acceptSponsorOffer = useGameStore((s) => s.acceptSponsorOffer);
  const rejectSponsorOffer = useGameStore((s) => s.rejectSponsorOffer);

  if (!save) return null;

  const activeDeal = save.sponsorOffers.find(
    (o) => o.status === 'active' && o.activeUntil != null && o.activeUntil >= save.season,
  );
  const pending  = save.sponsorOffers.filter((o) => o.status === 'pending');
  const history  = save.sponsorOffers.filter((o) => o.status !== 'active' && o.status !== 'pending');

  const weeklyIncome = activeDeal ? Math.round(activeDeal.valuePerSeason / 40) : null;

  return (
    <div className="space-y-4">
      <div className="panel p-5">
        <div className="text-xs uppercase tracking-wider text-white/50">Gestão do clube</div>
        <h2 className="display-font text-3xl">Patrocínios</h2>
        <div className="text-sm text-white/60">Gerencie contratos de patrocinadores</div>
      </div>

      {/* Contrato ativo */}
      <div className="panel p-5">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-green-400" /> Contrato ativo
        </h3>
        {activeDeal ? (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="display-font text-xl">{activeDeal.brandName}</span>
              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Ativo</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm mt-3">
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <div className="text-white/50 text-xs mb-1">Por temporada</div>
                <div className="font-bold">{fmtM(activeDeal.valuePerSeason)}</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <div className="text-white/50 text-xs mb-1">Por semana</div>
                <div className="font-bold text-green-400">R$ {weeklyIncome?.toLocaleString('pt-BR')}k</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3 text-center">
                <div className="text-white/50 text-xs mb-1">Válido até</div>
                <div className="font-bold">Temp. {activeDeal.activeUntil}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white/5 rounded-xl p-6 text-center text-white/40">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <div className="text-sm">Sem contrato de patrocínio ativo</div>
            <div className="text-xs mt-1">Aceite uma proposta abaixo para começar a receber</div>
          </div>
        )}
      </div>

      {/* Propostas pendentes */}
      {pending.length > 0 && (
        <div className="panel p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-yellow-400" /> Propostas pendentes
          </h3>
          <div className="space-y-3">
            {pending.map((offer) => {
              const turnsLeft = offer.expiresAt - save.currentTurn;
              const weeklyVal = Math.round(offer.valuePerSeason / 40);
              return (
                <div key={offer.id} className="bg-yellow-500/5 border border-yellow-500/15 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="display-font text-lg">{offer.brandName}</div>
                      <div className="text-sm text-white/60 mt-0.5">
                        {fmtM(offer.valuePerSeason)}/temporada · {offer.seasons} temporada(s)
                      </div>
                      <div className="text-xs text-white/40 mt-1">
                        ≈ R$ {weeklyVal.toLocaleString('pt-BR')}k/semana · Expira em {turnsLeft} dia(s)
                      </div>
                      {activeDeal && (
                        <div className="text-xs text-yellow-400/70 mt-1">
                          Aceitar encerrará o contrato atual com {activeDeal.brandName}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0 mt-1">
                      <button
                        className="flex items-center gap-1 text-xs bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg transition-colors"
                        onClick={() => acceptSponsorOffer(offer.id)}
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Aceitar
                      </button>
                      <button
                        className="flex items-center gap-1 text-xs bg-white/10 hover:bg-white/20 text-white/70 px-3 py-1.5 rounded-lg transition-colors"
                        onClick={() => rejectSponsorOffer(offer.id)}
                      >
                        <XCircle className="w-3.5 h-3.5" /> Recusar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Histórico */}
      {history.length > 0 && (
        <div className="panel p-5">
          <h3 className="font-semibold mb-4">Histórico</h3>
          <div className="space-y-2">
            {[...history].reverse().map((offer) => {
              const { text, cls } = statusLabel(offer.status);
              return (
                <div
                  key={offer.id}
                  className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                >
                  <div>
                    <span className="font-medium text-sm">{offer.brandName}</span>
                    <span className="text-white/40 text-xs ml-2">
                      {fmtM(offer.valuePerSeason)}/temp. · {offer.seasons} temp.
                      {offer.activeSince ? ` · Temp. ${offer.activeSince}–${offer.activeUntil}` : ''}
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${cls}`}>{text}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {pending.length === 0 && history.length === 0 && !activeDeal && (
        <div className="panel p-8 text-center text-white/40 text-sm">
          Nenhuma proposta ainda. Avance turnos para receber ofertas de marcas.
        </div>
      )}
    </div>
  );
}
