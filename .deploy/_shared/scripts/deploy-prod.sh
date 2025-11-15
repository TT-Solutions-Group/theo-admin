#!/bin/bash

# Цвета для вывода
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Theo Admin - Production Deployment${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Проверяем Docker network
if ! docker network inspect theo_network >/dev/null 2>&1; then
    echo -e "${YELLOW}Creating theo_network...${NC}"
    docker network create theo_network
    echo -e "${GREEN}✓ Network created${NC}"
    echo ""
fi

# Переходим в директорию prod
cd .deploy/prod

echo -e "${BLUE}Starting production container from GitLab registry...${NC}"
docker-compose up -d

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  ✓ Production container started!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "Container: ${BLUE}theo-admin-prod${NC}"
    echo -e "Port: ${BLUE}http://localhost:10202${NC}"
    echo -e "Image: ${BLUE}registry.gitlab.com/theo-ai/admin/theo-admin:prod-latest${NC}"
    echo ""
    echo -e "Commands:"
    echo -e "  ${YELLOW}docker logs -f theo-admin-prod${NC} - View logs"
    echo -e "  ${YELLOW}cd .deploy/prod && docker-compose down${NC} - Stop container"
else
    echo ""
    echo -e "${RED}✗ Failed to start container${NC}"
    exit 1
fi
