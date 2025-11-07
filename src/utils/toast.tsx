import { AnimatePresence, motion } from "framer-motion"
import { ReactNode, useEffect, useState } from "react"
import ReactDOM from "react-dom/client"

interface ToastItem {
  id: number
  content: ReactNode
  duration: number
}

const TOAST_EVENT = "GLOBAL_TOAST_EVENT"

function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    const handler = (e: Event) => {
      const item = (e as CustomEvent<ToastItem>).detail
      setToasts((prev) => [...prev, item])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== item.id))
      }, item.duration ?? 3000)
    }

    window.addEventListener(TOAST_EVENT, handler)
    return () => window.removeEventListener(TOAST_EVENT, handler)
  }, [])

  return (
    <div
      style={{
        position: "fixed",
        top: 20,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        zIndex: 9999,
      }}
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="pointer-events-none select-none rounded-xl px-3 py-1.5 text-color-text-secondary bg-color-surface-primary"
            style={{
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            }}
          >
            {toast.content}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export function createToastContainer() {
  if (document.getElementById("global-toast-root")) {
    return
  }

  const div = document.createElement("div")
  div.id = "global-toast-root"

  document.body.appendChild(div)

  const root = ReactDOM.createRoot(div)
  root.render(<ToastContainer />)
}

export function toast(content: string, duration = 3000) {
  const id = Date.now() + Math.random()
  const event = new CustomEvent<ToastItem>(TOAST_EVENT, {
    detail: { id, content, duration },
  })

  window.dispatchEvent(event)
}

// @ts-ignore
window.toast = toast
