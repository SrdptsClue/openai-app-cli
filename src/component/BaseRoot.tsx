import { FC, PropsWithChildren, useEffect } from "react"
import { changeLanguage } from "../i18n"
import { useOpenAiGlobal } from "../openai/use-openai-global"
import { createToastContainer } from "../utils/toast"

export const BaseRoot: FC<PropsWithChildren> = ({ children }) => {
  const locale = useOpenAiGlobal("locale")
  const theme = useOpenAiGlobal("theme")

  useEffect(() => {
    createToastContainer()
  }, [])

  useEffect(() => {
    console.log("[openai locale]", locale)
    changeLanguage(locale)
  }, [locale])

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark")
      document.documentElement.classList.remove("light")
      document.documentElement.dataset.theme = "dark"
    } else {
      document.documentElement.classList.add("light")
      document.documentElement.classList.remove("dark")
      document.documentElement.dataset.theme = "light"
    }
  }, [theme])

  return children
}
