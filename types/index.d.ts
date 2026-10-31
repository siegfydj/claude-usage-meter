export type Meter = { kind: string; percentUsed: number; resetsAt?: string }

declare module 'claude-code' {
  interface PluginState {
    'usage-meter': { meters: Meter[] }
  }
}
