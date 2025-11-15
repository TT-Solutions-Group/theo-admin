#!/bin/sh
set -e

# Install dependencies
npm install

# Copy .env.example to .env if .env doesn't exist
if [ ! -f .env ]; then
    cp .env.example .env
fi

# Run dev server
npm run dev
