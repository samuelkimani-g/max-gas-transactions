// Offline data synchronization system
// Stores data locally when offline, syncs when back online

const OFFLINE_STORAGE_KEY = 'offline_data_queue';
const SYNC_STATUS_KEY = 'sync_status';

// Queue for storing offline operations
class OfflineQueue {
  constructor() {
    this.queue = this.loadQueue();
    this.isOnline = navigator.onLine;
    this.setupEventListeners();
  }

  // Load queue from localStorage
  loadQueue() {
    try {
      const stored = localStorage.getItem(OFFLINE_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  // Save queue to localStorage
  saveQueue() {
    localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(this.queue));
  }

  // Add operation to offline queue
  addToQueue(operation) {
    const queueItem = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      operation: operation.type, // 'create_customer', 'create_transaction', etc.
      data: operation.data,
      endpoint: operation.endpoint,
      method: operation.method || 'POST',
      status: 'pending'
    };

    this.queue.push(queueItem);
    this.saveQueue();
    
    console.log('[OFFLINE] Operation queued:', operation.type);
    return queueItem.id;
  }

  // Process queue when back online
  async processQueue() {
    if (!this.isOnline || this.queue.length === 0) return;

    console.log(`[SYNC] Processing ${this.queue.length} offline operations...`);
    
    const results = [];
    
    for (const item of this.queue) {
      if (item.status !== 'pending') continue;

      try {
        // Attempt to sync the operation
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://max-gas-backend.onrender.com/api'}${item.endpoint}`, {
          method: item.method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          },
          body: JSON.stringify(item.data)
        });

        if (response.ok) {
          item.status = 'synced';
          item.syncedAt = new Date().toISOString();
          results.push({ id: item.id, status: 'success', data: await response.json() });
          console.log(`[SYNC] ✅ ${item.operation} synced successfully`);
        } else {
          item.status = 'failed';
          item.error = await response.text();
          results.push({ id: item.id, status: 'failed', error: item.error });
          console.log(`[SYNC] ❌ ${item.operation} failed:`, item.error);
        }
      } catch (error) {
        item.status = 'failed';
        item.error = error.message;
        results.push({ id: item.id, status: 'failed', error: error.message });
        console.log(`[SYNC] ❌ ${item.operation} error:`, error.message);
      }
    }

    // Remove successfully synced items
    this.queue = this.queue.filter(item => item.status !== 'synced');
    this.saveQueue();

    // Update sync status
    localStorage.setItem(SYNC_STATUS_KEY, JSON.stringify({
      lastSync: new Date().toISOString(),
      itemsProcessed: results.length,
      itemsRemaining: this.queue.length
    }));

    return results;
  }

  // Setup online/offline event listeners
  setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('[SYNC] Back online - processing queue...');
      this.processQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('[SYNC] Gone offline - operations will be queued');
    });
  }

  // Get queue status
  getStatus() {
    const syncStatus = localStorage.getItem(SYNC_STATUS_KEY);
    return {
      isOnline: this.isOnline,
      queueLength: this.queue.length,
      pendingOperations: this.queue.filter(item => item.status === 'pending').length,
      failedOperations: this.queue.filter(item => item.status === 'failed').length,
      lastSync: syncStatus ? JSON.parse(syncStatus) : null
    };
  }

  // Clear queue (for testing or manual reset)
  clearQueue() {
    this.queue = [];
    this.saveQueue();
    localStorage.removeItem(SYNC_STATUS_KEY);
  }
}

// Global offline queue instance
const offlineQueue = new OfflineQueue();

// Wrapper function for API calls with offline support
export async function apiCallWithOfflineSupport(endpoint, options = {}, operationType = 'unknown') {
  // If online, try normal API call
  if (navigator.onLine) {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://max-gas-backend.onrender.com/api'}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        ...options
      });

      if (response.ok) {
        return await response.json();
      } else {
        throw new Error(`API call failed: ${response.status}`);
      }
    } catch (error) {
      // If API call fails and it's a write operation, queue it
      if (['POST', 'PUT', 'PATCH'].includes(options.method)) {
        console.log('[OFFLINE] API call failed, queuing for later sync...');
        offlineQueue.addToQueue({
          type: operationType,
          endpoint,
          method: options.method,
          data: options.body ? JSON.parse(options.body) : null
        });
        
        // Return a mock success response for UI
        return {
          success: true,
          message: 'Operation queued for sync when online',
          offline: true
        };
      }
      throw error;
    }
  } else {
    // If offline and it's a write operation, queue it
    if (['POST', 'PUT', 'PATCH'].includes(options.method)) {
      offlineQueue.addToQueue({
        type: operationType,
        endpoint,
        method: options.method,
        data: options.body ? JSON.parse(options.body) : null
      });
      
      return {
        success: true,
        message: 'Operation saved offline, will sync when online',
        offline: true
      };
    } else {
      throw new Error('No internet connection and operation requires online access');
    }
  }
}

// Export the offline queue for status checking
export { offlineQueue };

// Offline status hook for React components
export function useOfflineStatus() {
  return offlineQueue.getStatus();
} 