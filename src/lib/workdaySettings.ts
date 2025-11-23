/**
 * Workday settings utility
 * Manages whether Saturday is a working day using IndexedDB
 */

import { indexedDB } from './indexedDB';

export interface WorkdaySettings {
  includeSaturday: boolean;
}

const DEFAULT_SETTINGS: WorkdaySettings = {
  includeSaturday: false,
};

const SETTING_KEY = 'workday_include_saturday';

/**
 * Get current workday settings from IndexedDB
 */
export const getWorkdaySettings = async (): Promise<WorkdaySettings> => {
  try {
    const settings = await indexedDB.select('app_settings', (s: any) => s.setting_key === SETTING_KEY);
    
    if (settings.length > 0) {
      return {
        includeSaturday: settings[0].setting_value === 'true'
      };
    }
  } catch (error) {
    console.error('Error loading workday settings from IndexedDB:', error);
  }
  
  return DEFAULT_SETTINGS;
};

/**
 * Get current workday settings synchronously from cache (for immediate use)
 * Falls back to localStorage for backward compatibility during migration
 */
export const getWorkdaySettingsSync = (): WorkdaySettings => {
  try {
    // Try localStorage first for backward compatibility
    const stored = localStorage.getItem('workday_settings');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading workday settings from localStorage:', error);
  }
  
  return DEFAULT_SETTINGS;
};

/**
 * Save workday settings to IndexedDB
 */
export const saveWorkdaySettings = async (settings: WorkdaySettings): Promise<void> => {
  try {
    // Check if setting already exists
    const existing = await indexedDB.select('app_settings', (s: any) => s.setting_key === SETTING_KEY);
    
    const settingData = {
      setting_key: SETTING_KEY,
      setting_value: settings.includeSaturday.toString(),
      description: 'Whether Saturday is included as a working day'
    };
    
    if (existing.length > 0) {
      // Update existing
      await indexedDB.update('app_settings', existing[0].id, settingData);
    } else {
      // Insert new
      await indexedDB.insert('app_settings', settingData);
    }
    
    // Also save to localStorage for backward compatibility and sync access
    localStorage.setItem('workday_settings', JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving workday settings:', error);
    throw error;
  }
};

/**
 * Initialize workday settings - migrate from localStorage if needed
 */
export const initializeWorkdaySettings = async (): Promise<void> => {
  try {
    const dbSettings = await getWorkdaySettings();
    const localSettings = getWorkdaySettingsSync();
    
    // If localStorage has data but IndexedDB doesn't, migrate
    const stored = localStorage.getItem('workday_settings');
    if (stored && dbSettings.includeSaturday === DEFAULT_SETTINGS.includeSaturday) {
      await saveWorkdaySettings(localSettings);
      console.log('Migrated workday settings from localStorage to IndexedDB');
    }
  } catch (error) {
    console.error('Error initializing workday settings:', error);
  }
};

/**
 * Check if a date is a working day
 * @param date - Date to check
 * @returns True if working day, false if weekend
 */
export const isWorkday = (date: Date): boolean => {
  const day = date.getDay();
  const settings = getWorkdaySettingsSync(); // Use sync version for immediate access
  
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
  const settings = getWorkdaySettingsSync();
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
  const settings = getWorkdaySettingsSync();
  return settings.includeSaturday ? 6 : 5;
};
