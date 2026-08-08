type RoleSelectorProps = {
  currentRole: string;
  roles: string[];
  onChange: (role: string) => void;
};

export function RoleSelector({ currentRole, roles, onChange }: RoleSelectorProps) {
  return (
    <label className="role-selector">
      <span>Role:</span>
      <select value={currentRole} onChange={(event) => onChange(event.target.value)}>
        {roles.map((role) => <option key={role} value={role}>{role}</option>)}
      </select>
    </label>
  );
}
