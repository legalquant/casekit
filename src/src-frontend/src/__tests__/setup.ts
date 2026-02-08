/**
 * Vitest test setup — runs before every test file.
 * Mocks Tauri APIs so tests can run without the Tauri runtime.
 */
import { vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

// ── Mock @tauri-apps/api/core ──
// The invoke mock registry lets individual tests define return values per command
const invokeRegistry = new Map<string, (...args: unknown[]) => unknown>();

export function mockInvoke(command: string, handler: (...args: unknown[]) => unknown) {
    invokeRegistry.set(command, handler);
}

export function clearInvokeMocks() {
    invokeRegistry.clear();
}

vi.mock('@tauri-apps/api/core', () => ({
    invoke: vi.fn((cmd: string, args?: Record<string, unknown>) => {
        const handler = invokeRegistry.get(cmd);
        if (handler) return Promise.resolve(handler(args));
        return Promise.reject(new Error(`Unmocked Tauri command: ${cmd}`));
    }),
}));

// ── Mock @tauri-apps/api/event ──
vi.mock('@tauri-apps/api/event', () => ({
    listen: vi.fn(() => Promise.resolve(() => {})),
    emit: vi.fn(() => Promise.resolve()),
}));

// ── Mock @tauri-apps/plugin-dialog ──
vi.mock('@tauri-apps/plugin-dialog', () => ({
    open: vi.fn(() => Promise.resolve(null)),
    save: vi.fn(() => Promise.resolve(null)),
}));

// ── Mock @tauri-apps/plugin-fs ──
vi.mock('@tauri-apps/plugin-fs', () => ({
    readTextFile: vi.fn(() => Promise.resolve('')),
    writeTextFile: vi.fn(() => Promise.resolve()),
}));

// ── Mock @tauri-apps/plugin-opener ──
vi.mock('@tauri-apps/plugin-opener', () => ({
    openUrl: vi.fn(() => Promise.resolve()),
}));

// ── Mock localStorage ──
const localStorageMap = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', {
    value: {
        getItem: (key: string) => localStorageMap.get(key) ?? null,
        setItem: (key: string, value: string) => localStorageMap.set(key, value),
        removeItem: (key: string) => localStorageMap.delete(key),
        clear: () => localStorageMap.clear(),
    },
    writable: true,
});

// ── Mock sessionStorage ──
const sessionStorageMap = new Map<string, string>();
Object.defineProperty(globalThis, 'sessionStorage', {
    value: {
        getItem: (key: string) => sessionStorageMap.get(key) ?? null,
        setItem: (key: string, value: string) => sessionStorageMap.set(key, value),
        removeItem: (key: string) => sessionStorageMap.delete(key),
        clear: () => sessionStorageMap.clear(),
    },
    writable: true,
});

// ── Mock crypto.randomUUID ──
let uuidCounter = 0;
Object.defineProperty(globalThis, 'crypto', {
    value: {
        randomUUID: () => `test-uuid-${++uuidCounter}`,
    },
    writable: true,
});

// ── Mock window.confirm ──
globalThis.confirm = vi.fn(() => true);

// ── Reset state between tests ──
import { beforeEach } from 'vitest';
beforeEach(() => {
    invokeRegistry.clear();
    localStorageMap.clear();
    sessionStorageMap.clear();
    uuidCounter = 0;
});
