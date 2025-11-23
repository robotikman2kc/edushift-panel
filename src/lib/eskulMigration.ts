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
    await indexedDB.initDB();
    
    // Check each table separately
    const localAnggota = localDB.select('anggota_eskul');
    const localKehadiran = localDB.select('kehadiran_eskul');
    const localNilai = localDB.select('nilai_eskul');
    
    const indexedAnggota = await indexedDB.select('anggota_eskul');
    const indexedKehadiran = await indexedDB.select('kehadiran_eskul');
    const indexedNilai = await indexedDB.select('nilai_eskul');
    
    // Migration needed if any localStorage table has data but IndexedDB doesn't
    return (
      (localAnggota.length > 0 && indexedAnggota.length === 0) ||
      (localKehadiran.length > 0 && indexedKehadiran.length === 0) ||
      (localNilai.length > 0 && indexedNilai.length === 0)
    );
  } catch (error) {
    console.error('Error checking migration status:', error);
    return false;
  }
}
