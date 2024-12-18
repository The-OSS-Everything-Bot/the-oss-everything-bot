FROM node AS base
RUN apt-get update && \
  apt-get install -y \
  build-essential \
  curl \
  jq \
  libjemalloc2 \
  python3 \
  tar \
  pnpm \
  yarn \
  npm \
  git
