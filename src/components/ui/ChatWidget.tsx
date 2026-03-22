'use client'

import { useState } from 'react'
import { MessageSquare, X, Send } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface ChatWidgetProps {
  className?: string
}

export function ChatWidget({ className = "" }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')

  const handleSend = () => {
    if (!message.trim()) return

    // Redirection vers WhatsApp avec le message
    const phoneNumber = "33188334343"
    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`

    window.open(whatsappUrl, '_blank')
    setMessage('')
    setIsOpen(false)
  }

  return (
    <>
      {/* Chat Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-20 right-6 z-50 bg-accent hover:bg-[#0F3460] text-white rounded-full p-4 shadow-lg transition-all duration-300 ${className}`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.5, type: "spring", damping: 20, stiffness: 300 }}
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
        {!isOpen && (
          <div className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
            1
          </div>
        )}
      </motion.button>

      {/* Chat Widget */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-36 right-6 z-50 bg-white rounded-lg shadow-xl border border-gray-200 w-80 max-w-[calc(100vw-3rem)]"
          >
            {/* Header */}
            <div className="bg-accent text-white p-4 rounded-t-lg">
              <h3 className="font-semibold">Dermotec Advanced</h3>
              <p className="text-sm text-blue-100">En ligne maintenant</p>
            </div>

            {/* Messages */}
            <div className="p-4 h-48 overflow-y-auto">
              <div className="mb-4">
                <div className="bg-gray-100 rounded-lg p-3 mb-2">
                  <p className="text-sm">👋 Bonjour ! Je suis là pour vous aider.</p>
                </div>
                <div className="bg-gray-100 rounded-lg p-3">
                  <p className="text-sm">
                    Vous avez des questions sur nos formations ?
                    Besoin d'aide pour le financement ?
                    Écrivez-moi votre question !
                  </p>
                </div>
              </div>
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Tapez votre message..."
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <button
                  onClick={handleSend}
                  disabled={!message.trim()}
                  className="bg-primary hover:bg-primary disabled:bg-gray-300 text-white rounded-lg p-2 transition-colors"
                >
                  <Send size={16} />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Nous vous répondrons via WhatsApp
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}