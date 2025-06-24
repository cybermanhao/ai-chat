// web/src/store/roleStore.ts
// 负责将 engine/store/roleStore 的定义绑定为 web 端 zustand store，并 re-export AIRole 类型
import { create } from 'zustand';
import { roleStoreDefinition } from '@engine/store/roleStore';

export const useRoleStore = create(roleStoreDefinition);

export type { AIRole } from '@engine/store/roleStore';
