import { useState, useCallback, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { ChatInfo } from '@/types/chat'
import { ChatStorageService } from '@/services/chatStorage'
import { defaultStorage } from '@/utils/storage'

// 创建全局共享的存储服务实例
const chatStorage = new ChatStorageService(defaultStorage)

/**
 * 聊天列表管理Hook
 * 处理聊天列表的增删改查和当前聊天的状态管理
 */
export const useChatList = () => {
  // 聊天列表状态
  const [chatList, setChatList] = useState<ChatInfo[]>([])
  // 当前选中的聊天ID
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  // 加载状态
  const [loading, setLoading] = useState(true)

  // 初始化加载聊天列表
  useEffect(() => {
    const list = chatStorage.getChatList()
    const currentId = chatStorage.getCurrentChatId()
    
    setChatList(list)
    setCurrentChatId(currentId || (list.length > 0 ? list[0].id : null))
    setLoading(false)
  }, [])

  // 创建新聊天
  const createChat = useCallback(() => {
    const newChat: ChatInfo = {
      id: uuidv4(),
      title: '新对话',
      createTime: Date.now(),
      updateTime: Date.now(),
      messageCount: 0
    }

    setChatList(prev => {
      const newList = [newChat, ...prev]
      chatStorage.saveChatList(newList)
      return newList
    })

    // 创建空的聊天数据
    chatStorage.saveChatData(newChat.id, {
      info: newChat,
      messages: []
    })

    // 设置为当前聊天
    setCurrentChatId(newChat.id)
    chatStorage.saveCurrentChatId(newChat.id)

    return newChat.id
  }, [])
  // 删除聊天
  const deleteChat = useCallback((chatId: string) => {
    try {
      // 先删除聊天数据
      chatStorage.deleteChatData(chatId);

      setChatList(prev => {
        const newList = prev.filter(chat => chat.id !== chatId);
        
        // 如果删除的是当前聊天，切换到新列表的第一个聊天
        if (currentChatId === chatId) {
          const newCurrentId = newList[0]?.id || null;
          setCurrentChatId(newCurrentId);
          chatStorage.saveCurrentChatId(newCurrentId);
        }
        
        // 保存新的聊天列表
        chatStorage.saveChatList(newList);
        return newList;
      });

    } catch (error) {
      console.error('Failed to delete chat:', error);
      throw error;
    }
  }, [currentChatId])

  // 更新聊天信息
  const updateChatInfo = useCallback((chatId: string, updates: Partial<ChatInfo>) => {
    setChatList(prev => {
      const newList = prev.map(chat => 
        chat.id === chatId 
          ? { ...chat, ...updates, updateTime: Date.now() } 
          : chat
      )
      chatStorage.saveChatList(newList)
      return newList
    })
  }, [])
  // 切换当前聊天
  const switchChat = useCallback((chatId: string) => {
    setCurrentChatId(chatId);
    chatStorage.saveCurrentChatId(chatId);
    
    // 确保聊天存在于列表中
    setChatList(prev => {
      if (!prev.find(chat => chat.id === chatId)) {
        const chatData = chatStorage.getChatData(chatId);
        if (chatData?.info) {
          const newList = [chatData.info, ...prev];
          chatStorage.saveChatList(newList);
          return newList;
        }
      }
      return prev;
    });
  }, [])

  return {
    chatList,
    currentChatId,
    loading,
    createChat,
    deleteChat,
    updateChatInfo,
    switchChat
  }
}
