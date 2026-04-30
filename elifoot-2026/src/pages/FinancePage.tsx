import { useGameStore } from '@/store/gameStore';
import { calcWeeklyCashflow } from '@/engine/financeEngine';
import { TrendingUp, TrendingDown, Target, CheckCircle, XCircle, Clock, DollarSign } from 'lucide-react';
import type { BoardObjective, FinanceRecord } from '@/types';

export default function FinancePage() {
  const save = useGameStore((s) => s.save);
  if (!save) return null;

  const userTeam = save.teams.find((t) => t.id === save.controlledTeamId)!;
  const cashflow = calcWeeklyCashflow(save);

  const totalIncome = save.financeHistory
    .filter((r) => r.amount > 0)
    .reduce((s, r) => s + r.amount, 0);
  const totalExpenses = save.financeHistory
    .filter((r) => r.amount < 0)
    .reduce((s, r) => s + r.amount, 0);

  return (
    <div className="space-y-4">
      <div className="panel p-5">
        <div className="text-xs uppercase tracking-wider text-white/50">Fase 5</div>
        <h2 className="display-font text-3xl">Financeiro</h2>
        <div className="text-sm text-white/60">Temporada {save.season} · Dia {save.currentTurn}</div>
      </div>

      {/* Saldo e cashflow */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard
          label="Saldo Atual"
          value={`R$ ${(userTeam.budget / 1000).toFixed(1)}M`}
          icon={<DollarSign className="w-5 h-5" />}
          color={userTeam.budget >= 0 ? 'text-green-400' : 'text-red-400'}
        />
        <StatCard
          label="Receita Total (temporada)"
          value={`R$ ${(totalIncome / 1000).toFixed(1)}M`}
          icon={<TrendingUp className="w-5 h-5" />}
          color="text-green-400"
        />
        <StatCard
          label="Despesas Total (temporada)"
          value={`R$ ${(Math.abs(totalExpenses) / 1000).toFixed(1)}M`}
          icon={<TrendingDown className="w-5 h-5" />}
          color="text-red-400"
        />
      </div>

      {/* Fluxo de caixa semanal */}
      <div className="panel p-5">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-pitch-400" /> Fluxo de Caixa Semanal (estimativa)
        </h3>
        <div className="space-y-2 text-sm">
          <CashflowRow label="Patrocínios" amount={cashflow.sponsorIncome} />
          <CashflowRow label="Direitos de TV" amount={cashflow.tvIncome} />
          <CashflowRow label="Bilheteria (por jogo em casa)" amount={cashflow.projectedTickets} note="por jogo" />
          <div className="border-t border-white/10 pt-2 mt-2" />
          <CashflowRow label="Folha salarial" amount={-cashflow.weeklyWages} />
          <div className="border-t border-white/10 pt-2 mt-2 font-semibold">
            <CashflowRow
              label="Saldo líquido semanal (sem bilheteria)"
              amount={cashflow.net}
              bold
            />
          </div>
        </div>
      </div>

      {/* Objetivos da diretoria */}
      <div className="panel p-5">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Target className="w-4 h-4 text-gold-400" /> Objetivos da Diretoria
        </h3>
        {save.boardObjectives.length === 0 ? (
          <p className="text-white/40 text-sm">Nenhum objetivo definido.</p>
        ) : (
          <ul className="space-y-2">
            {save.boardObjectives.map((obj) => (
              <ObjectiveRow key={obj.id} objective={obj} />
            ))}
          </ul>
        )}
      </div>

      {/* Histórico financeiro */}
      <div className="panel p-5">
        <h3 className="font-semibold mb-4">Extrato recente</h3>
        {save.financeHistory.length === 0 ? (
          <p className="text-white/40 text-sm">Nenhum registro ainda. Avance alguns turnos.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-white/50 uppercase tracking-wider">
                <tr>
                  <th className="text-left py-2">Dia</th>
                  <th className="text-left py-2">Descrição</th>
                  <th className="text-right py-2">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[...save.financeHistory]
                  .reverse()
                  .slice(0, 30)
                  .map((record) => (
                    <FinanceRow key={record.id} record={record} />
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-componentes ───────────────────────────────────────────

function StatCard({
  label, value, icon, color,
}: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="panel p-4">
      <div className="flex items-center gap-2 text-white/50 text-sm mb-1">
        <span className={color}>{icon}</span>
        {label}
      </div>
      <div className={`display-font text-2xl ${color}`}>{value}</div>
    </div>
  );
}

function CashflowRow({
  label, amount, note, bold,
}: { label: string; amount: number; note?: string; bold?: boolean }) {
  const positive = amount >= 0;
  return (
    <div className={`flex justify-between items-center ${bold ? 'font-semibold' : ''}`}>
      <span className="text-white/70">
        {label}
        {note && <span className="text-white/40 text-xs ml-1">({note})</span>}
      </span>
      <span className={positive ? 'text-green-400' : 'text-red-400'}>
        {positive ? '+' : ''}R$ {(amount / 1000).toFixed(2)}M
      </span>
    </div>
  );
}

function ObjectiveRow({ objective }: { objective: BoardObjective }) {
  const icon =
    objective.status === 'achieved' ? <CheckCircle className="w-4 h-4 text-green-400" /> :
    objective.status === 'failed'   ? <XCircle className="w-4 h-4 text-red-400" /> :
                                      <Clock className="w-4 h-4 text-white/40" />;
  const color =
    objective.status === 'achieved' ? 'text-green-400' :
    objective.status === 'failed'   ? 'text-red-400' :
                                      'text-white/70';

  return (
    <li className="flex items-center gap-3 py-1">
      {icon}
      <span className={`text-sm ${color}`}>{objective.description}</span>
      {objective.status === 'pending' && (
        <span className="ml-auto text-xs text-white/30">Em andamento</span>
      )}
    </li>
  );
}

function FinanceRow({ record }: { record: FinanceRecord }) {
  const positive = record.amount >= 0;
  const typeLabel: Record<string, string> = {
    sponsor: 'Patrocínio',
    ticket: 'Bilheteria',
    tv_rights: 'Direitos TV',
    wages: 'Salários',
    transfer_in: 'Venda',
    transfer_out: 'Compra',
  };

  return (
    <tr>
      <td className="py-2 text-white/40 pr-4 w-16">D{record.turn}</td>
      <td className="py-2 text-white/80 truncate max-w-[200px]">
        <span className="text-xs text-white/40 mr-2">{typeLabel[record.type] ?? record.type}</span>
        {record.description}
      </td>
      <td className={`py-2 text-right font-semibold ${positive ? 'text-green-400' : 'text-red-400'}`}>
        {positive ? '+' : ''}R$ {(record.amount / 1000).toFixed(1)}M
      </td>
    </tr>
  );
}
