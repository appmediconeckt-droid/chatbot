import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
});
