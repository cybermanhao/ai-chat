export interface StorageLike {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
}
export declare const memoryStorage: StorageLike;
export declare function getStorage(): StorageLike;
export declare const defaultStorage: StorageLike;
//# sourceMappingURL=storage.d.ts.map