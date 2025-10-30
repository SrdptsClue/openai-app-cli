import { useEffect } from "react"
import { useOpenAiGlobal } from "../../openai/use-openai-global"
import { createAppPage } from "../../utils/base"
import { cn } from "../../utils/cn"

function App() {
  const toolOutput = useOpenAiGlobal("toolOutput")

  useEffect(() => {
    console.log("[openai toolOutput]", toolOutput)
  }, [toolOutput])

  return (
    <div
      className={cn(
        "w-screen h-screen",
        "flex justify-center items-center",
        "text-6xl font-semibold italic underline"
      )}
    >
      hello world
    </div>
  )
}

createAppPage("example", <App />)
