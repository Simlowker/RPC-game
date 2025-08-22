//useToast.ts
import { useState, useCallback } from 'react'

export interface Toast {
  id: string
  title: string
  description: string
  link?: string
}

export type ToastInput = Omit<Toast, 'id'>

// Simple toast implementation without zustand
let toastListeners: Array<(toasts: Toast[]) => void> = []
let toasts: Toast[] = []

const notifyListeners = () => {
  toastListeners.forEach(listener => listener([...toasts]))
}

const addToast = (toast: ToastInput) => {
  const newToast = { ...toast, id: String(Math.random()) }
  toasts = [...toasts, newToast]
  notifyListeners()
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    toasts = toasts.filter(t => t.id !== newToast.id)
    notifyListeners()
  }, 5000)
}

export function useToast() {
  return useCallback(addToast, [])
}
