import { createRoot } from "react-dom/client";
import { cn } from "../../utils/cn";

export function App() {
  return (
    <div className={cn("text-9xl text-shadow-emerald-400")}>hello world111</div>
  );
}

const root = document.getElementById("home-root");
if (root) {
  createRoot(root).render(<App />);
}
