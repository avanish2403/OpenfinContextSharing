import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import viteTsconfigPaths from 'vite-tsconfig-paths';
import { TransformOption, viteStaticCopy } from "vite-plugin-static-copy"

const copyPlugin = (env: any) => {

  const reactBaseURLtransform: TransformOption = (contents, path) => {
    return contents.replace(/<REACT_APP_BASE_URL>/g, env.VITE_REACT_APP_BASE_URL);
  }

  return viteStaticCopy({
    flatten: true,
    targets: [
      {
        src: "public/*.json",
        dest: "",
        transform: reactBaseURLtransform,
      },
      {
        src: "public/platform/*.html",
        dest: "",
        transform: reactBaseURLtransform,
      }
    ]
  })

}

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const plugins: any[] = [react(), viteTsconfigPaths()]
  //plugins.push(copyPlugin(env));

  return {
    plugins: [...plugins],
    build: {
      outDir: 'build',
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              return id.toString().split('node_modules/')[1].split('/')[0].toString();
            }
          },
        },
      },
      chunkSizeWarningLimit: 5000,
    },
    server: {
      open: false,
      port: 8082,
    },

  }
})