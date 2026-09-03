export type TaskHandler = (...args: unknown[]) => Promise<void>;

const registry = new Map<string, TaskHandler>();

export function registerTask(area: string, name: string, handler: TaskHandler) {
  registry.set(`${area}:${name}`, handler);
}

export function getTask(area: string, name: string): TaskHandler | undefined {
  return registry.get(`${area}:${name}`);
}

export function listTasks(): Array<{ area: string; name: string }> {
  return [...registry.keys()].map((key) => {
    const idx = key.indexOf(":");
    return { area: key.slice(0, idx), name: key.slice(idx + 1) };
  });
}
