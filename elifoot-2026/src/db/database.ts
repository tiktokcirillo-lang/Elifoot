import Dexie, { type Table } from 'dexie';
import type { SaveGame } from '@/types';

class ElifootDB extends Dexie {
  saves!: Table<SaveGame, string>;

  constructor() {
    super('elifoot2026');
    this.version(1).stores({
      saves: 'id, name, updatedAt, createdAt',
    });
  }
}

export const db = new ElifootDB();

export async function listSaves(): Promise<SaveGame[]> {
  return db.saves.orderBy('updatedAt').reverse().toArray();
}

export async function loadSave(id: string): Promise<SaveGame | undefined> {
  return db.saves.get(id);
}

export async function persistSave(save: SaveGame): Promise<void> {
  save.updatedAt = Date.now();
  await db.saves.put(save);
}

export async function deleteSave(id: string): Promise<void> {
  await db.saves.delete(id);
}
