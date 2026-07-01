#!/bin/sh
cd "$(dirname "$0")"
exec npx vercel dev --yes --listen 3000
