FROM node:lts-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
      ca-certificates \
      curl

# Setup entrypoint
COPY .deploy/_shared/scripts/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
