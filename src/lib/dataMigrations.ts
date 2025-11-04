// Data migrations for schema changes
import { indexedDB } from './indexedDB';

export class SchemaMigrations {
  // Migration: Add tanggal_masuk to existing students
  async migrateSiswaTanggalMasuk(): Promise<{ success: boolean; updated: number; error?: string }> {
    try {
      console.log('Starting siswa tanggal_masuk migration...');
      
      const allSiswa = await indexedDB.select('siswa');
      let updatedCount = 0;
      
      for (const siswa of allSiswa) {
        // Only update if tanggal_masuk is not set
        if (!siswa.tanggal_masuk) {
          // Set tanggal_masuk to created_at date or today
          const tanggalMasuk = siswa.created_at 
            ? new Date(siswa.created_at).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0];
          
          await indexedDB.update('siswa', siswa.id, {
            tanggal_masuk: tanggalMasuk
          });
          
          updatedCount++;
        }
      }
      
      console.log(`Migration completed: ${updatedCount} students updated with tanggal_masuk`);
      return { success: true, updated: updatedCount };
      
    } catch (error) {
      console.error('Migration failed:', error);
      return { success: false, updated: 0, error: `Migration failed: ${error}` };
    }
  }
  
  // Run all pending migrations
  async runAllMigrations(): Promise<void> {
    try {
      // Check if migrations have been run before
      const migrationStatus = await this.getMigrationStatus();
      
      if (!migrationStatus.siswa_tanggal_masuk_v1) {
        const result = await this.migrateSiswaTanggalMasuk();
        if (result.success) {
          await this.setMigrationStatus('siswa_tanggal_masuk_v1', true);
          console.log('✓ siswa_tanggal_masuk_v1 migration completed');
        }
      }
    } catch (error) {
      console.error('Error running migrations:', error);
    }
  }
  
  // Get migration status from settings
  private async getMigrationStatus(): Promise<Record<string, boolean>> {
    try {
      const settings = await indexedDB.select('pengaturan');
      const migrationSetting = settings.find((s: any) => s.key === 'schema_migrations');
      
      if (migrationSetting && migrationSetting.value) {
        return typeof migrationSetting.value === 'string' 
          ? JSON.parse(migrationSetting.value)
          : migrationSetting.value;
      }
      
      return {};
    } catch (error) {
      console.error('Error getting migration status:', error);
      return {};
    }
  }
  
  // Save migration status to settings
  private async setMigrationStatus(migrationName: string, completed: boolean): Promise<void> {
    try {
      const currentStatus = await this.getMigrationStatus();
      currentStatus[migrationName] = completed;
      
      const settings = await indexedDB.select('pengaturan');
      const existingSetting = settings.find((s: any) => s.key === 'schema_migrations');
      
      if (existingSetting) {
        await indexedDB.update('pengaturan', existingSetting.id, {
          value: JSON.stringify(currentStatus)
        });
      } else {
        await indexedDB.insert('pengaturan', {
          key: 'schema_migrations',
          value: JSON.stringify(currentStatus)
        });
      }
    } catch (error) {
      console.error('Error saving migration status:', error);
    }
  }
}

// Export singleton instance
export const schemaMigrations = new SchemaMigrations();
