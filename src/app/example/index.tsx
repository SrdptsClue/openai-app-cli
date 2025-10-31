import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { BaseRoot } from "../../component/BaseRoot"
import { useOpenAiGlobal } from "../../openai/use-openai-global"
import { createAppPage } from "../../utils/base"
import { cn } from "../../utils/cn"

function App() {
  const [t] = useTranslation()
  const toolOutput = useOpenAiGlobal("toolOutput")

  useEffect(() => {
    console.log("[openai toolOutput]", toolOutput)
  }, [toolOutput])

  return (
    <BaseRoot>
      <div
        className={cn(
          "w-screen h-screen",
          "flex flex-col justify-center items-center gap-32"
        )}
      >
        <h1 className="text-6xl font-semibold italic underline text-color-text-secondary">
          {t("examle.title")}
        </h1>

        {toolOutput && <p>{JSON.stringify(toolOutput)}</p>}
      </div>
    </BaseRoot>
  )
}

createAppPage("example", <App />)
