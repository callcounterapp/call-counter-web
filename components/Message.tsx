import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface MessageProps {
  id: string
  title: string
  description: string
  variant: 'default' | 'destructive' | 'success'
  duration?: number
  onClose: (id: string) => void
}

export const Message: React.FC<MessageProps> = ({
  id,
  title,
  description,
  variant = 'default',
  duration = 5000,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      onClose(id)
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, id, onClose])

  if (!isVisible) return null

  const variantStyles = {
    default: 'bg-gray-800 border-gray-700',
    destructive: 'bg-red-900 border-red-800',
    success: 'bg-green-900 border-green-800',
  }

  return (
    <div
      className={`fixed bottom-4 right-4 p-4 rounded-md shadow-lg border ${variantStyles[variant]} text-white`}
      role="alert"
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold">{title}</h3>
          <p className="text-sm">{description}</p>
        </div>
        <button
          onClick={() => {
            setIsVisible(false)
            onClose(id)
          }}
          className="ml-4 text-white hover:text-gray-300"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  )
}

export const useMessage = () => {
  const [messages, setMessages] = useState<React.ReactNode[]>([])

  const showMessage = (props: Omit<MessageProps, 'onClose'>) => {
    const messageComponent = (
      <Message
        key={props.id}
        {...props}
        onClose={(id) => {
          setMessages((prevMessages) =>
            prevMessages.filter((msg) => (msg as React.ReactElement).key !== id)
          )
        }}
      />
    )
    setMessages((prevMessages) => [...prevMessages, messageComponent])
  }

  return { messages, showMessage }
}

