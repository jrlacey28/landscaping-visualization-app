#!/bin/bash
# Fix deployment by copying build files to correct location
echo "Fixing deployment file paths..."
npm run build
cp -r dist/public server/
echo "Files copied successfully!"
echo "Starting production server..."
NODE_ENV=production node dist/index.js