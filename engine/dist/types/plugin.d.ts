export interface XMLTag {
    description: string;
    allowedAttributes?: string[];
    render: (content: string, attributes: Record<string, string>) => string;
}
export interface Plugin {
    id: string;
    name: string;
    description: string;
    version: string;
    author: string;
    enabled: boolean;
    xmlTags: {
        [tagName: string]: XMLTag;
    };
    config?: Record<string, unknown>;
    configSchema?: {
        type: string;
        properties: Record<string, {
            type: string;
            description: string;
            default?: unknown;
        }>;
    };
    systemPrompt?: string;
}
export type PluginConfigValue = string | number | boolean | null | undefined;
export interface PluginConfig {
    enabled: boolean;
    [key: string]: PluginConfigValue;
}
//# sourceMappingURL=plugin.d.ts.map