FROM node:20-slim

# Install pnpm globally
RUN npm i -g pnpm@9

# Create node user home directory if it doesn't exist
RUN mkdir -p /home/node

# Install Fly CLI for all users
RUN curl -L https://fly.io/install.sh | sh
RUN mv /root/.fly /usr/local/fly && \
    chmod -R 755 /usr/local/fly && \
    ln -s /usr/local/fly/bin/fly /usr/local/bin/fly

# Set up workspace directory with proper permissions
WORKDIR /workspace
RUN chown -R node:node /workspace

# Switch to node user
USER node