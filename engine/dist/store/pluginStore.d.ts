import type { Plugin } from '../types/plugin';
export interface PluginState {
    plugins: Plugin[];
    configs: Record<string, Record<string, unknown>>;
    addPlugin: (plugin: Plugin) => void;
    removePlugin: (id: string) => void;
    enablePlugin: (id: string) => void;
    disablePlugin: (id: string) => void;
    getSystemPrompts: () => string[];
    updatePluginConfig: (id: string, config: Record<string, unknown>) => void;
}
export declare const pluginStoreDefinition: (set: any, get: any) => {
    plugins: never[];
    configs: {};
    addPlugin: (plugin: Plugin) => any;
    removePlugin: (id: string) => any;
    enablePlugin: (id: string) => any;
    disablePlugin: (id: string) => any;
    getSystemPrompts: () => string[];
    updatePluginConfig: (id: string, config: Record<string, unknown>) => any;
};
//# sourceMappingURL=pluginStore.d.ts.map