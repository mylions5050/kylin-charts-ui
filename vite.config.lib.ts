import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import dts from 'vite-plugin-dts'
import { fileURLToPath, URL } from 'node:url'

/**
 * 库模式构建（npm 发布用）：`npm run lib`
 * - vue 外置为 peerDependency，产物为 ES Module + CJS
 * - vite-plugin-dts 生成 .d.ts 类型声明
 * - 样式由 `sass src/styles/chart.scss dist-lib/style.css` 单独产出（见 package.json scripts.lib）
 */
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    dts({
      entryRoot: 'src',
      include: ['src/index.ts', 'src/components', 'src/core', 'src/utils', 'src/composables'],
      outDir: 'dist-lib',
      insertTypesEntry: true,
      copyDtsFiles: false,
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist-lib',
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      name: 'KCharts',
      formats: ['es', 'cjs'],
      fileName: (format) => `kcharts.${format}.js`,
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: { vue: 'Vue' },
        exports: 'named', // 默认插件导出 + 具名组件导出并存（CJS 用户取 .default）
      },
    },
    sourcemap: false,
    minify: 'esbuild',
  },
})
