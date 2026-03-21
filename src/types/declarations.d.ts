// Module declarations for packages without types
declare module 'ai/react' {
  export function useChat(options?: {
    api?: string
    id?: string
    initialMessages?: any[]
    body?: Record<string, unknown>
    onFinish?: (message: any) => void
    onError?: (error: Error) => void
  }): {
    messages: any[]
    input: string
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
    handleSubmit: (e: React.FormEvent) => void
    isLoading: boolean
    error: Error | undefined
    setMessages: (messages: any[]) => void
    append: (message: any) => void
    reload: () => void
    stop: () => void
  }
}

declare module '@react-pdf/renderer' {
  import { ComponentType, ReactElement } from 'react'

  export const Document: ComponentType<{ children: React.ReactNode; title?: string; author?: string }>
  export const Page: ComponentType<{ size?: string; style?: any; children: React.ReactNode }>
  export const View: ComponentType<{ style?: any; children?: React.ReactNode; wrap?: boolean; break?: boolean }>
  export const Text: ComponentType<{ style?: any; children?: React.ReactNode; wrap?: boolean; break?: boolean }>
  export const Image: ComponentType<{ src: string; style?: any }>
  export const Link: ComponentType<{ src: string; style?: any; children?: React.ReactNode }>
  export const Font: {
    register: (config: { family: string; src?: string; fonts?: { src: string; fontWeight?: string | number; fontStyle?: string }[] }) => void
  }
  export const StyleSheet: {
    create: <T extends Record<string, any>>(styles: T) => T
  }
  export function renderToBuffer(element: ReactElement): Promise<Buffer>
  export function pdf(element: ReactElement): { toBuffer: () => Promise<Buffer>; toBlob: () => Promise<Blob> }
}
