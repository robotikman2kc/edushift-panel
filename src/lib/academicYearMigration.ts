import { indexedDB } from './indexedDB';

export async function migrateToAcademicYear() {
  try {
    // 1. Set default tahun ajaran aktif jika belum ada
    const settings = await indexedDB.select('pengaturan');
    const activeTahunAjaranSetting = settings.find((s: any) => s.key === 'active_tahun_ajaran');
    
    if (!activeTahunAjaranSetting) {
      await indexedDB.insert('pengaturan', {
        key: 'active_tahun_ajaran',
        value: '2025/2026'
      });
    }
    
    const defaultTahunAjaran = activeTahunAjaranSetting?.value || '2025/2026';
    
    // 2. Update Siswa - tambahkan tahun_ajaran jika belum ada
    const allSiswa = await indexedDB.select('siswa');
    for (const siswa of allSiswa) {
      if (!siswa.tahun_ajaran) {
        const kelas = await indexedDB.selectById('kelas', siswa.kelas_id);
        await indexedDB.update('siswa', siswa.id, {
          tahun_ajaran: kelas?.tahun_ajaran || defaultTahunAjaran
        });
      }
    }
    
    // 3. Update Kehadiran - tambahkan tahun_ajaran
    const allKehadiran = await indexedDB.select('kehadiran');
    for (const kehadiran of allKehadiran) {
      if (!kehadiran.tahun_ajaran) {
        const kelas = await indexedDB.selectById('kelas', kehadiran.kelas_id);
        await indexedDB.update('kehadiran', kehadiran.id, {
          tahun_ajaran: kelas?.tahun_ajaran || defaultTahunAjaran
        });
      }
    }
    
    // 4. Update AgendaMengajar
    const allAgenda = await indexedDB.select('agenda_mengajar');
    for (const agenda of allAgenda) {
      if (!agenda.tahun_ajaran) {
        const kelas = await indexedDB.selectById('kelas', agenda.kelas_id);
        await indexedDB.update('agenda_mengajar', agenda.id, {
          tahun_ajaran: kelas?.tahun_ajaran || defaultTahunAjaran
        });
      }
    }
    
    // 5. Update JadwalPelajaran
    const allJadwal = await indexedDB.select('jadwal_pelajaran');
    for (const jadwal of allJadwal) {
      if (!jadwal.tahun_ajaran) {
        const kelas = await indexedDB.selectById('kelas', jadwal.kelas_id);
        await indexedDB.update('jadwal_pelajaran', jadwal.id, {
          tahun_ajaran: kelas?.tahun_ajaran || defaultTahunAjaran
        });
      }
    }
    
    console.log('✅ Migration to academic year completed');
    return { success: true };
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return { success: false, error };
  }
}
