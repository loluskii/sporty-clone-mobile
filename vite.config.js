import { fileURLToPath, URL } from 'node:url'
// import mkcert from 'vite-plugin-mkcert'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

// https://vitejs.dev/config/
export default ({ mode }) => {
  process.env = { ...loadEnv(mode, process.cwd()), ...process.env }
  return defineConfig({
    plugins: [vue(), vueJsx()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined

            if (/node_modules\/(?:mqtt|@mqttjs|readable-stream|buffer|process|ws)\//.test(id)) {
              return 'realtime'
            }

            if (/node_modules\/(?:date-fns|moment)\//.test(id)) {
              return 'date-tools'
            }

            if (/node_modules\/(?:lodash|jquery|crypto-js|js-cookie|mitt)\//.test(id)) {
              return 'utilities'
            }

            return undefined
          }
        }
      }
    },
    server: {
      proxy: {
        '/bet': {
          target: 'https://bet-prod.sportsbookengine.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/bet/, '/v1')
        },
        '/casino-client/providers': {
          target: 'https://clientapi.sportsbookengine.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/casino-client/, '')
        },
        '/casino-client': {
          target: 'https://clientapi.sportsbookengine.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/casino-client/, '/client')
        }
      }
    }
  })
}
