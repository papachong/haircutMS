import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

interface ServiceItemRecord {
  id: string;
  categoryId: string;
  name: string;
  price: number;
  duration: number;
  image?: string;
  sortOrder: number;
  isActive: boolean;
}

interface ServiceCategoryRecord {
  id: string;
  name: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
}

interface StaffRecord {
  id: string;
  name: string;
  phone: string;
  role: string;
  avatar?: string;
  isActive: boolean;
}

interface MemberRecord {
  id: string;
  name: string;
  cardNo: string;
  phone: string;
  avatar?: string;
  memberLevel: {
    id: string;
    name: string;
    discount: number;
  };
  principalBalance: number;
  giftBalance: number;
}

type OrderQueueStatus = 'pending' | 'syncing' | 'failed';

interface OrderQueueRecord {
  id?: number;
  orderData: {
    memberId: string;
    items: Array<{
      serviceItemId: string;
      staffId: string;
      quantity: number;
    }>;
    remark?: string;
    status?: string;
  };
  status: OrderQueueStatus;
  createdAt: number;
  retryCount: number;
  error?: string;
}

interface HaircutOfflineDB extends DBSchema {
  serviceItems: {
    key: string;
    value: ServiceItemRecord;
  };
  serviceCategories: {
    key: string;
    value: ServiceCategoryRecord;
  };
  staff: {
    key: string;
    value: StaffRecord;
  };
  memberCache: {
    key: string;
    value: MemberRecord;
    indexes: {
      'by-phone': string;
      'by-name': string;
    };
  };
  orderQueue: {
    key: number;
    value: OrderQueueRecord;
    indexes: {
      'by-status': OrderQueueStatus;
    };
  };
}

const DB_NAME = 'haircutms-offline-v1';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<HaircutOfflineDB>> | null = null;

function getDB(): Promise<IDBPDatabase<HaircutOfflineDB>> {
  if (!dbPromise) {
    dbPromise = openDB<HaircutOfflineDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        db.createObjectStore('serviceItems', { keyPath: 'id' });
        db.createObjectStore('serviceCategories', { keyPath: 'id' });
        db.createObjectStore('staff', { keyPath: 'id' });

        const memberStore = db.createObjectStore('memberCache', { keyPath: 'id' });
        memberStore.createIndex('by-phone', 'phone');
        memberStore.createIndex('by-name', 'name');

        const orderStore = db.createObjectStore('orderQueue', {
          keyPath: 'id',
          autoIncrement: true,
        });
        orderStore.createIndex('by-status', 'status');
      },
    });
  }
  return dbPromise;
}

// --- Service Items ---

export async function getAllServiceItems(): Promise<ServiceItemRecord[]> {
  const db = await getDB();
  return db.getAll('serviceItems');
}

export async function putServiceItems(items: ServiceItemRecord[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('serviceItems', 'readwrite');
  await Promise.all([
    ...items.map((item) => tx.store.put(item)),
    tx.done,
  ]);
}

// --- Service Categories ---

export async function getAllServiceCategories(): Promise<ServiceCategoryRecord[]> {
  const db = await getDB();
  return db.getAll('serviceCategories');
}

export async function putServiceCategories(categories: ServiceCategoryRecord[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('serviceCategories', 'readwrite');
  await Promise.all([
    ...categories.map((cat) => tx.store.put(cat)),
    tx.done,
  ]);
}

// --- Staff ---

export async function getAllStaff(): Promise<StaffRecord[]> {
  const db = await getDB();
  return db.getAll('staff');
}

export async function putStaff(staffList: StaffRecord[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('staff', 'readwrite');
  await Promise.all([
    ...staffList.map((s) => tx.store.put(s)),
    tx.done,
  ]);
}

// --- Members ---

export async function searchMembers(keyword: string): Promise<MemberRecord[]> {
  const db = await getDB();
  const all = await db.getAll('memberCache');
  const lower = keyword.toLowerCase();
  return all.filter(
    (m) =>
      m.phone.toLowerCase().includes(lower) ||
      m.name.toLowerCase().includes(lower) ||
      m.cardNo.toLowerCase().includes(lower)
  );
}

export async function putMembers(members: MemberRecord[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('memberCache', 'readwrite');
  await Promise.all([
    ...members.map((m) => tx.store.put(m)),
    tx.done,
  ]);
}

// --- Order Queue ---

export async function enqueueOrder(order: OrderQueueRecord['orderData']): Promise<number> {
  const db = await getDB();
  return db.add('orderQueue', {
    orderData: order,
    status: 'pending',
    createdAt: Date.now(),
    retryCount: 0,
  });
}

export async function getPendingOrders(): Promise<OrderQueueRecord[]> {
  const db = await getDB();
  return db.getAllFromIndex('orderQueue', 'by-status', 'pending');
}

export async function getFailedOrders(): Promise<OrderQueueRecord[]> {
  const db = await getDB();
  return db.getAllFromIndex('orderQueue', 'by-status', 'failed');
}

export async function updateOrderStatus(
  id: number,
  status: OrderQueueStatus,
  error?: string
): Promise<void> {
  const db = await getDB();
  const record = await db.get('orderQueue', id);
  if (record) {
    const updated: OrderQueueRecord = {
      ...record,
      status,
      retryCount: record.retryCount + 1,
      error,
    };
    await db.put('orderQueue', updated);
  }
}

export async function removeOrder(id: number): Promise<void> {
  const db = await getDB();
  await db.delete('orderQueue', id);
}

export async function getPendingOrderCount(): Promise<number> {
  const pending = await getPendingOrders();
  return pending.length;
}

export type {
  ServiceItemRecord,
  ServiceCategoryRecord,
  StaffRecord,
  MemberRecord,
  OrderQueueRecord,
  OrderQueueStatus,
};
