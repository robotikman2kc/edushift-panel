// Migration utility to move ekstrakurikuler data from localStorage to IndexedDB
import { indexedDB } from './indexedDB';
import { localDB } from './localDB';

export async function migrateEskulData(): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('Starting ekstrakurikuler data migration...');
    
    // Initialize IndexedDB
    await indexedDB.initDB();
    
    // Migrate ekstrakurikuler
    const eskuls = localDB.select('ekstrakurikuler');
    console.log(`Migrating ${eskuls.length} ekstrakurikuler records...`);
    for (const eskul of eskuls) {
      // Check if already exists in IndexedDB
      const existing = await indexedDB.select('ekstrakurikuler', (e: any) => e.id === eskul.id);
      if (existing.length === 0) {
        await indexedDB.insert('ekstrakurikuler', eskul);
      }
    }
    
    // Migrate anggota_eskul
    const anggota = localDB.select('anggota_eskul');
    console.log(`Migrating ${anggota.length} anggota eskul records...`);
    for (const member of anggota) {
      const existing = await indexedDB.select('anggota_eskul', (a: any) => a.id === member.id);
      if (existing.length === 0) {
        await indexedDB.insert('anggota_eskul', member);
      }
    }
    
    // Migrate kehadiran_eskul
    const kehadiran = localDB.select('kehadiran_eskul');
    console.log(`Migrating ${kehadiran.length} kehadiran eskul records...`);
    for (const attendance of kehadiran) {
      const existing = await indexedDB.select('kehadiran_eskul', (k: any) => k.id === attendance.id);
      if (existing.length === 0) {
        await indexedDB.insert('kehadiran_eskul', attendance);
      }
    }
    
    // Migrate nilai_eskul
    const nilai = localDB.select('nilai_eskul');
    console.log(`Migrating ${nilai.length} nilai eskul records...`);
    for (const grade of nilai) {
      const existing = await indexedDB.select('nilai_eskul', (n: any) => n.id === grade.id);
      if (existing.length === 0) {
        await indexedDB.insert('nilai_eskul', grade);
      }
    }
    
    console.log('Ekstrakurikuler data migration completed successfully!');
    return { success: true };
  } catch (error) {
    console.error('Error during ekstrakurikuler migration:', error);
    return { success: false, error: String(error) };
  }
}

// Check if migration is needed
export async function isEskulMigrationNeeded(): Promise<boolean> {
  try {
    // Check if there's data in localStorage but not in IndexedDB
    const localEskuls = localDB.select('ekstrakurikuler');
    console.log('LocalStorage eskuls:', localEskuls);
    
    if (localEskuls.length === 0) {
      console.log('No data in localStorage to migrate');
      return false; // No data to migrate
    }
    
    await indexedDB.initDB();
    const indexedEskuls = await indexedDB.select('ekstrakurikuler');
    console.log('IndexedDB eskuls:', indexedEskuls);
    
    const needsMigration = localEskuls.length > 0 && indexedEskuls.length === 0;
    console.log('Migration needed?', needsMigration);
    
    // If localStorage has data but IndexedDB doesn't, migration is needed
    return needsMigration;
  } catch (error) {
    console.error('Error checking migration status:', error);
    return false;
  }
}
