export declare function parseXml(xmlStr: string): Document | null;
export declare function buildXml(obj: Record<string, any>): string;
export declare function extractXmlContent(xml: string): {
    content: string;
    isPlugin: boolean;
}[];
export declare function extractPluginContent(xml: string): {
    pluginId: string;
    content: string;
}[];
export declare function processPluginContent(content: string, plugin: any): any;
//# sourceMappingURL=xml.d.ts.map