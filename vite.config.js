import fs from 'fs'
import vue from '@vitejs/plugin-vue'

function svg () {
  return {
    name: 'load-raw-svg',
    transform (code, id) {
      if (/\.svg$/.test(id)) {
        code = JSON.stringify({ content: fs.readFileSync(id).toString() })
        return {
          code: `export default ${code}`,
        }
      }
    },
  }
}

export default {
  base: './',
  optimizeDeps: {
    exclude: ['dayjs'],
  },
  build: {
    target: 'esnext',
    minify: 'esnext',
  },
  plugins: [vue(), svg()],
}
