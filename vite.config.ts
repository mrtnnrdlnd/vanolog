import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { viteSingleFile } from "vite-plugin-singlefile"

export default defineConfig({
  plugins: [
    svelte(), 
    viteSingleFile() // Detta plugin ser till att allt blir EN fil
  ],
  build: {
    target: 'esnext',
    assetsInlineLimit: 100000000, // Tvinga inlining av även större tillgångar
    chunkSizeWarningLimit: 100000000,
    cssCodeSplit: false,
    outDir: 'dist', // Här hamnar din färdiga fil
  },
})