import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import { execSync } from 'child_process'

let commitSha = 'local-dev'
let gitBranch = 'fix/persistence-live'
try {
  commitSha = execSync('git rev-parse --short HEAD').toString().trim()
  gitBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim()
} catch {}

const buildTime = new Date().toISOString()

// https://vite.dev/config/
export default defineConfig({
  root: fs.realpathSync(process.cwd()),
  plugins: [react()],
  define: {
    __COMMIT_SHA__: JSON.stringify(process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || commitSha),
    __GIT_BRANCH__: JSON.stringify(process.env.VERCEL_GIT_COMMIT_REF || gitBranch),
    __BUILD_TIME__: JSON.stringify(buildTime),
  },
})
