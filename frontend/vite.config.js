import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
                            // THIS LINE IS CRITICAL:
                            // It tells the app to look for files relative to where the AppImage is.
                            base: './',
})
