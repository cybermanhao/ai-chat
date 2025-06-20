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
export declare const defaultRoles: AIRole[];
export declare const roleStoreDefinition: (set: any) => {
    roles: AIRole[];
    selectedRole: AIRole;
    setSelectedRole: (role: AIRole | null) => any;
    addRole: (role: AIRole) => any;
    deleteRole: (id: string) => any;
    updateRole: (id: string, role: Partial<AIRole>) => any;
};
//# sourceMappingURL=roleStore.d.ts.map