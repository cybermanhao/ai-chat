import { App } from 'antd'
import styles from './Chat.module.less'
import OpenAI from 'openai'
import { useLLMStore } from '@/store/llmStore'
import { useChatStore } from '@/store/chatStore'
import Talking from '@/components/Talking'
import { useState, useCallback } from 'react'
import { usePluginStore } from '@/store/pluginStore'
import type { APIMessage } from '@/types/openai'

const MAX_MESSAGE_LENGTH = 4000

const Chat = () => {
  const { selectedLLM, selectedModel, tokens } = useLLMStore()
  const { messages, addMessage } = useChatStore()
  const [loading, setLoading] = useState(false)
  const { message } = App.useApp()

  const validateMessage = useCallback((messageText: string) => {
    if (!messageText.trim()) {
      message.warning('请输入消息内容')
      return false
    }

    if (messageText.length > MAX_MESSAGE_LENGTH) {
      message.warning(`消息长度不能超过 ${MAX_MESSAGE_LENGTH} 字符`)
      return false
    }

    if (!selectedLLM || !tokens[selectedLLM.id]) {
      message.error('请先在设置中配置 API 密钥')
      return false
    }

    return true
  }, [selectedLLM, tokens, message])

  const handleSendMessage = async (messageText: string) => {
    if (!validateMessage(messageText)) return
    if (!selectedLLM) return // TypeScript check
    setLoading(true)

    // 添加用户消息到UI
    addMessage({
      content: messageText,
      role: 'user'
    })

    try {
      const client = new OpenAI({
        baseURL: selectedLLM.baseUrl,
        apiKey: tokens[selectedLLM.id],
        dangerouslyAllowBrowser: true,
      })

      // 添加等待消息到UI
      const thinkingMessage = {
        content: '正在思考...',
        role: 'assistant'
      }
      addMessage(thinkingMessage)

      // 准备API调用的消息数组
      const apiMessages: APIMessage[] = [
        { role: 'developer', content: 'You are a helpful assistant.' }
      ];

      // 如果有启用的插件，先添加插件功能说明
      const pluginPrompts = usePluginStore.getState().getSystemPrompts();
      if (pluginPrompts.length > 0) {
        apiMessages.unshift({
          role: 'developer',
          content: pluginPrompts.join('\n\n')
        });
      }

      // 添加用户消息到API请求
      apiMessages.push({ role: 'user', content: messageText });

      const completion = await client.chat.completions.create({
        messages: apiMessages,
        model: selectedModel,
        stream: false,
      })

      const reply = completion.choices[0]?.message?.content

      if (!reply) {
        throw new Error('No response from API')
      }

      // 更新助手消息到UI
      addMessage({
        content: reply,
        role: 'assistant'
      })
      message.success('消息发送成功')
    } catch (err) {
      console.error('Failed to process message:', err)
      
      const errorMessage = err instanceof Error ? err.message : '未知错误'
      addMessage({
        content: `抱歉，处理消息时出现错误: ${errorMessage}`,
        role: 'assistant'
      })
      message.error('消息处理失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.chatContainer}>
      <div className={styles.messageContainer}>
        <Talking 
          messages={messages} 
          loading={loading}
          onSend={handleSendMessage}
          disabled={!selectedLLM || !tokens[selectedLLM.id]}
        />
      </div>
    </div>
  )
}

export default Chat
