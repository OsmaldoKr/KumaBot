FROM node:20-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ffmpeg \
        imagemagick \
        webp \
        dumb-init \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN if [ -f package-lock.json ]; then \
      npm ci --omit=dev; \
    else \
      npm install --omit=dev; \
    fi

COPY --chown=node:node . .

RUN mkdir -p KumaSession tmp db \
    && chown -R node:node /app

USER node

EXPOSE 3000

VOLUME ["/app/KumaSession", "/app/database.json"]

ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "--no-warnings", "index.js", "--server"]
