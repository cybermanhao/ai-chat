import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { Card, Tag, Button } from 'antd';
import type { AIRole } from '@/store/roleStore';
import './styles.less';

interface RoleCardProps {
  role: AIRole;
  selected: boolean;
  onSelect: (role: AIRole) => void;
  onEdit?: (role: AIRole, e: React.MouseEvent) => void;
  onDelete?: (role: AIRole, e: React.MouseEvent) => void;
}

const RoleCard: React.FC<RoleCardProps> = ({
  role,
  selected,
  onSelect,
  onEdit,
  onDelete,
}) => {
  return (
    <Card
      hoverable
      className={selected ? 'selected' : ''}
      onClick={() => onSelect(role)}
      actions={role.isCustom ? [
        <Button
          key="edit"
          icon={<EditOutlined />}
          onClick={(e) => onEdit?.(role, e)}
        />,
        <Button
          key="delete"
          danger
          icon={<DeleteOutlined />}
          onClick={(e) => onDelete?.(role, e)}
        />
      ] : undefined}
    >
      <Card.Meta
        title={role.name}
        description={
          <>
            <div className="role-description">{role.description}</div>
            <div className="role-tags">
              {role.tags.map(tag => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </div>
          </>
        }
      />
    </Card>
  );
};

export default RoleCard;
