import { useGameStore } from '@/store/gameStore';
import { MANAGER_SKILLS, reputationTier } from '@/data/managerSkills';
import { Star, Zap, Shield, TrendingUp, DollarSign, Users, Lock, CheckCircle, Trophy, Briefcase } from 'lucide-react';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  scouting:   <Users className="w-4 h-4" />,
  motivation: <Zap className="w-4 h-4" />,
  tactics:    <Shield className="w-4 h-4" />,
  youth:      <TrendingUp className="w-4 h-4" />,
  finance:    <DollarSign className="w-4 h-4" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  scouting:   'text-blue-400 bg-blue-400/10',
  motivation: 'text-yellow-400 bg-yellow-400/10',
  tactics:    'text-purple-400 bg-purple-400/10',
  youth:      'text-green-400 bg-green-400/10',
  finance:    'text-emerald-400 bg-emerald-400/10',
};

const CONFIDENCE_COLOR = (v: number) =>
  v >= 70 ? 'bg-green-500' : v >= 40 ? 'bg-yellow-500' : 'bg-red-500';

const CONFIDENCE_LABEL = (v: number) =>
  v >= 80 ? 'Excelente' : v >= 60 ? 'Boa' : v >= 40 ? 'Razoável' : v >= 20 ? 'Baixa' : 'Crítica';

function Stars({ count }: { count: number }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i <= count ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'}`}
        />
      ))}
    </span>
  );
}

export default function CareerPage() {
  const save = useGameStore((s) => s.save);
  const unlockSkill = useGameStore((s) => s.unlockSkill);
  if (!save) return null;

  const rep    = save.managerReputation ?? 0;
  const xp     = save.managerXP ?? 0;
  const spent  = save.managerXPSpent ?? 0;
  const avail  = xp - spent;
  const skills = save.unlockedSkills ?? [];
  const conf   = save.boardConfidence ?? 60;
  const clubs  = save.careerClubs ?? [];

  const tier = reputationTier(rep);
  const tierProgress = tier.stars < 5
    ? ((rep - [0, 1000, 2500, 5000, 7500][tier.stars - 1]) /
       (tier.next - [0, 1000, 2500, 5000, 7500][tier.stars - 1])) * 100
    : 100;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="panel p-5">
        <div className="text-xs uppercase tracking-wider text-white/50">Carreira do Técnico</div>
        <h2 className="display-font text-3xl">{save.managerName}</h2>
        <div className="text-sm text-white/60 flex items-center gap-2 mt-1">
          <Briefcase className="w-3.5 h-3.5" />
          {clubs.length > 0 ? clubs.join(' → ') : '—'}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Reputação */}
        <div className="panel p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-400" /> Reputação
          </h3>
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-2xl font-bold">{rep.toLocaleString('pt-BR')}</div>
              <div className="text-sm text-white/50">{tier.label}</div>
            </div>
            <Stars count={tier.stars} />
          </div>
          <div className="w-full bg-white/10 rounded-full h-2 mb-3">
            <div
              className="bg-yellow-400 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(100, tierProgress)}%` }}
            />
          </div>
          {tier.stars < 5 && (
            <div className="text-xs text-white/40 text-right">
              {tier.next.toLocaleString('pt-BR')} para {['', '', 'Nacional', 'Continental', 'Elite', 'Classe Mundial'][tier.stars + 1] ?? 'máximo'}
            </div>
          )}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <div className="text-xs text-white/40 mb-1">XP Total</div>
              <div className="font-bold text-pitch-400">{xp.toLocaleString('pt-BR')}</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <div className="text-xs text-white/40 mb-1">XP Disponível</div>
              <div className={`font-bold ${avail > 0 ? 'text-green-400' : 'text-white/40'}`}>
                {avail.toLocaleString('pt-BR')}
              </div>
            </div>
          </div>
        </div>

        {/* Confiança da diretoria */}
        <div className="panel p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" /> Confiança da Diretoria
          </h3>
          <div className="flex items-end gap-3 mb-3">
            <div className="text-4xl font-bold">{conf}</div>
            <div className={`text-sm font-semibold mb-1 ${conf >= 70 ? 'text-green-400' : conf >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
              {CONFIDENCE_LABEL(conf)}
            </div>
          </div>
          <div className="w-full bg-white/10 rounded-full h-3 mb-4">
            <div
              className={`h-3 rounded-full transition-all ${CONFIDENCE_COLOR(conf)}`}
              style={{ width: `${conf}%` }}
            />
          </div>
          <div className="space-y-2 text-xs text-white/50">
            <div className="flex justify-between">
              <span>Crítico (&lt;15)</span>
              <span className="text-red-400">Demissão automática</span>
            </div>
            <div className="flex justify-between">
              <span>Baixo (15–39)</span>
              <span className="text-yellow-400">Risco de demissão</span>
            </div>
            <div className="flex justify-between">
              <span>Bom (70+)</span>
              <span className="text-green-400">Posição segura</span>
            </div>
          </div>
        </div>
      </div>

      {/* Árvore de habilidades */}
      <div className="panel p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Zap className="w-4 h-4 text-pitch-400" /> Árvore de Habilidades
          </h3>
          <div className="text-xs text-white/40">
            {avail > 0
              ? <span className="text-green-400 font-semibold">{avail} XP disponível</span>
              : 'Sem XP disponível — acumule jogando'}
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {MANAGER_SKILLS.map((skill) => {
            const isUnlocked = skills.includes(skill.id);
            const canAfford  = avail >= skill.cost;
            return (
              <div
                key={skill.id}
                className={`rounded-xl border p-4 transition-colors ${
                  isUnlocked
                    ? 'border-pitch-500/40 bg-pitch-500/10'
                    : 'border-white/10 bg-white/3'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`p-1.5 rounded-lg ${CATEGORY_COLORS[skill.category]}`}>
                      {CATEGORY_ICONS[skill.category]}
                    </span>
                    <div>
                      <div className="text-sm font-semibold flex items-center gap-1.5">
                        {skill.name}
                        {isUnlocked && <CheckCircle className="w-3.5 h-3.5 text-pitch-400" />}
                      </div>
                      <div className="text-[10px] text-white/40 uppercase tracking-wider">
                        {skill.category}
                      </div>
                    </div>
                  </div>
                  {!isUnlocked && (
                    <div className="text-[11px] font-bold text-yellow-400 shrink-0">
                      {skill.cost} XP
                    </div>
                  )}
                </div>
                <p className="text-xs text-white/60 mt-1 mb-3">{skill.description}</p>
                {!isUnlocked && (
                  <button
                    onClick={() => unlockSkill(skill.id)}
                    disabled={!canAfford}
                    className={`w-full text-xs py-1.5 rounded-lg font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                      canAfford
                        ? 'bg-pitch-600 hover:bg-pitch-500 text-white'
                        : 'bg-white/5 text-white/20 cursor-not-allowed'
                    }`}
                  >
                    {canAfford ? (
                      <>Desbloquear — {skill.cost} XP</>
                    ) : (
                      <><Lock className="w-3 h-3" /> XP insuficiente</>
                    )}
                  </button>
                )}
                {isUnlocked && (
                  <div className="text-xs text-pitch-400 font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Desbloqueado
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Como ganhar XP */}
      <div className="panel p-5">
        <h3 className="font-semibold mb-3 text-sm text-white/60">Como ganhar XP</h3>
        <div className="grid sm:grid-cols-2 gap-2 text-xs text-white/50">
          {[
            ['Título (campeonato/copa)',  '+600 XP'],
            ['Vencer o Brasileirão',     '+400 XP bônus'],
            ['Top 5 no Brasileirão',     '+200 XP'],
            ['Top 10 no Brasileirão',    '+100 XP'],
            ['Todos objetivos cumpridos','+150 XP'],
          ].map(([desc, val]) => (
            <div key={desc} className="flex justify-between bg-white/3 rounded-lg px-3 py-2">
              <span>{desc}</span>
              <span className="text-green-400 font-semibold">{val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
