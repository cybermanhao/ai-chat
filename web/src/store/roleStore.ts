// web/src/store/roleStore.ts
// 负责将 engine/store/roleStore 的定义绑定为 web 端 zustand store，并 re-export AIRole 类型
import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { AIRole } from '@engine/store/roleStore';

interface RoleState {
  roles: AIRole[];
  selectedRole: AIRole | null;
}

const defaultRoles: AIRole[] = [
  {
    id: 'assistant',
    name: '通用助手',
    description: '一个全能的AI助手，可以帮助你完成各种任务。',
    systemPrompt: '你是一个全能的AI助手，随时准备提供帮助。',
    tags: ['全能', '通用'],
  },
  {
    id: 'coder',
    name: '代码专家',
    description: '专注于编程和技术问题的AI助手。',
    systemPrompt: '你是一个经验丰富的程序员，精通各种编程语言和技术栈。',
    tags: ['编程', '技术'],
  },
  {
    id: 'writer',
    name: '写作助手',
    description: '帮助你进行创意写作和文案创作。',
    systemPrompt: '你是一个专业的写作助手，擅长各种文体的创作。',
    tags: ['写作', '创意'],
  },
  {
    id: 'translator',
    name: '翻译专家',
    description: '提供准确的多语言翻译服务。',
    systemPrompt: '你是一个精通多种语言的翻译专家。',
    tags: ['翻译', '语言'],
  },
];

const initialState: RoleState = {
  roles: defaultRoles,
  selectedRole: defaultRoles[0],
};

const roleSlice = createSlice({
  name: 'role',
  initialState,
  reducers: {
    setSelectedRole(state, action: PayloadAction<AIRole | null>) {
      state.selectedRole = action.payload;
    },
    addRole(state, action: PayloadAction<AIRole>) {
      state.roles.push(action.payload);
    },
    deleteRole(state, action: PayloadAction<string>) {
      state.roles = state.roles.filter(r => r.id !== action.payload);
      if (state.selectedRole?.id === action.payload) {
        state.selectedRole = defaultRoles[0];
      }
    },
    updateRole(state, action: PayloadAction<{ id: string; role: Partial<AIRole> }>) {
      const { id, role } = action.payload;
      state.roles = state.roles.map(r => r.id === id ? { ...r, ...role } : r);
      if (state.selectedRole?.id === id) {
        state.selectedRole = { ...state.selectedRole, ...role };
      }
    },
  },
});

export const { setSelectedRole, addRole, deleteRole, updateRole } = roleSlice.actions;
export default roleSlice.reducer;
