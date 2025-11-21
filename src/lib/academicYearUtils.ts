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

export function generateUpcomingYears(lastYear: string, count: number = 3): string[] {
  if (!lastYear) return [];
  
  const [startYear] = lastYear.split('/').map(Number);
  const upcomingYears: string[] = [];
  
  for (let i = 1; i <= count; i++) {
    const year = startYear + i;
    upcomingYears.push(`${year}/${year + 1}`);
  }
  
  return upcomingYears;
}

export async function getAllTahunAjaranWithUpcoming(upcomingCount: number = 3): Promise<string[]> {
  const existingYears = await getAllTahunAjaran();
  
  if (existingYears.length === 0) {
    // If no years exist, start from current year
    const currentYear = new Date().getFullYear();
    return [`${currentYear}/${currentYear + 1}`];
  }
  
  // Get the latest year (first in reversed array)
  const latestYear = existingYears[0];
  const upcomingYears = generateUpcomingYears(latestYear, upcomingCount);
  
  // Combine existing and upcoming years, remove duplicates
  const allYears = [...existingYears, ...upcomingYears];
  return [...new Set(allYears)];
}
