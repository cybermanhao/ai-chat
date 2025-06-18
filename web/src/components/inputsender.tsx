import { Sender } from '@ant-design/x'
import { App } from 'antd'
import { useState, useEffect } from 'react'
import type { KeyboardEvent } from 'react'
import './styles.less'

interface InputSenderProps {
  onSubmit?: (value: string) => void
  disabled?: boolean
}

const InputSender: React.FC<InputSenderProps> = ({ onSubmit, disabled }) => {
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)
  const { message } = App.useApp()

  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setLoading(false)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [loading, message])

  const handleSubmit = () => {
    if (!value.trim()) return
    
    if (onSubmit) {
      onSubmit(value.trim())
    }
    setValue('')
    setLoading(true)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="input-sender-container">      <Sender
        loading={loading || disabled}
        value={value}
        onChange={setValue}
        onSubmit={handleSubmit}
        onCancel={() => setLoading(false)}
        autoSize={{ minRows: 1, maxRows: 6 }}
        placeholder="在这里输入，问问大模型..."
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}

export default InputSender;