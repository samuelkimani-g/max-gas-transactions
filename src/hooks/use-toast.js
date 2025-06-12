"use client"

import { useState, useEffect } from "react"

const TOAST_TIMEOUT = 5000

export const useToast = () => {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    const interval = setInterval(() => {
      setToasts((toasts) => toasts.filter((toast) => toast.open))
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const toast = ({ title, description, variant }) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast = {
      id,
      title,
      description,
      variant,
      open: true,
    }

    setToasts((toasts) => [...toasts, newToast])

    setTimeout(() => {
      setToasts((toasts) => toasts.map((toast) => (toast.id === id ? { ...toast, open: false } : toast)))
    }, TOAST_TIMEOUT)

    return id
  }

  const dismiss = (id) => {
    setToasts((toasts) => toasts.map((toast) => (toast.id === id ? { ...toast, open: false } : toast)))
  }

  return { toasts, toast, dismiss }
}

export { useToast as toast }
