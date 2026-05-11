import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { AuthProvider } from '../providers/AuthProvider'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error instanceof Error) {
          const msg = error.message.toLowerCase()
          if (msg.includes('not authenticated') || msg.includes('jwt')) return false
          if (msg.includes('pgrst116')) return false
        }
        return failureCount < 2
      },
      refetchOnWindowFocus: true,
      refetchOnMount: false,
    },
    mutations: { retry: 1 },
  },
})

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      {children}
    </AuthProvider>
    {import.meta.env.DEV && (
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
    )}
  </QueryClientProvider>
)

export { queryClient }
