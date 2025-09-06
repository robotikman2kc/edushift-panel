// Migration utility to move data from localStorage to IndexedDB
import { indexedDB } from './indexedDB';
import type { TableName } from './indexedDB';

export class DataMigration {
  private getLocalStorageKey(tableName: TableName): string {
    return `localdb_${tableName}`;
  }

  // Check if migration is needed
  async isMigrationNeeded(): Promise<boolean> {
    try {
      // Check if there's data in localStorage
      const tables: TableName[] = ['users', 'guru', 'mata_pelajaran', 'kelas', 'siswa', 'jenis_kegiatan', 'jurnal', 'kehadiran'];
      
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

  // Migrate data from localStorage to IndexedDB
  async migrateData(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Starting data migration from localStorage to IndexedDB...');
      
      const tables: TableName[] = ['users', 'guru', 'mata_pelajaran', 'kelas', 'siswa', 'jenis_kegiatan', 'jurnal', 'kehadiran'];
      const migrationData: Record<TableName, any[]> = {} as Record<TableName, any[]>;
      
      // Collect data from localStorage
      for (const table of tables) {
        const localData = localStorage.getItem(this.getLocalStorageKey(table));
        if (localData) {
          try {
            const records = JSON.parse(localData);
            migrationData[table] = Array.isArray(records) ? records : [];
          } catch (parseError) {
            console.warn(`Failed to parse localStorage data for ${table}:`, parseError);
            migrationData[table] = [];
          }
        } else {
          migrationData[table] = [];
        }
      }

      // Import data to IndexedDB
      const importResult = await indexedDB.importAll(migrationData);
      if (importResult.error) {
        return { success: false, error: importResult.error };
      }

      // Create backup of localStorage data
      this.createLocalStorageBackup(migrationData);

      console.log('Data migration completed successfully');
      return { success: true };
      
    } catch (error) {
      console.error('Migration failed:', error);
      return { success: false, error: `Migration failed: ${error}` };
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
      const tables: TableName[] = ['users', 'guru', 'mata_pelajaran', 'kelas', 'siswa', 'jenis_kegiatan', 'jurnal', 'kehadiran'];
      
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