import { pwaUpdateManager } from './pwaUpdateManager';

/**
 * Service Worker Registration for Raja Rani PWA
 * Safely initializes sw.js with the centralized safe update manager
 */
export function registerServiceWorker() {
  pwaUpdateManager.init();
}
