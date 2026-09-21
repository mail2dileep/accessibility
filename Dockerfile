FROM node:20-bookworm

RUN apt-get update \
    && apt-get install -y chromium chromium-driver \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
COPY vendor ./vendor
RUN npm ci --omit=dev

COPY . .
RUN mkdir -p Output

ENV NODE_ENV=production

EXPOSE 10000

CMD ["npm", "start"]
