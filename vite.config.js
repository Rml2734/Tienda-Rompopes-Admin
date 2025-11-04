import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    // 🎯 Clave de la solución: Especificar todos los archivos HTML de entrada
    rollupOptions: {
      input: {
        main: 'index.html', // Archivo de login
        admin: 'admin.html' // Archivo del panel de administración
      },
      // Asegurar que el destino esté limpio antes de construir
      emptyOutDir: true,
    }
  }
});