/**
 * Focura global event bus.
 * Modules emit and subscribe to app-wide events (XP awards, task completions,
 * pet reactions) without importing each other.
 */
export type RewardTier = 'base' | 'bonus' | 'rare' | 'legendary';

export interface RewardRollResult {
  tier: RewardTier;
  multiplier: number;
  message: string;
  effect: 'normal' | 'enhanced' | 'spectacular';
}

export type FocuraEventMap = {
  "xp:awarded": { amount: number; source: string; total: number; level: number };
  "level:up": { level: number };
  "pet:react": { message: string };
  "task:completed": { task: any };
  "timer:session-complete": { minutes: number };
  "timer:break-complete": {};
  "streak:broken": {};
  "timer:start": {};
  "timer:pause": {};
  "timer:resume": {};
  "timer:stop": {};
  "theme:changed": { theme: "light" | "dark" };
  "reward:triggered": RewardRollResult & { baseXp: number };
};

type Handler<T> = (payload: T) => void;

class EventBus {
  private handlers = new Map<string, Set<Handler<never>>>();

  on<K extends keyof FocuraEventMap>(event: K, handler: Handler<FocuraEventMap[K]>) {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event)!.add(handler as Handler<never>);
    return () => this.off(event, handler);
  }

  off<K extends keyof FocuraEventMap>(event: K, handler: Handler<FocuraEventMap[K]>) {
    this.handlers.get(event)?.delete(handler as Handler<never>);
  }

  emit<K extends keyof FocuraEventMap>(event: K, payload: FocuraEventMap[K]) {
    this.handlers.get(event)?.forEach((h) => (h as Handler<FocuraEventMap[K]>)(payload));
  }
}

export const bus = new EventBus();
