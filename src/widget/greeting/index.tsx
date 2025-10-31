import { Loader2 } from "lucide-react"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { BaseRoot } from "../../component/BaseRoot"
import { useOpenAiGlobal } from "../../openai/use-openai-global"
import { createAppPage } from "../../utils/base"
import { cn } from "../../utils/cn"

function App() {
  const [t] = useTranslation()
  const data = useOpenAiGlobal("toolInput")

  useEffect(() => {
    console.log("[openai toolInput]", data)
  }, [data])

  return (
    <BaseRoot>
      <div
        className={cn(
          "w-screen h-screen",
          "flex flex-col justify-center items-center gap-24"
        )}
      >
        <h1 className="text-6xl font-semibold italic underline text-color-text-primary">
          {t("examle.title")}
        </h1>

        {data ? (
          <p className="italic text-color-text-secondary">
            {JSON.stringify(data)}
          </p>
        ) : (
          <Loader2 className="size-8 shrink-0 animate-spin text-color-text-secondary" />
        )}
      </div>
    </BaseRoot>
  )
}

createAppPage("greeting", <App />)
