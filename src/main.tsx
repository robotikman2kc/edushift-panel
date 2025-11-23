import { createRoot } from 'react-dom/client'
import { ThemeProvider } from 'next-themes'
import App from './App.tsx'
import './index.css'
import { initNotificationScheduler } from './lib/notificationScheduler'
import { indexedDB } from './lib/indexedDB'
import { initializeSettings } from './lib/appSettings'

// Initialize IndexedDB and default data
indexedDB.initDB().then(async () => {
  indexedDB.initializeDefaultData();
  
  // Initialize and migrate settings from localStorage to IndexedDB
  await initializeSettings();
  
  // Run academic year migration
  const { migrateToAcademicYear } = await import('./lib/academicYearMigration');
  await migrateToAcademicYear();
  
  // Check if migration is needed (only check, don't auto-migrate)
  const { dataMigration } = await import('./lib/migrationUtils');
  const migrationStatus = await dataMigration.getMigrationStatus();
  
  if (migrationStatus.needsMigration) {
    // Set flag for StorageMonitor to show migration banner
    sessionStorage.setItem('needsMigration', 'true');
    sessionStorage.setItem('migrationData', JSON.stringify(migrationStatus));
  }
});

// Initialize notification scheduler
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    initNotificationScheduler();
  });
}

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <App />
  </ThemeProvider>
);
