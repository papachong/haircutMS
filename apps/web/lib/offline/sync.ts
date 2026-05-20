import { getServiceItems, getServiceCategories, getStaff, searchMembers as apiSearchMembers, createOrder } from '../api/orders';
import {
  putServiceItems,
  putServiceCategories,
  putStaff,
  putMembers,
  getPendingOrders,
  getFailedOrders,
  updateOrderStatus,
  removeOrder,
  type OrderQueueRecord,
} from './db';

/**
 * Fetch fresh data from the server and store it in IndexedDB for offline use.
 */
export async function syncFromServer(): Promise<void> {
  const [categories, staffList, allServices] = await Promise.all([
    getServiceCategories(),
    getStaff(),
    getServiceItems(),
  ]);

  await Promise.all([
    putServiceCategories(categories),
    putStaff(staffList),
    putServiceItems(allServices),
  ]);
}

/**
 * Cache member search results to IndexedDB so they are available offline.
 */
export async function cacheMemberResults(keyword: string): Promise<void> {
  try {
    const members = await apiSearchMembers(keyword);
    if (members.length > 0) {
      await putMembers(members);
    }
  } catch {
    // Silently fail - caching is best-effort
  }
}

/**
 * Flush pending orders from the IndexedDB queue to the server.
 * Returns the number of orders successfully synced.
 */
export async function flushOrderQueue(): Promise<number> {
  const pending = await getPendingOrders();
  const failed = await getFailedOrders();
  const toProcess = [...pending, ...failed.filter((o) => o.retryCount < 3)];

  let synced = 0;

  for (const record of toProcess) {
    if (record.id === undefined) continue;

    try {
      await updateOrderStatus(record.id, 'syncing');
      await createOrder(record.orderData);
      await removeOrder(record.id);
      synced++;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      await updateOrderStatus(record.id, 'failed', message);
    }
  }

  return synced;
}

/**
 * Store arbitrary data items into IndexedDB (generic helper).
 */
export async function cacheForOffline(
  type: 'serviceItems' | 'serviceCategories' | 'staff',
  items: unknown[]
): Promise<void> {
  switch (type) {
    case 'serviceItems':
      await putServiceItems(items as Parameters<typeof putServiceItems>[0]);
      break;
    case 'serviceCategories':
      await putServiceCategories(items as Parameters<typeof putServiceCategories>[0]);
      break;
    case 'staff':
      await putStaff(items as Parameters<typeof putStaff>[0]);
      break;
  }
}

/**
 * Register listeners for online events and service worker messages
 * to trigger order queue flushing automatically.
 */
export function registerSyncListener(): () => void {
  const handleOnline = async () => {
    try {
      await flushOrderQueue();
    } catch {
      // Best effort
    }
  };

  const handleMessage = async (event: MessageEvent) => {
    if (event.data?.type === 'FLUSH_ORDER_QUEUE') {
      await handleOnline();
    }
  };

  window.addEventListener('online', handleOnline);

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', handleMessage);
  }

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    }
  };
}
