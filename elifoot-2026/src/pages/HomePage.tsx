import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listSaves, deleteSave, persistSave } from '@/db/database';
import { useGameStore } from '@/store/gameStore';
import type { SaveGame } from '@/types';
import { Trash2, Play, Plus, Download, Upload, Pencil } from 'lucide-react';
import { nanoid } from 'nanoid';
import { useT } from '@/i18n';

function exportSave(save: SaveGame) {
  const json = JSON.stringify(save, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `elifoot-${save.name.replace(/\s+/g, '_')}-T${save.season}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function HomePage() {
  const [saves, setSaves] = useState<SaveGame[]>([]);
  const [importing, setImporting] = useState(false);
  const loadGame = useGameStore((s) => s.loadGame);
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const t = useT();

  useEffect(() => {
    listSaves().then(setSaves);
  }, []);

  async function handleLoad(id: string) {
    await loadGame(id);
    navigate('/game');
  }

  async function handleDelete(id: string) {
    if (!confirm('Apagar este save permanentemente?')) return;
    await deleteSave(id);
    setSaves(await listSaves());
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const save = JSON.parse(text) as SaveGame;
      // Garante ID único para não sobrescrever outro save
      save.id = nanoid(10);
      save.name = `${save.name} (importado)`;
      await persistSave(save);
      setSaves(await listSaves());
    } catch {
      alert('Arquivo inválido. Certifique-se que é um save exportado do Elifoot 2026.');
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <h1 className="display-font text-7xl text-white tracking-wider">ELIFOOT</h1>
          <div className="display-font text-3xl text-gold-500">2026</div>
          <p className="text-white/60 mt-3">
            Gerenciamento de futebol moderno, inspirado nos clássicos
          </p>
        </div>

        <div className="panel p-6 space-y-3">
          <div className="flex gap-2">
            <Link to="/new" className="btn-primary flex-1 flex items-center justify-center gap-2 text-lg py-3">
              <Plus className="w-5 h-5" /> {t('new_game')}
            </Link>
            <button
              className="btn-ghost flex items-center gap-2 px-4"
              title={t('import_save')}
              onClick={() => fileRef.current?.click()}
              disabled={importing}
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline text-sm">{t('import_save')}</span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImport}
            />
          </div>

          {saves.length > 0 && (
            <>
              <div className="text-sm text-white/50 mt-4 mb-2">{t('saved_games')}</div>
              <ul className="space-y-2">
                {saves.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold truncate">{s.name}</div>
                      <div className="text-xs text-white/50">
                        {t('manager')} {s.managerName} · {t('season')} {s.season} · {t('day')} {s.currentTurn}
                      </div>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <button
                        onClick={() => handleLoad(s.id)}
                        className="btn-ghost text-sm flex items-center gap-1"
                      >
                        <Play className="w-4 h-4" />
                        <span className="hidden sm:inline">{t('continue_game')}</span>
                      </button>
                      <button
                        onClick={() => exportSave(s)}
                        className="btn-ghost text-sm"
                        title={t('export_save')}
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="btn-ghost text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-white/30">
          <span>Save offline via IndexedDB · PWA</span>
          <Link to="/custom-team" className="flex items-center gap-1 hover:text-white/60 transition-colors">
            <Pencil className="w-3 h-3" /> Times personalizados
          </Link>
        </div>
      </div>
    </div>
  );
}
