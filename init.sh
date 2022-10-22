#!/bin/bash -e
# This file is included in the Docker image
exit_func() {
        echo "SIGTERM detected"
        exit 1
}
trap exit_func SIGTERM SIGINT

echo "Initializing Iconify API.js..."
cd /data/iconify-api
# Only copy files which don't exist in target
cp -rn /data/config_default/. /data/iconify-api/src/config/
npm run build
node --expose-gc lib/index.js
