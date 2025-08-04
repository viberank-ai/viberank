FROM node:20-slim
RUN npm i -g pnpm@9
# Install Fly CLI
RUN curl -L https://fly.io/install.sh | sh
ENV PATH="/root/.fly/bin:$PATH"
WORKDIR /workspace