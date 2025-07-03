#!/bin/bash

# 🔧 Setup Script: Shared Docker Network for Rexel Modern
# This script creates the shared Docker network used by both frontend and backend

set -e

NETWORK_NAME="rexel-net"

echo "🚀 Setting up shared Docker network for Rexel Modern..."
echo "Network name: $NETWORK_NAME"

# Function to check if Docker is accessible
check_docker_access() {
    if docker ps &> /dev/null; then
        return 0
    else
        return 1
    fi
}

# Determine if we need sudo
USE_SUDO=""
if ! check_docker_access; then
    echo "⚠️  Docker requires sudo privileges"
    USE_SUDO="sudo "
    
    # Test sudo access
    if ! ${USE_SUDO}docker ps &> /dev/null; then
        echo "❌ Cannot access Docker even with sudo"
        echo "Please ensure Docker is installed and running"
        exit 1
    fi
else
    echo "✅ Docker is accessible without sudo"
fi

# Check if network already exists
if ${USE_SUDO}docker network ls | grep -q "$NETWORK_NAME"; then
    echo "✅ Network '$NETWORK_NAME' already exists"
    
    # Show network details
    echo "📋 Network details:"
    ${USE_SUDO}docker network inspect "$NETWORK_NAME" --format 'Name: {{.Name}}' || true
    ${USE_SUDO}docker network inspect "$NETWORK_NAME" --format 'Driver: {{.Driver}}' || true
    ${USE_SUDO}docker network inspect "$NETWORK_NAME" --format 'Scope: {{.Scope}}' || true
    
    # List connected containers
    echo "🔗 Connected containers:"
    CONTAINERS=$(${USE_SUDO}docker network inspect "$NETWORK_NAME" --format '{{range $k, $v := .Containers}}{{$v.Name}} {{end}}' 2>/dev/null || echo "none")
    if [ "$CONTAINERS" = "none" ] || [ -z "$CONTAINERS" ]; then
        echo "  No containers connected yet"
    else
        echo "  $CONTAINERS"
    fi
    
else
    echo "🔧 Creating network '$NETWORK_NAME'..."
    
    if ${USE_SUDO}docker network create "$NETWORK_NAME" --driver bridge; then
        echo "✅ Network '$NETWORK_NAME' created successfully!"
        
        # Verify creation
        if ${USE_SUDO}docker network ls | grep -q "$NETWORK_NAME"; then
            echo "✅ Network verification passed"
        else
            echo "❌ Network creation verification failed"
            exit 1
        fi
    else
        echo "❌ Failed to create network '$NETWORK_NAME'"
        exit 1
    fi
fi

echo ""
echo "🎯 Network setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Deploy backend: cd ~/rexel-modern/backend && docker-compose -f docker-compose.prod.yml up -d"
echo "2. Deploy frontend: cd ~/rexel-modern/frontend && docker-compose -f docker-compose.prod.yml up -d"
echo ""
echo "🔍 Useful commands:"
echo "  Check network: ${USE_SUDO}docker network inspect $NETWORK_NAME"
echo "  List containers: ${USE_SUDO}docker network inspect $NETWORK_NAME --format '{{json .Containers}}'"
echo "  Remove network: ${USE_SUDO}docker network rm $NETWORK_NAME"
echo "" 