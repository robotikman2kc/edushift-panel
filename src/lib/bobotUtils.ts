import { indexedDB } from "./indexedDB";
import type { JenisPenilaian } from "./indexedDB";

/**
 * Get bobot for a specific kelas. If custom bobot is set for the kelas,
 * use that. Otherwise, use the default bobot from jenis_penilaian.
 */
export const getBobotForKelas = async (
  kelasId: string,
  categories: JenisPenilaian[]
): Promise<{ [key: string]: number }> => {
  try {
    // Try to get custom bobot for this kelas
    const savedBobot = await indexedDB.select("pengaturan");
    const bobotKey = `bobot_penilaian_${kelasId}`;
    const bobotData = savedBobot.find((s: any) => s.key === bobotKey);

    if (bobotData && bobotData.value) {
      // Return custom bobot
      return JSON.parse(bobotData.value);
    }

    // Return default bobot from categories
    const defaultBobot: { [key: string]: number } = {};
    categories.forEach((cat) => {
      defaultBobot[cat.id] = cat.bobot || 0;
    });
    return defaultBobot;
  } catch (error) {
    console.error("Error getting bobot:", error);
    // Fallback to default bobot
    const defaultBobot: { [key: string]: number } = {};
    categories.forEach((cat) => {
      defaultBobot[cat.id] = cat.bobot || 0;
    });
    return defaultBobot;
  }
};

/**
 * Get bobot value for a specific category in a specific kelas
 */
export const getBobotForKategori = async (
  kelasId: string,
  kategoriId: string,
  categories: JenisPenilaian[]
): Promise<number> => {
  const bobotMap = await getBobotForKelas(kelasId, categories);
  return bobotMap[kategoriId] || 0;
};

/**
 * Save custom bobot for a kelas
 */
export const saveBobotForKelas = async (
  kelasId: string,
  bobotValues: { [key: string]: number }
): Promise<void> => {
  const bobotKey = `bobot_penilaian_${kelasId}`;
  
  const existing = await indexedDB.select("pengaturan");
  const existingBobot = existing.find((s: any) => s.key === bobotKey);

  if (existingBobot) {
    await indexedDB.update("pengaturan", existingBobot.id, {
      value: JSON.stringify(bobotValues),
    });
  } else {
    await indexedDB.insert("pengaturan", {
      key: bobotKey,
      value: JSON.stringify(bobotValues),
    });
  }
};
