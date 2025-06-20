// 修正 memoryStorage 类型实现，避免 _data 属性类型报错
const memoryData = {};
export const memoryStorage = {
    getItem(key) { return memoryData[key] || null; },
    setItem(key, value) { memoryData[key] = value; },
    removeItem(key) { delete memoryData[key]; },
};
export function getStorage() {
    if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage;
    }
    return memoryStorage;
}
export const defaultStorage = memoryStorage;
