FROM node:20

WORKDIR /app

RUN apt-get update && \
    apt-get install -y \
    build-essential \
    python3 \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /app/data/guilds

COPY package*.json ./
RUN npm install

COPY . .

ENV DB_PATH=/app/data/local.db
ENV GUILD_DB_PATH=/app/data/guilds
ENV NODE_ENV=production

RUN mkdir -p /app/data && \
    chown -R node:node /app/data && \
    chmod -R 755 /app/data

USER node

EXPOSE 3000

CMD ["npm", "run", "dev"] 