/**
 * KDesign 一键发布脚本：npm run deploy
 * 流程：拷贝 dist → deploy/kcharts → wrangler pages deploy 上传 Cloudflare Pages
 * Token 读取顺序：环境变量 CLOUDFLARE_API_TOKEN → 项目根目录 .cloudflare-token 文件（已 gitignore）
 */
import { cpSync, existsSync, readFileSync, rmSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const PROJECT = 'kdesign-dev'
const ACCOUNT_ID = 'f76ea4b0e4b34446879b25070c3b950b'
const BRANCH = 'main' // 直接上传项目的生产分支

// 1. 前置检查：dist 必须存在（先跑 npm run build）
const dist = join(root, 'dist')
if (!existsSync(dist)) {
  console.error('✘ 未找到 dist/，请先执行 npm run build（或使用 npm run build && npm run deploy）')
  process.exit(1)
}

// 2. 同步 dist → deploy/kcharts（聚合部署目录中的 kcharts 子站）
console.log('▸ 同步 dist → deploy/kcharts ...')
rmSync(join(root, 'deploy/kcharts'), { recursive: true, force: true })
cpSync(dist, join(root, 'deploy/kcharts'), { recursive: true })

// 3. 读取 API Token
let token = process.env.CLOUDFLARE_API_TOKEN || ''
const tokenFile = join(root, '.cloudflare-token')
if (!token && existsSync(tokenFile)) {
  token = readFileSync(tokenFile, 'utf8').trim()
}
if (!token) {
  console.error([
    '✘ 未找到 Cloudflare API Token，请任选其一：',
    '  a) 在项目根目录创建 .cloudflare-token 文件，内容为 Token（推荐，已 gitignore）',
    '  b) 设置环境变量 CLOUDFLARE_API_TOKEN',
    '  Token 创建：Cloudflare 控制台 → 右上角头像 → My Profile → API Tokens → Create Token',
  ].join('\n'))
  process.exit(1)
}

// 4. 上传 Cloudflare Pages
console.log(`▸ 上传 Cloudflare Pages（项目 ${PROJECT}）...`)
const r = spawnSync('npx', [
  '-y', 'wrangler', 'pages', 'deploy', 'deploy',
  `--project-name=${PROJECT}`,
  `--branch=${BRANCH}`,
  '--commit-dirty=true',
], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: { ...process.env, CLOUDFLARE_API_TOKEN: token, CLOUDFLARE_ACCOUNT_ID: ACCOUNT_ID },
  cwd: root,
})
process.exit(r.status ?? 1)
