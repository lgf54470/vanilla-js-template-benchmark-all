import { MODULE_METAS } from "./generated-module-registry.js";
import { eventBus } from "./event-bus.js";

class ModuleRegistry {
  constructor() {
    this.modules = new Map();
    // Pre-populate with auto-generated metadata
    for (const meta of MODULE_METAS) {
      this.modules.set(meta.id, { ...meta });
    }
  }

  register(module) {
    if (!module || !module.id) {
      throw new Error("Module must have an 'id'");
    }
    const existing = this.modules.get(module.id) || {};
    this.modules.set(module.id, { ...existing, ...module });
    eventBus.emit("module:registered", { module: this.modules.get(module.id) });
  }

  getModule(id) {
    return this.modules.get(id) || null;
  }

  getModules() {
    return Array.from(this.modules.values()).sort(
      (a, b) => (a.order ?? 99) - (b.order ?? 99),
    );
  }

  async loadModule(id) {
    const mod = this.getModule(id);
    if (!mod) throw new Error(`Module ${id} not found`);

    if (!mod.instance && mod.entryPath) {
      try {
        const imported = await import(mod.entryPath);
        mod.instance = imported.default || imported;
      } catch (err) {
        console.error(`Failed to load module ${id}:`, err);
        throw err;
      }
    }
    return mod.instance || null;
  }
}

export const moduleRegistry = new ModuleRegistry();
