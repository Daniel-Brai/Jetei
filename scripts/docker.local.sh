#!/bin/bash

check_docker_installed() {
    if ! command -v docker &> /dev/null; then
        echo "Docker is not installed. Please install Docker before running this script."
        exit 1
    fi
}

start_jetei_application() {
    echo "Starting Jetei....."
    docker-compose -f docker-compose.local.yml up -d
}

main() {
    check_docker_installed
    start_jetei_application
}

main