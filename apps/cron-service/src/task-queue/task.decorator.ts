import { registerTask } from "./task-registry";

export function TaskHandler(area: string, name: string): PropertyDecorator {
  return function (target: object, propertyKey: string | symbol) {
    const descriptor = Object.getOwnPropertyDescriptor(target, propertyKey);
    const originalMethod = descriptor?.value;
    if (typeof originalMethod !== "function") {
      throw new Error(`@TaskHandler can only be applied to methods, got ${typeof originalMethod}`);
    }
    const wrapped = function (this: unknown, ...args: unknown[]) {
      registerTask(area, name, async (...methodArgs: unknown[]) => {
        await originalMethod.call(this, ...methodArgs);
      });
      return originalMethod.call(this, ...args);
    };
    Object.defineProperty(target, propertyKey, {
      value: wrapped,
      writable: true,
      configurable: true,
    });
  };
}
