import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const vastUrl = env.VITE_VAST_API_URL
  const ttsUrl = env.VITE_TTS_API_URL

  const proxyConfig = {}
  if (vastUrl) {
    proxyConfig['/sdapi'] = {
      target: vastUrl,
      changeOrigin: true,
      secure: false
    }
  }
  if (ttsUrl) {
    proxyConfig['/ttsapi'] = {
      target: ttsUrl,
      changeOrigin: true,
      secure: false,
      rewrite: (path) => path.replace(/^\/ttsapi/, '')
    }
  }

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: proxyConfig
    }
  }
})
