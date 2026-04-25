import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
    resolve: {
        alias: {
            "@": path.resolve(".")
        }
    },
    test: {
        environment: "jsdom",
        include: ["tests/**/*.test.ts"]
    }
});
