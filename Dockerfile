# syntax=docker/dockerfile:1

# ─── Base ───────────────────────────────────────────────
# Debian slim plutôt qu'Alpine : Tailwind v4 (lightningcss) et le SWC de
# Next 16 s'appuient sur des binaires natifs mieux supportés en glibc.
FROM node:22-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ─── Dépendances ────────────────────────────────────────
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ─── Développement ──────────────────────────────────────
FROM base AS dev
ENV NODE_ENV=development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0"]

# ─── Build de production ────────────────────────────────
FROM base AS builder
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# ─── Les variables publiques doivent exister ICI, pas au démarrage ──────────
# Next remplace les `process.env.NEXT_PUBLIC_*` par leur valeur pendant le
# build : ce qui n'est pas connu à cet instant ne le sera jamais, et un
# `environment:` posé dans le compose arrive trop tard pour le code envoyé au
# navigateur.
#
# Rien ne le signalait, parce que `.env.local` est exclu par le .dockerignore
# — donc absent de l'image — et que les valeurs concernées ont toutes un défaut
# silencieux. `VAPID_KEY` retombe sur la chaîne vide : le push web ne s'inscrit
# pas, sans lever d'erreur. `PUSHER_KEY` retombe sur une clé codée en dur qui
# n'est plus la bonne. Une image de production se construisait ainsi sans
# notification push et avec un temps réel branché ailleurs, en silence.
#
# Les valeurs par défaut vides gardent le build fonctionnel sans argument :
# `docker build` seul continue de marcher, il produit simplement une image
# sans push web.
ARG NEXT_PUBLIC_BACKEND_URL=""
ARG NEXT_PUBLIC_API_URL=""
ARG NEXT_PUBLIC_FIREBASE_VAPID_KEY=""
ARG NEXT_PUBLIC_PUSHER_KEY=""
ARG NEXT_PUBLIC_PUSHER_CLUSTER="eu"
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL \
    NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_FIREBASE_VAPID_KEY=$NEXT_PUBLIC_FIREBASE_VAPID_KEY \
    NEXT_PUBLIC_PUSHER_KEY=$NEXT_PUBLIC_PUSHER_KEY \
    NEXT_PUBLIC_PUSHER_CLUSTER=$NEXT_PUBLIC_PUSHER_CLUSTER

RUN npm run build

# ─── Runtime de production ──────────────────────────────
FROM base AS production
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1
CMD ["npm", "run", "start"]
