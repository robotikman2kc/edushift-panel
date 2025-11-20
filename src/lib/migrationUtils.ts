// Migration utility to move data from localStorage to IndexedDB
import { indexedDB } from './indexedDB';
import type { TableName } from './indexedDB';

export class DataMigration {
  private getLocalStorageKey(tableName: TableName): string {
    return `localdb_${tableName}`;
  }

  // All tables that need migration
  private getAllTables(): TableName[] {
    return [
      'users', 'guru', 'mata_pelajaran', 'kelas', 'siswa', 
      'jenis_kegiatan', 'jurnal', 'kehadiran', 'jenis_penilaian', 
      'nilai_siswa', 'jam_pelajaran', 'jadwal_pelajaran', 
      'pengaturan', 'activity_log', 'agenda_mengajar', 
      'catatan_kalender', 'hari_libur'
    ];
  }

  // Check if migration is needed
  async isMigrationNeeded(): Promise<boolean> {
    try {
      const tables = this.getAllTables();
      
      for (const table of tables) {
        const localData = localStorage.getItem(this.getLocalStorageKey(table));
        if (localData && JSON.parse(localData).length > 0) {
          // Check if IndexedDB is empty for this table
          const indexedData = await indexedDB.select(table);
          if (indexedData.length === 0) {
            return true;
          }
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error checking migration status:', error);
      return false;
    }
  }

  // Get detailed migration status
  async getMigrationStatus(): Promise<{
    needsMigration: boolean;
    pendingTables: { table: string; recordCount: number }[];
    totalRecords: number;
  }> {
    const pendingTables: { table: string; recordCount: number }[] = [];
    let totalRecords = 0;

    try {
      const tables = this.getAllTables();
      
      for (const table of tables) {
        const localData = localStorage.getItem(this.getLocalStorageKey(table));
        if (localData) {
          try {
            const records = JSON.parse(localData);
            if (Array.isArray(records) && records.length > 0) {
              const indexedData = await indexedDB.select(table);
              if (indexedData.length === 0) {
                pendingTables.push({ table, recordCount: records.length });
                totalRecords += records.length;
              }
            }
          } catch (parseError) {
            console.warn(`Failed to parse localStorage data for ${table}:`, parseError);
          }
        }
      }

      return {
        needsMigration: pendingTables.length > 0,
        pendingTables,
        totalRecords
      };
    } catch (error) {
      console.error('Error getting migration status:', error);
      return { needsMigration: false, pendingTables: [], totalRecords: 0 };
    }
  }

  // Migrate data from localStorage to IndexedDB with progress tracking
  async migrateData(onProgress?: (progress: number, message: string) => void): Promise<{ success: boolean; error?: string; report?: any }> {
    try {
      console.log('Starting data migration from localStorage to IndexedDB...');
      onProgress?.(0, 'Memulai migrasi...');
      
      const tables = this.getAllTables();
      const migrationData: Record<TableName, any[]> = {} as Record<TableName, any[]>;
      const migrationReport: Record<string, number> = {};
      
      // Collect data from localStorage
      onProgress?.(10, 'Mengumpulkan data dari localStorage...');
      for (const table of tables) {
        const localData = localStorage.getItem(this.getLocalStorageKey(table));
        if (localData) {
          try {
            const records = JSON.parse(localData);
            migrationData[table] = Array.isArray(records) ? records : [];
            migrationReport[table] = migrationData[table].length;
          } catch (parseError) {
            console.warn(`Failed to parse localStorage data for ${table}:`, parseError);
            migrationData[table] = [];
            migrationReport[table] = 0;
          }
        } else {
          migrationData[table] = [];
          migrationReport[table] = 0;
        }
      }

      // Create backup before migration
      onProgress?.(30, 'Membuat backup...');
      this.createLocalStorageBackup(migrationData);

      // Import data to IndexedDB
      onProgress?.(50, 'Memindahkan data ke IndexedDB...');
      const importResult = await indexedDB.importAll(migrationData);
      if (importResult.error) {
        return { success: false, error: importResult.error };
      }

      // Verify migration
      onProgress?.(80, 'Memverifikasi data...');
      const verificationResult = await this.verifyMigration(migrationData);
      if (!verificationResult.success) {
        return { success: false, error: verificationResult.error };
      }

      onProgress?.(100, 'Migrasi selesai!');
      console.log('Data migration completed successfully', migrationReport);
      return { success: true, report: migrationReport };
      
    } catch (error) {
      console.error('Migration failed:', error);
      return { success: false, error: `Migration failed: ${error}` };
    }
  }

  // Verify migration integrity
  private async verifyMigration(originalData: Record<TableName, any[]>): Promise<{ success: boolean; error?: string }> {
    try {
      for (const [table, records] of Object.entries(originalData)) {
        if (records.length > 0) {
          const indexedData = await indexedDB.select(table as TableName);
          if (indexedData.length !== records.length) {
            return { 
              success: false, 
              error: `Verification failed for ${table}: expected ${records.length} records, got ${indexedData.length}` 
            };
          }
        }
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: `Verification error: ${error}` };
    }
  }

  // Create backup of localStorage data before migration
  private createLocalStorageBackup(data: Record<TableName, any[]>): void {
    try {
      const backup = {
        timestamp: new Date().toISOString(),
        data: data
      };
      localStorage.setItem('localdb_backup', JSON.stringify(backup));
      console.log('Created localStorage backup');
    } catch (error) {
      console.warn('Failed to create localStorage backup:', error);
    }
  }

  // Clear localStorage data after successful migration
  async clearLocalStorageData(): Promise<void> {
    try {
      const tables = this.getAllTables();
      
      tables.forEach(table => {
        localStorage.removeItem(this.getLocalStorageKey(table));
      });
      
      console.log('Cleared localStorage data after migration');
    } catch (error) {
      console.warn('Failed to clear localStorage data:', error);
    }
  }

  // Restore from localStorage backup if needed
  async restoreFromBackup(): Promise<{ success: boolean; error?: string }> {
    try {
      const backup = localStorage.getItem('localdb_backup');
      if (!backup) {
        return { success: false, error: 'No backup found' };
      }

      const backupData = JSON.parse(backup);
      const importResult = await indexedDB.importAll(backupData.data);
      
      if (importResult.error) {
        return { success: false, error: importResult.error };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: `Restore failed: ${error}` };
    }
  }
}

export const dataMigration = new DataMigration();