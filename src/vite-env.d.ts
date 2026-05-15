/// <reference types="vite/client" />

/**
 * Runtime config injected into the page by /config.js BEFORE the main
 * bundle loads. In production the container's entrypoint regenerates
 * /config.js from env vars at startup. In dev, public/config.js provides
 * defaults checked into git.
 *
 * Reading from window instead of import.meta.env lets the same compiled
 * bundle ship to any environment — values change at container startup
 * via .env on the host, no rebuild required.
 */
interface AppConfig {
  API_URL: string;
}

declare global {
  interface Window {
    __APP_CONFIG__: AppConfig;
  }
}

export {};
