import { createApp } from 'vue'
import App from './App.vue'
import { initI18n } from '../i18n/index.js'
import '../styles/main.css'

async function bootstrap() {
  await initI18n()
  const app = createApp(App)
  app.mount('#app')
}

bootstrap()
