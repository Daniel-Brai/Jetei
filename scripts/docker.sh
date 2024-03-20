#!/bin/bash

if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker before running this script."
    exit 1
fi

cd "$(dirname "$0")/.."
    
echo "Starting Jetei...."

docker-compose up -d