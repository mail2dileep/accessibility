FROM node:20-bookworm-slim

ARG GECKODRIVER_VERSION=0.36.0

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        firefox-esr \
        fonts-liberation \
        tar \
    && curl -fsSL "https://github.com/mozilla/geckodriver/releases/download/v${GECKODRIVER_VERSION}/geckodriver-v${GECKODRIVER_VERSION}-linux64.tar.gz" \
        | tar -xz -C /usr/local/bin \
    && chmod +x /usr/local/bin/geckodriver \
    && apt-get purge -y --auto-remove curl tar \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .
RUN mkdir -p Output

ENV NODE_ENV=production

EXPOSE 10000

CMD ["npm", "start"]
