import "../i18n"
import "../index.css"

import { ReactNode } from "react"
import { createRoot } from "react-dom/client"
import { initI18n } from "../i18n"

export async function createAppPage(widgetName: string, component: ReactNode) {
  await initI18n()

  const root = document.getElementById(`${widgetName}-root`)
  if (root) {
    createRoot(root).render(component)
  }
}
