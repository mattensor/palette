import { defineConfig, mergeConfig } from "vitest/config"
import viteConfig from "./vite.config"

export default mergeConfig(
	viteConfig,
	defineConfig({
		test: {
			include: [
				"src/**/*.test.{ts,tsx,js,jsx}",
				"src/**/*.spec.{ts,tsx,js,jsx}",
			],
		},
	}),
)
