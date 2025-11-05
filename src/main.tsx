import { createRoot } from 'react-dom/client'
import { ThemeProvider } from 'next-themes'
import App from './App.tsx'
import './index.css'
import { initNotificationScheduler } from './lib/notificationScheduler'
import { indexedDB } from './lib/indexedDB'

// Initialize IndexedDB and default data
indexedDB.initDB().then(() => {
  indexedDB.initializeDefaultData();
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
