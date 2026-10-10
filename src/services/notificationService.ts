import { NotificationAlert } from '../types/index.ts';

const STORAGE_PREFIX = 'eurobridge_notifications_read_';
const GLOBAL_KEY = 'eurobridge_notifications_read_global';
const SYNC_DEBOUNCE_MS = 600;

type NotificationChangeListener = (readIds: ReadonlySet<string>) => void;

export class NotificationService {
  private static instance: NotificationService;
  private memoryCache: Map<string, Set<string>> = new Map();
  private listeners: Set<NotificationChangeListener> = new Set();
  private pendingSyncs: Map<string, { alertIds: Set<string>; timer: any }> = new Map();

  constructor() {
    this.loadFromStorage('global');
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private resolveUserScope(userId?: string | null): string {
    return (!userId || userId.trim() === '') ? 'global' : userId.trim();
  }

  private loadFromStorage(scope: string): Set<string> {
    const cached = this.memoryCache.get(scope);
    if (cached) return cached;

    const set = new Set<string>();
    const storageKey = scope === 'global' ? GLOBAL_KEY : `${STORAGE_PREFIX}${scope}`;

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            parsed.forEach((id: unknown) => {
              if (typeof id === 'string' && id.trim().length > 0) {
                set.add(id.trim());
              }
            });
          }
        }
      }
    } catch (err) {
      console.warn('[NotificationService] Error reading localStorage read states:', err);
    }

    this.memoryCache.set(scope, set);
    return set;
  }

  private saveToStorage(scope: string, set: Set<string>): void {
    const storageKey = scope === 'global' ? GLOBAL_KEY : `${STORAGE_PREFIX}${scope}`;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const arr = Array.from(set);
        window.localStorage.setItem(storageKey, JSON.stringify(arr));
      }
    } catch (err) {
      console.warn('[NotificationService] Error writing localStorage read states:', err);
    }
  }

  public isRead(alertId: string, userId?: string | null): boolean {
    if (!alertId) return false;
    const scope = this.resolveUserScope(userId);
    const userSet = this.loadFromStorage(scope);
    if (userSet.has(alertId)) return true;
    if (scope !== 'global') {
      const globalSet = this.loadFromStorage('global');
      if (globalSet.has(alertId)) return true;
    }
    return false;
  }

  public markAsRead(alertId: string, userId?: string | null): void {
    if (!alertId) return;
    const scope = this.resolveUserScope(userId);
    const userSet = this.loadFromStorage(scope);
    if (!userSet.has(alertId)) {
      userSet.add(alertId);
      this.saveToStorage(scope, userSet);
      this.notifyListeners(userSet);
      if (userId && scope !== 'global') {
        this.scheduleDatabaseSync(userId, [alertId]);
      }
    }
  }

  public markAllAsRead(alertIds: string[], userId?: string | null): void {
    if (!alertIds || alertIds.length === 0) return;
    const scope = this.resolveUserScope(userId);
    const userSet = this.loadFromStorage(scope);
    let changed = false;
    const newItems: string[] = [];
    alertIds.forEach(id => {
      if (id && !userSet.has(id)) {
        userSet.add(id);
        newItems.push(id);
        changed = true;
      }
    });

    if (changed) {
      this.saveToStorage(scope, userSet);
      this.notifyListeners(userSet);
      if (userId && scope !== 'global' && newItems.length > 0) {
        this.scheduleDatabaseSync(userId, newItems);
      }
    }
  }

  public markAsUnread(alertId: string, userId?: string | null): void {
    if (!alertId) return;
    const scope = this.resolveUserScope(userId);
    const userSet = this.loadFromStorage(scope);
    if (userSet.has(alertId)) {
      userSet.delete(alertId);
      this.saveToStorage(scope, userSet);
      this.notifyListeners(userSet);
    }
  }

  public applyReadStates(alerts: NotificationAlert[], userId?: string | null): NotificationAlert[] {
    if (!alerts || !Array.isArray(alerts)) return [];
    const scope = this.resolveUserScope(userId);
    const userSet = this.loadFromStorage(scope);
    const globalSet = scope !== 'global' ? this.loadFromStorage('global') : null;

    return alerts.map(alert => {
      const isReadInUser = userSet.has(alert.id);
      const isReadInGlobal = globalSet ? globalSet.has(alert.id) : false;
      const isPersistentRead = isReadInUser || isReadInGlobal;
      return {
        ...alert,
        read: Boolean(alert.read || isPersistentRead)
      };
    });
  }

  public getUnreadCount(alerts: NotificationAlert[], userId?: string | null): number {
    if (!alerts || !Array.isArray(alerts)) return 0;
    return this.applyReadStates(alerts, userId).filter(a => !a.read).length;
  }

  public getReadIds(userId?: string | null): string[] {
    const scope = this.resolveUserScope(userId);
    const userSet = this.loadFromStorage(scope);
    return Array.from(userSet);
  }

  public async syncWithDatabase(userId: string): Promise<string[]> {
    if (!userId) return [];
    const scope = this.resolveUserScope(userId);
    const userSet = this.loadFromStorage(scope);

    try {
      const res = await fetch(`/api/notifications/read-states?userId=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.readIds)) {
          let updated = false;
          data.readIds.forEach((id: string) => {
            if (id && !userSet.has(id)) {
              userSet.add(id);
              updated = true;
            }
          });
          if (updated) {
            this.saveToStorage(scope, userSet);
            this.notifyListeners(userSet);
          }
          const localOnlyIds = Array.from(userSet).filter(id => !data.readIds.includes(id));
          if (localOnlyIds.length > 0) {
            this.scheduleDatabaseSync(userId, localOnlyIds);
          }
        }
      }
    } catch (err) {
      console.warn('[NotificationService] Database sync notice:', err);
    }
    return Array.from(userSet);
  }

  private scheduleDatabaseSync(userId: string, newAlertIds: string[]): void {
    if (!userId || newAlertIds.length === 0) return;
    let pending = this.pendingSyncs.get(userId);
    if (!pending) {
      pending = { alertIds: new Set<string>(), timer: null };
      this.pendingSyncs.set(userId, pending);
    }
    newAlertIds.forEach(id => pending!.alertIds.add(id));
    if (pending.timer) {
      clearTimeout(pending.timer);
    }
    pending.timer = setTimeout(async () => {
      const idsToSync = Array.from(pending!.alertIds);
      pending!.alertIds.clear();
      this.pendingSyncs.delete(userId);
      if (idsToSync.length === 0) return;

      try {
        await fetch('/api/notifications/read-states', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, alertIds: idsToSync })
        });
      } catch (err) {
        console.warn('[NotificationService] Could not persist read states to database:', err);
      }
    }, SYNC_DEBOUNCE_MS);
  }

  public async clearReadHistory(userId?: string | null): Promise<void> {
    const scope = this.resolveUserScope(userId);
    const userSet = this.loadFromStorage(scope);
    userSet.clear();
    this.saveToStorage(scope, userSet);
    this.notifyListeners(userSet);

    if (userId && scope !== 'global') {
      try {
        await fetch(`/api/notifications/read-states?userId=${encodeURIComponent(userId)}`, {
          method: 'DELETE'
        });
      } catch (err) {
        console.warn('[NotificationService] Failed to clear read states on database:', err);
      }
    }
  }

  public subscribe(listener: NotificationChangeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(readIds: Set<string>): void {
    const immutable = new Set(readIds);
    this.listeners.forEach(fn => {
      try {
        fn(immutable);
      } catch (e) {
        console.error('[NotificationService] Listener error:', e);
      }
    });
  }
}

export const notificationService = NotificationService.getInstance();
export default notificationService;
