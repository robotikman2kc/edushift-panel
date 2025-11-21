import { indexedDB } from './indexedDB';

export async function getActiveTahunAjaran(): Promise<string> {
  const settings = await indexedDB.select('pengaturan');
  const setting = settings.find((s: any) => s.key === 'active_tahun_ajaran');
  return setting?.value || '2025/2026';
}

export async function getActiveSemester(): Promise<string> {
  const settings = await indexedDB.select('pengaturan');
  const setting = settings.find((s: any) => s.key === 'active_semester');
  return setting?.value || '1';
}

export async function setActiveTahunAjaran(tahunAjaran: string): Promise<void> {
  const settings = await indexedDB.select('pengaturan');
  const existing = settings.find((s: any) => s.key === 'active_tahun_ajaran');
  
  if (existing) {
    await indexedDB.update('pengaturan', existing.id, { value: tahunAjaran });
  } else {
    await indexedDB.insert('pengaturan', {
      key: 'active_tahun_ajaran',
      value: tahunAjaran
    });
  }
}

export async function getAllTahunAjaran(): Promise<string[]> {
  const allKelas = await indexedDB.select('kelas');
  const years = [...new Set(allKelas.map((k: any) => k.tahun_ajaran))].filter(Boolean);
  return years.sort().reverse() as string[];
}
