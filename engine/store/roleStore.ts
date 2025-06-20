// engine/store/roleStore.ts
// 多端同构 Role store 纯逻辑定义
export interface AIRole {
  id: string;
  name: string;
  avatar?: string;
  description: string;
  systemPrompt: string;
  tags: string[];
  isCustom?: boolean;
}

export interface RoleState {
  roles: AIRole[];
  selectedRole: AIRole | null;
  setSelectedRole: (role: AIRole | null) => void;
  addRole: (role: AIRole) => void;
  deleteRole: (id: string) => void;
  updateRole: (id: string, role: Partial<AIRole>) => void;
}

export const defaultRoles: AIRole[] = [
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

export const roleStoreDefinition = (set: any) => ({
  roles: defaultRoles,
  selectedRole: defaultRoles[0],
  setSelectedRole: (role: AIRole | null) => set({ selectedRole: role }),
  addRole: (role: AIRole) => set((state: RoleState) => ({ roles: [...state.roles, role] })),
  deleteRole: (id: string) => set((state: RoleState) => ({
    roles: state.roles.filter((r) => r.id !== id),
    selectedRole: state.selectedRole?.id === id ? defaultRoles[0] : state.selectedRole,
  })),
  updateRole: (id: string, role: Partial<AIRole>) => set((state: RoleState) => ({
    roles: state.roles.map((r) => r.id === id ? { ...r, ...role } : r),
    selectedRole: state.selectedRole?.id === id ? { ...state.selectedRole, ...role } : state.selectedRole,
  })),
});
