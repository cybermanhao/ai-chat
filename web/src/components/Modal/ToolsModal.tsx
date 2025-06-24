import ToolManagerModal from './ToolManagerModal';

const ToolsModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  // 复用 ToolManagerModal，传递主题色
  return <ToolManagerModal open={open} onClose={onClose} themeColor="var(--primary-color)" />;
};

export default ToolsModal;
