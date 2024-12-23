import React, { useState } from 'react'

interface PopoverProps {
  children: React.ReactNode
  content: React.ReactNode
}

export function Popover({ children, content }: PopoverProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative inline-block">
      <div onClick={() => setIsOpen(!isOpen)}>{children}</div>
      {isOpen && (
        <div className="absolute z-10 mt-2 bg-white rounded-md shadow-lg">
          {content}
        </div>
      )}
    </div>
  )
}

export const PopoverTrigger: React.FC<{ asChild?: boolean; children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>
}

export const PopoverContent: React.FC<{ children: React.ReactNode; className?: string; align?: string }> = ({ children, className }) => {
  return <div className={className}>{children}</div>
}

