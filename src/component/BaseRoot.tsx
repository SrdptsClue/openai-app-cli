import { FC, PropsWithChildren, useEffect } from "react"
import { changeLanguage } from "../i18n"
import { useOpenAiGlobal } from "../openai/use-openai-global"

export const BaseRoot: FC<PropsWithChildren> = ({ children }) => {
  const locale = useOpenAiGlobal("locale")

  useEffect(() => {
    console.log("[openai locale]", locale)
    changeLanguage(locale)
  }, [locale])

  return children
}
