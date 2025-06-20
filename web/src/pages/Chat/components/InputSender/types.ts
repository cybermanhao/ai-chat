export interface InputSenderProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => Promise<void>;
  onAbort: () => void;
  generating?: boolean;
  disabled?: boolean;
}
