# Theo Admin - Docker Deployment

Унифицированная структура развертывания для проекта Theo Admin.

## Структура

```
.deploy/
├── _shared/           # Общие файлы для всех окружений
│   ├── Dockerfile     # Базовый Dockerfile для development
│   ├── Dockerfile.cicd # Dockerfile для CI/CD builds
│   └── scripts/       # Скрипты развертывания
│       ├── entrypoint.sh      # Entrypoint для dev контейнера
│       ├── deploy-local.sh    # Запуск local окружения
│       ├── deploy-dev.sh      # Запуск dev окружения
│       ├── deploy-prod.sh     # Запуск prod окружения
│       ├── deploy-stage.sh    # Запуск stage окружения
│       └── stop-all.sh        # Остановка всех контейнеров
├── local/             # Локальная разработка с hot reload
├── dev/               # Dev окружение (GitLab Registry)
├── stage/             # Stage окружение (GitLab Registry)
└── prod/              # Production окружение (GitLab Registry)
```

## Окружения

### Local (Port: 10200)
**Для локальной разработки с hot reload**

```bash
# Из корня проекта
./.deploy/_shared/scripts/deploy-local.sh

# Или вручную
cd .deploy/local
docker-compose up --build -d
```

- Container: `theo-admin-local`
- Build: Собирается локально из Dockerfile
- Volumes: Монтируется код для hot reload
- URL: http://localhost:10200

### Dev (Port: 10201)
**Development окружение из GitLab Registry**

```bash
# Из корня проекта
./.deploy/_shared/scripts/deploy-dev.sh

# Или вручную
cd .deploy/dev
docker-compose up -d
```

- Container: `theo-admin-dev`
- Image: `registry.gitlab.com/theo-ai/admin/theo-admin:dev-latest`
- Auto-update: Watchtower enabled
- URL: http://localhost:10201

### Stage (Port: 10203)
**Staging окружение из GitLab Registry**

```bash
# Из корня проекта
./.deploy/_shared/scripts/deploy-stage.sh

# Или вручную
cd .deploy/stage
docker-compose up -d
```

- Container: `theo-admin-stage`
- Image: `registry.gitlab.com/theo-ai/admin/theo-admin:stage-latest`
- Auto-update: Watchtower enabled
- URL: http://localhost:10203

### Production (Port: 10202)
**Production окружение из GitLab Registry**

```bash
# Из корня проекта
./.deploy/_shared/scripts/deploy-prod.sh

# Или вручную
cd .deploy/prod
docker-compose up -d
```

- Container: `theo-admin-prod`
- Image: `registry.gitlab.com/theo-ai/admin/theo-admin:prod-latest`
- Auto-update: Watchtower enabled
- URL: http://localhost:10202

## Остановка контейнеров

```bash
# Остановить все theo-admin контейнеры
./.deploy/_shared/scripts/stop-all.sh

# Или остановить конкретное окружение
cd .deploy/local && docker-compose down
cd .deploy/dev && docker-compose down
cd .deploy/stage && docker-compose down
cd .deploy/prod && docker-compose down
```

## Требования

1. **Docker Network**: Автоматически создается скриптами
   ```bash
   docker network create theo_network
   ```

2. **.env файл**: Для local окружения нужен .env в корне проекта
   ```bash
   cp .env.example .env
   # Отредактируйте .env с вашими credentials
   ```

3. **GitLab Registry**: Для dev/stage/prod окружений нужен доступ к registry
   ```bash
   docker login registry.gitlab.com
   ```

## Полезные команды

```bash
# Просмотр логов
docker logs -f theo-admin-local
docker logs -f theo-admin-dev
docker logs -f theo-admin-prod
docker logs -f theo-admin-stage

# Войти в контейнер
docker exec -it theo-admin-local sh
docker exec -it theo-admin-dev sh

# Перезапуск
cd .deploy/local && docker-compose restart
cd .deploy/dev && docker-compose restart

# Пересборка local окружения
cd .deploy/local && docker-compose up --build --force-recreate -d

# Проверка статуса
docker ps | grep theo-admin
```

## Технический стек

- **Base Image**: node:lts-alpine
- **Package Manager**: npm
- **Framework**: Next.js 15.5.2
- **Runtime Port**: 3000 (внутри контейнера)

## CI/CD

Для CI/CD используется `.deploy/_shared/Dockerfile.cicd`:

```bash
# Build image
docker build -f .deploy/_shared/Dockerfile.cicd \
  -t registry.gitlab.com/theo-ai/admin/theo-admin:dev-latest .

# Push to registry
docker push registry.gitlab.com/theo-ai/admin/theo-admin:dev-latest
```

## Watchtower

Dev/Stage/Prod контейнеры автоматически обновляются через Watchtower:
- Label: `com.centurylinklabs.watchtower.enable=true`
- Проверяет обновления образов в registry
- Автоматически обновляет контейнер при новом образе

## Порты

| Окружение | Container Name      | Port  |
|-----------|---------------------|-------|
| Local     | theo-admin-local    | 10200 |
| Dev       | theo-admin-dev      | 10201 |
| Prod      | theo-admin-prod     | 10202 |
| Stage     | theo-admin-stage    | 10203 |

## Troubleshooting

### Ошибка: network not found
```bash
docker network create theo_network
```

### Ошибка: .env file not found (local)
```bash
cp .env.example .env
# Заполните credentials
```

### Ошибка: unauthorized (dev/stage/prod)
```bash
docker login registry.gitlab.com
```

### Контейнер не стартует
```bash
# Проверьте логи
docker logs theo-admin-local

# Пересоберите
cd .deploy/local && docker-compose up --build --force-recreate -d
```

### Port already in use
```bash
# Найдите процесс
lsof -i :10200

# Или измените порт в docker-compose.yml
```

---

**Автор**: Theo AI Team
**Проект**: Theo Admin - Admin Dashboard for Supabase Application
