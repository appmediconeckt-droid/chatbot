// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
//   build: {
//     rollupOptions: {
//       output: {
//         manualChunks(id) {
//           if (!id.includes("node_modules")) {
//             return;
//           }

//           const packagePath = id.split("node_modules/")[1];
//           const pathParts = packagePath.split("/");
//           const packageName = pathParts[0].startsWith("@")
//             ? `${pathParts[0]}/${pathParts[1]}`
//             : pathParts[0];

//           if (packageName.startsWith("@stream-io/")) {
//             return "stream-video-sdk";
//           }

//           if (["react", "react-dom", "scheduler"].includes(packageName)) {
//             return "react-core";
//           }

//           if (["react-router", "react-router-dom"].includes(packageName)) {
//             return "react-router";
//           }

//           if (
//             [
//               "socket.io-client",
//               "socket.io-parser",
//               "engine.io-client",
//             ].includes(packageName)
//           ) {
//             return "socket-io-client";
//           }

//           if (packageName === "axios") {
//             return "axios";
//           }

//           if (packageName === "react-icons") {
//             return "react-icons";
//           }

//           return `vendor-${packageName.replace("@", "").replace("/", "-")}`;
//         },
//       },
//     },
//   },
// });



import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { localQrPlugin, validateProductionApiUrl } from './scripts/localQrOrigin.js';

// https://vite.dev/config/
export default defineConfig(({ mode, command }) => {
 const env = loadEnv(mode, process.cwd(), '');
 const apiTarget = (env.VITE_API_BASE_URL || 'https://humaeli-backend-update-production.up.railway.app').replace(/\/+$/, '').replace(/\/api$/, '');
 if (command === 'build' && mode === 'production') {
   if (!env.VITE_API_BASE_URL) throw new Error('Set VITE_API_BASE_URL to the public HTTPS backend URL before building for production');
   validateProductionApiUrl(apiTarget);
 }
 const proxy = { target: apiTarget, changeOrigin: true, cookieDomainRewrite: '' };
 return {
  server: {
    host: '0.0.0.0',
    proxy: { '/api': proxy, '/uploads': proxy, '/socket.io': { ...proxy, ws: true } },
  },
  plugins: [
    react({
      jsxRuntime: 'automatic',
      include: "**/*.{js,jsx,ts,tsx}",
    }),
    localQrPlugin(env.VITE_QR_PUBLIC_ORIGIN),
  ],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    // This tells Vite to try these extensions in order
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return;
          }

          const packagePath = id.split("node_modules/")[1];
          const pathParts = packagePath.split("/");
          const packageName = pathParts[0].startsWith("@")
            ? `${pathParts[0]}/${pathParts[1]}`
            : pathParts[0];

          if (packageName.startsWith("@stream-io/")) {
            return "stream-video-sdk";
          }

          if (["react", "react-dom", "scheduler"].includes(packageName)) {
            return "react-core";
          }

          if (["react-router", "react-router-dom"].includes(packageName)) {
            return "react-router";
          }

          if (
            [
              "socket.io-client",
              "socket.io-parser",
              "engine.io-client",
            ].includes(packageName)
          ) {
            return "socket-io-client";
          }

          if (packageName === "axios") {
            return "axios";
          }

          if (packageName === "react-icons") {
            return "react-icons";
          }

          return `vendor-${packageName.replace("@", "").replace("/", "-")}`;
        },
      },
    },
  },
 };
});
