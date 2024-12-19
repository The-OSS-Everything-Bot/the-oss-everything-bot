# Base image for the bot/app

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

# Install packages for stripe functionality
RUN curl -s https://packages.stripe.dev/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | tee /usr/share/keyrings/stripe.gpg && \
  echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.dev/stripe-cli-debian-local stable main" | tee -a /etc/apt/sources.list.d/stripe.list && \
  apt update && \
  apt install -y \
  git \
  stripe \
  zsh \
  procps \
  default-mysql-client && \
  npx -y playwright@1.46.1 install --with-deps

