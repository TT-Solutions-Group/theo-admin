#!/bin/bash

# Цвета для вывода
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Theo Admin - Local Deployment${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Проверяем наличие .env файла
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found!${NC}"
    echo -e "Creating from .env.example..."
    cp .env.example .env
    echo -e "${GREEN}✓ .env created. Please update it with your credentials.${NC}"
    echo ""
fi

# Проверяем Docker network
if ! docker network inspect theo_network >/dev/null 2>&1; then
    echo -e "${YELLOW}Creating theo_network...${NC}"
    docker network create theo_network
    echo -e "${GREEN}✓ Network created${NC}"
    echo ""
fi

# Переходим в директорию local
cd .deploy/local

echo -e "${BLUE}Starting local development container...${NC}"
docker-compose up --build -d

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  ✓ Local container started!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "Container: ${BLUE}theo-admin-local${NC}"
    echo -e "Port: ${BLUE}http://localhost:10200${NC}"
    echo ""
    echo -e "Commands:"
    echo -e "  ${YELLOW}docker logs -f theo-admin-local${NC} - View logs"
    echo -e "  ${YELLOW}docker exec -it theo-admin-local sh${NC} - Enter container"
    echo -e "  ${YELLOW}cd .deploy/local && docker-compose down${NC} - Stop container"
else
    echo ""
    echo -e "${RED}✗ Failed to start container${NC}"
    exit 1
fi
