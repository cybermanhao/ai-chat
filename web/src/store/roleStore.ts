// web/src/store/roleStore.ts
// 负责将 engine/store/roleStore 的定义绑定为 web 端 zustand store，并 re-export AIRole 类型
import { create } from 'zustand';
import type { RoleState, AIRole } from '@engine/store/roleStore';
import { defaultRoles } from '@engine/store/roleStore';

export const useRoleStore = create<RoleState>((set, get) => ({
  roles: defaultRoles,
  selectedRole: null,
  setSelectedRole: (role) => set({ selectedRole: role }),
  addRole: (role) => set(state => ({ roles: [...state.roles, role] })),
  deleteRole: (id) => set(state => ({ roles: state.roles.filter(r => r.id !== id) })),
  updateRole: (id, role) => set(state => ({
    roles: state.roles.map(r => r.id === id ? { ...r, ...role } : r)
  })),
}));

export type { AIRole };
