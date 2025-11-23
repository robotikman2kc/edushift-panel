/**
 * Centralized application settings manager using IndexedDB
 * Replaces localStorage for all app settings
 */

import { indexedDB } from './indexedDB';

// Setting keys
export const SETTING_KEYS = {
  PDF_FORMAT: 'pdf_format_settings',
  SCHEDULE_MINUTES_PER_JP: 'schedule_minutes_per_jp',
  SCHEDULE_BREAK_1_START: 'schedule_break_1_start',
  SCHEDULE_BREAK_1_END: 'schedule_break_1_end',
  SCHEDULE_BREAK_2_START: 'schedule_break_2_start',
  SCHEDULE_BREAK_2_END: 'schedule_break_2_end',
  NOTIFICATION_SETTINGS: 'notification_settings',
  USER_PROFILE: 'user_profile',
  WORKDAY_INCLUDE_SATURDAY: 'workday_include_saturday',
  SELECTED_DATE: 'selected_date',
  QUICK_MENU_ITEMS: 'quick_menu_items',
  TABLE_SORT_PREFIX: 'table_sort_',
} as const;

/**
 * Get a setting value from IndexedDB
 */
export const getSetting = async <T = any>(key: string, defaultValue?: T): Promise<T | null> => {
  try {
    const settings = await indexedDB.select('app_settings', (s: any) => s.setting_key === key);
    
    if (settings.length > 0) {
      try {
        return JSON.parse(settings[0].setting_value);
      } catch {
        // If not JSON, return as string
        return settings[0].setting_value as T;
      }
    }
  } catch (error) {
    console.error(`Error getting setting ${key}:`, error);
  }
  
  return defaultValue !== undefined ? defaultValue : null;
};

/**
 * Get a setting value synchronously from localStorage (fallback/cache)
 */
export const getSettingSync = <T = any>(key: string, defaultValue?: T): T | null => {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return stored as T;
      }
    }
  } catch (error) {
    console.error(`Error getting setting sync ${key}:`, error);
  }
  
  return defaultValue !== undefined ? defaultValue : null;
};

/**
 * Save a setting to IndexedDB
 */
export const saveSetting = async (key: string, value: any, description?: string): Promise<void> => {
  try {
    const existing = await indexedDB.select('app_settings', (s: any) => s.setting_key === key);
    
    const settingValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    
    const settingData = {
      setting_key: key,
      setting_value: settingValue,
      description: description || `Application setting: ${key}`
    };
    
    if (existing.length > 0) {
      await indexedDB.update('app_settings', existing[0].id, settingData);
    } else {
      await indexedDB.insert('app_settings', settingData);
    }
    
    // Also cache to localStorage for sync access
    localStorage.setItem(key, settingValue);
  } catch (error) {
    console.error(`Error saving setting ${key}:`, error);
    throw error;
  }
};

/**
 * Delete a setting from IndexedDB
 */
export const deleteSetting = async (key: string): Promise<void> => {
  try {
    const existing = await indexedDB.select('app_settings', (s: any) => s.setting_key === key);
    
    if (existing.length > 0) {
      await indexedDB.delete('app_settings', existing[0].id);
    }
    
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error deleting setting ${key}:`, error);
    throw error;
  }
};

/**
 * Get all settings
 */
export const getAllSettings = async (): Promise<Record<string, any>> => {
  try {
    const settings = await indexedDB.select('app_settings');
    const result: Record<string, any> = {};
    
    settings.forEach((setting: any) => {
      try {
        result[setting.setting_key] = JSON.parse(setting.setting_value);
      } catch {
        result[setting.setting_key] = setting.setting_value;
      }
    });
    
    return result;
  } catch (error) {
    console.error('Error getting all settings:', error);
    return {};
  }
};

/**
 * Migrate settings from localStorage to IndexedDB
 */
export const migrateSettings = async (): Promise<void> => {
  const keysToMigrate = [
    'pdfFormatSettings',
    'notificationSettings',
    'userProfile',
    'workday_settings',
    'selectedDate',
    'quickMenuItems',
  ];
  
  let migratedCount = 0;
  
  for (const key of keysToMigrate) {
    try {
      const value = localStorage.getItem(key);
      if (value) {
        // Check if already in IndexedDB
        const existing = await getSetting(key);
        if (!existing) {
          await saveSetting(key, value);
          migratedCount++;
        }
      }
    } catch (error) {
      console.error(`Error migrating setting ${key}:`, error);
    }
  }
  
  // Migrate table sort settings (prefix-based)
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('table_sort_')) {
      try {
        const value = localStorage.getItem(key);
        if (value) {
          const existing = await getSetting(key);
          if (!existing) {
            await saveSetting(key, value);
            migratedCount++;
          }
        }
      } catch (error) {
        console.error(`Error migrating table sort setting ${key}:`, error);
      }
    }
  }
  
  if (migratedCount > 0) {
    console.log(`Migrated ${migratedCount} settings from localStorage to IndexedDB`);
  }
};

/**
 * Initialize settings - run on app startup
 */
export const initializeSettings = async (): Promise<void> => {
  try {
    await migrateSettings();
  } catch (error) {
    console.error('Error initializing settings:', error);
  }
};
