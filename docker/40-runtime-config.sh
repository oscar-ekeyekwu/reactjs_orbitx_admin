#!/bin/sh
# Runtime config injection. nginx:alpine runs all /docker-entrypoint.d/*.sh
# scripts before starting nginx itself, so this writes /config.js (which
# index.html loads before the main bundle) using env vars from the host.
#
# Set API_URL in the container's environment (e.g. via env_file in
# docker-compose.yml) and restart the container — no rebuild required.

set -e

: "${API_URL:=http://localhost:5050/api/v1}"

cat > /usr/share/nginx/html/config.js <<EOF
window.__APP_CONFIG__ = {
  API_URL: "${API_URL}",
};
EOF

echo "runtime-config: API_URL=${API_URL}"
