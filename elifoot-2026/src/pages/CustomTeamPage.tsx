import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { nanoid } from 'nanoid';
import type { TeamTier } from '@/types';
import { ArrowLeft, Plus, Trash2, Edit2 } from 'lucide-react';

export interface CustomTeamSeed {
  id: string;
  name: string;
  shortName: string;
  city: string;
  primaryColor: string;
  secondaryColor: string;
  tier: TeamTier;
  reputation: number;
  budget: number;
  squadSeed: number;
}

const STORAGE_KEY = 'elifoot_custom_teams';

export function loadCustomTeams(): CustomTeamSeed[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function saveCustomTeams(teams: CustomTeamSeed[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(teams));
}

const TIER_OPTIONS: { value: TeamTier; label: string; reputation: number; budget: number }[] = [
  { value: 'elite', label: 'Elite',   reputation: 90, budget: 800000 },
  { value: 'top',   label: 'Top',     reputation: 78, budget: 450000 },
  { value: 'mid',   label: 'Médio',   reputation: 65, budget: 230000 },
  { value: 'low',   label: 'Fraco',   reputation: 52, budget: 110000 },
];

const EMPTY_FORM = {
  name: '',
  shortName: '',
  city: '',
  primaryColor: '#e30613',
  secondaryColor: '#ffffff',
  tier: 'mid' as TeamTier,
};

export default function CustomTeamPage() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<CustomTeamSeed[]>([]);
  const [editing, setEditing] = useState<CustomTeamSeed | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setTeams(loadCustomTeams());
  }, []);

  function openNew() {
    setForm({ ...EMPTY_FORM });
    setEditing(null);
    setError('');
    setShowForm(true);
  }

  function openEdit(team: CustomTeamSeed) {
    setForm({
      name: team.name,
      shortName: team.shortName,
      city: team.city,
      primaryColor: team.primaryColor,
      secondaryColor: team.secondaryColor,
      tier: team.tier,
    });
    setEditing(team);
    setError('');
    setShowForm(true);
  }

  function handleSave() {
    const name = form.name.trim();
    const shortName = form.shortName.trim().toUpperCase().slice(0, 3);
    const city = form.city.trim();

    if (!name || shortName.length < 2 || !city) {
      setError('Preencha nome, sigla (mín. 2 letras) e cidade.');
      return;
    }

    const tierInfo = TIER_OPTIONS.find((t) => t.value === form.tier)!;
    const updated = loadCustomTeams();

    if (editing) {
      const idx = updated.findIndex((t) => t.id === editing.id);
      if (idx !== -1) {
        updated[idx] = {
          ...editing,
          name,
          shortName,
          city,
          primaryColor: form.primaryColor,
          secondaryColor: form.secondaryColor,
          tier: form.tier,
          reputation: tierInfo.reputation,
          budget: tierInfo.budget,
        };
      }
    } else {
      updated.push({
        id: `custom_${nanoid(6)}`,
        name,
        shortName,
        city,
        primaryColor: form.primaryColor,
        secondaryColor: form.secondaryColor,
        tier: form.tier,
        reputation: tierInfo.reputation,
        budget: tierInfo.budget,
        squadSeed: Date.now() % 100000,
      });
    }

    saveCustomTeams(updated);
    setTeams(updated);
    setShowForm(false);
  }

  function handleDelete(id: string) {
    if (!confirm('Apagar este time personalizado?')) return;
    const updated = loadCustomTeams().filter((t) => t.id !== id);
    saveCustomTeams(updated);
    setTeams(updated);
  }

  return (
    <div className="min-h-screen p-6 max-w-3xl mx-auto">
      <button onClick={() => navigate('/new')} className="btn-ghost mb-6 flex items-center gap-2">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>

      <div className="flex items-center justify-between mb-6">
        <h2 className="display-font text-3xl">Times Personalizados</h2>
        <button onClick={openNew} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Criar time
        </button>
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="panel p-6 mb-6 border border-pitch-500/30">
          <h3 className="font-semibold mb-4">{editing ? 'Editar time' : 'Novo time personalizado'}</h3>

          {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <label className="block">
              <span className="text-xs text-white/60 mb-1 block">Nome do time</span>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ex: Atlético Paulistano"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pitch-500"
              />
            </label>

            <label className="block">
              <span className="text-xs text-white/60 mb-1 block">Sigla (2–3 letras)</span>
              <input
                type="text"
                value={form.shortName}
                maxLength={3}
                onChange={(e) => setForm((f) => ({ ...f, shortName: e.target.value.toUpperCase() }))}
                placeholder="Ex: ATP"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pitch-500"
              />
            </label>

            <label className="block">
              <span className="text-xs text-white/60 mb-1 block">Cidade</span>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                placeholder="Ex: São Paulo"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pitch-500"
              />
            </label>

            <label className="block">
              <span className="text-xs text-white/60 mb-1 block">Nível do time</span>
              <select
                value={form.tier}
                onChange={(e) => setForm((f) => ({ ...f, tier: e.target.value as TeamTier }))}
                className="w-full bg-midnight-700 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pitch-500"
              >
                {TIER_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs text-white/60 mb-1 block">Cor primária</span>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={form.primaryColor}
                  onChange={(e) => setForm((f) => ({ ...f, primaryColor: e.target.value }))}
                  className="w-10 h-10 rounded cursor-pointer border border-white/10 bg-transparent"
                />
                <span className="text-sm text-white/60">{form.primaryColor}</span>
              </div>
            </label>

            <label className="block">
              <span className="text-xs text-white/60 mb-1 block">Cor secundária</span>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={form.secondaryColor}
                  onChange={(e) => setForm((f) => ({ ...f, secondaryColor: e.target.value }))}
                  className="w-10 h-10 rounded cursor-pointer border border-white/10 bg-transparent"
                />
                <span className="text-sm text-white/60">{form.secondaryColor}</span>
              </div>
            </label>
          </div>

          {/* Preview */}
          <div className="flex items-center gap-4 mb-4 p-3 bg-white/5 rounded-lg">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center font-bold text-lg"
              style={{ backgroundColor: form.primaryColor, color: form.secondaryColor }}
            >
              {form.shortName || '???'}
            </div>
            <div>
              <div className="font-semibold">{form.name || 'Nome do time'}</div>
              <div className="text-xs text-white/50">{form.city || 'Cidade'} · {TIER_OPTIONS.find(t => t.value === form.tier)?.label}</div>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={handleSave} className="btn-primary">
              {editing ? 'Salvar alterações' : 'Criar time'}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-ghost">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de times customizados */}
      {teams.length === 0 && !showForm ? (
        <div className="panel p-8 text-center text-white/40">
          Nenhum time personalizado criado ainda. Clique em "Criar time" para começar.
        </div>
      ) : (
        <div className="space-y-2">
          {teams.map((t) => (
            <div key={t.id} className="panel p-4 flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center font-bold text-sm shrink-0"
                style={{ backgroundColor: t.primaryColor, color: t.secondaryColor }}
              >
                {t.shortName}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold">{t.name}</div>
                <div className="text-xs text-white/50">{t.city} · {TIER_OPTIONS.find(x => x.value === t.tier)?.label}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(t)} className="btn-ghost text-xs flex items-center gap-1">
                  <Edit2 className="w-3 h-3" /> Editar
                </button>
                <button onClick={() => handleDelete(t.id)} className="btn-ghost text-xs">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
