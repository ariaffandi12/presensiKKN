import { EventEmitter } from 'events';

class GlobalRealtimeBus extends EventEmitter {}

// Use global singleton so event emitter survives HMR and route reloads
const globalForBus = globalThis as unknown as {
  realtimeBus: GlobalRealtimeBus | undefined;
};

export const realtimeBus = globalForBus.realtimeBus ?? new GlobalRealtimeBus();
realtimeBus.setMaxListeners(100);

if (process.env.NODE_ENV !== 'production') {
  globalForBus.realtimeBus = realtimeBus;
}

export function broadcastEvent(event: string, data: any) {
  realtimeBus.emit('change', { event, data, timestamp: Date.now() });
}
