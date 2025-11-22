import { hariLiburNasional } from "./hariLiburData";
import { format } from "date-fns";

export interface HariLibur {
  tanggal: string;
  nama: string;
  keterangan: string;
}

/**
 * Check if a given date is a weekday (Monday-Friday)
 * @param date - Date to check
 * @returns True if weekday, false if weekend
 */
export const isWeekday = (date: Date): boolean => {
  const day = date.getDay();
  return day >= 1 && day <= 5; // 1 = Monday, 5 = Friday
};

/**
 * Check if a given date is a national holiday
 * @param date - Date to check
 * @returns Holiday object if found, null otherwise
 */
export const isHariLibur = (date: Date): HariLibur | null => {
  const dateStr = format(date, "yyyy-MM-dd");
  const holiday = hariLiburNasional.find(h => h.tanggal === dateStr);
  return holiday || null;
};

/**
 * Check if a date is a holiday AND a weekday (requires journal entry)
 * @param date - Date to check
 * @returns Holiday object if it's a weekday holiday, null otherwise
 */
export const isHariLiburKerja = (date: Date): HariLibur | null => {
  if (!isWeekday(date)) {
    return null; // Weekend, no journal entry needed
  }
  return isHariLibur(date);
};

/**
 * Generate auto-fill template for a holiday
 * @param holiday - Holiday object
 * @returns Template object with default values
 */
export const generateHolidayTemplate = (holiday: HariLibur) => {
  return {
    uraian: `${holiday.nama} - ${holiday.keterangan}`,
    volume: 1,
    satuan: "hari"
  };
};

/**
 * Get all holidays for a specific month and year
 * @param month - Month (0-11)
 * @param year - Year
 * @returns Array of holiday dates
 */
export const getHolidaysInMonth = (month: number, year: number): Date[] => {
  const holidays: Date[] = [];
  
  hariLiburNasional.forEach(holiday => {
    const date = new Date(holiday.tanggal);
    if (date.getMonth() === month && date.getFullYear() === year) {
      holidays.push(date);
    }
  });
  
  return holidays;
};
