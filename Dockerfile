# Plan 1, tâche 16 : image de production pour un futur hébergement sur un serveur dédié.
# Repose sur `output: "standalone"` (next.config.ts) : l'étape finale ne contient que les fichiers tracés par Next.

FROM node:22-slim AS build
WORKDIR /app
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0 NEXT_TELEMETRY_DISABLED=1
# pnpm à la version de `packageManager` (package.json).
RUN corepack enable
# pnpm-workspace.yaml porte `allowBuilds` : sans lui, pnpm refuse les scripts d'esbuild et de better-sqlite3.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:22-slim AS run
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 3000
CMD ["node", "server.js"]
