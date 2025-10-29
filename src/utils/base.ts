import "../index.css"

import { ReactNode } from "react"
import { createRoot } from "react-dom/client"

export function createAppPage(widgetName: string, component: ReactNode) {
  const root = document.getElementById(`${widgetName}-root`)

  if (root) {
    createRoot(root).render(component)
  }
}
