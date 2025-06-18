import { Outlet } from 'react-router-dom'

interface ContextProviderProps {
  context: {
    setCurrentChatId: ((id: string) => void) | null;
  }
}

export const ContextProvider = ({ context }: ContextProviderProps) => {
  return <Outlet context={context} />
}