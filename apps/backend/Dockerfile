FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npx tsc prisma/seed.ts --module commonjs --target ES2021 --esModuleInterop --skipLibCheck --outDir prisma-dist
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma-dist ./prisma-dist
COPY --from=builder /app/package*.json ./
EXPOSE 3001
CMD ["node", "dist/main.js"]
