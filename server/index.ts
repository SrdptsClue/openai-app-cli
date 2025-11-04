import { config as initEnv } from "dotenv"
import { bootstrap } from "./helper/app"

initEnv({ quiet: true })

void bootstrap()
