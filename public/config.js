// Runtime configuration. This file is shipped as-is (not bundled). In the
// production container, /docker-entrypoint.d/10-config.sh overwrites it at
// startup with values from the container's environment. The defaults below
// are what gets used during local `npm run dev` and `vite build && vite preview`.
window.__APP_CONFIG__ = {
  API_URL: 'http://localhost:5050/api/v1',
};
