// Wrapper for ekstrakurikuler operations using IndexedDB
import { indexedDB, Ekstrakurikuler, AnggotaEskul, KehadiranEskul, NilaiEskul } from './indexedDB';
import { localDB } from './localDB';
import { migrateEskulData, isEskulMigrationNeeded } from './eskulMigration';

type EskulTableName = 'ekstrakurikuler' | 'anggota_eskul' | 'kehadiran_eskul' | 'nilai_eskul';

class EskulDB {
  private migrationChecked = false;

  private async ensureMigration() {
    if (this.migrationChecked) return;
    
    const needsMigration = await isEskulMigrationNeeded();
    if (needsMigration) {
      console.log('Auto-migrating ekstrakurikuler data to IndexedDB...');
      await migrateEskulData();
    }
    
    this.migrationChecked = true;
  }

  async select(tableName: EskulTableName, filter?: (record: any) => boolean): Promise<any[]> {
    await this.ensureMigration();
    return await indexedDB.select(tableName as any, filter);
  }

  async selectById(tableName: EskulTableName, id: string): Promise<any | null> {
    await this.ensureMigration();
    return await indexedDB.selectById(tableName as any, id);
  }

  async insert(tableName: EskulTableName, data: Partial<any>): Promise<{ data: any; error: null } | { data: null; error: string }> {
    await this.ensureMigration();
    return await indexedDB.insert(tableName as any, data);
  }

  async update(tableName: EskulTableName, id: string, data: Partial<any>): Promise<{ data: any; error: null } | { data: null; error: string }> {
    await this.ensureMigration();
    return await indexedDB.update(tableName as any, id, data);
  }

  async delete(tableName: EskulTableName, id: string): Promise<{ error: null } | { error: string }> {
    await this.ensureMigration();
    return await indexedDB.delete(tableName as any, id);
  }

  async count(tableName: EskulTableName, filter?: (record: any) => boolean): Promise<number> {
    await this.ensureMigration();
    return await indexedDB.count(tableName as any, filter);
  }
}

export const eskulDB = new EskulDB();
