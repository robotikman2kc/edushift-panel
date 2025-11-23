/**
 * Workday settings utility
 * Manages whether Saturday is a working day
 */

const WORKDAY_SETTINGS_KEY = 'workday_settings';

export interface WorkdaySettings {
  includeSaturday: boolean;
}

const DEFAULT_SETTINGS: WorkdaySettings = {
  includeSaturday: false,
};

/**
 * Get current workday settings
 */
export const getWorkdaySettings = (): WorkdaySettings => {
  try {
    const stored = localStorage.getItem(WORKDAY_SETTINGS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading workday settings:', error);
  }
  return DEFAULT_SETTINGS;
};

/**
 * Save workday settings
 */
export const saveWorkdaySettings = (settings: WorkdaySettings): void => {
  try {
    localStorage.setItem(WORKDAY_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving workday settings:', error);
  }
};

/**
 * Check if a date is a working day
 * @param date - Date to check
 * @returns True if working day, false if weekend
 */
export const isWorkday = (date: Date): boolean => {
  const day = date.getDay();
  const settings = getWorkdaySettings();
  
  if (settings.includeSaturday) {
    return day >= 1 && day <= 6; // Monday to Saturday
  } else {
    return day >= 1 && day <= 5; // Monday to Friday
  }
};

/**
 * Get array of working days
 */
export const getWorkdays = (): string[] => {
  const settings = getWorkdaySettings();
  const baseDays = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
  
  if (settings.includeSaturday) {
    return [...baseDays, "Sabtu"];
  }
  
  return baseDays;
};

/**
 * Get number of working days per week
 */
export const getWorkdaysPerWeek = (): number => {
  const settings = getWorkdaySettings();
  return settings.includeSaturday ? 6 : 5;
};
