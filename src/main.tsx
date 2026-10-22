import { createApp } from 'vue'
import App from './App'
import { router } from './router'
import './styles/index.scss'

const app = createApp(App)

// 开发诊断：捕获 Vue 内部错误到 window.__kerr，便于自动化排查
app.config.errorHandler = (err) => {
  ;(window as unknown as { __kerr?: string }).__kerr = err instanceof Error ? err.stack : String(err)
  console.error(err)
}

app.use(router).mount('#app')
