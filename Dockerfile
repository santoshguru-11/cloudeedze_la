# Cloudedze Docker Container
FROM node:20-alpine

# Install system dependencies
RUN apk add --no-cache python3 py3-pip py3-virtualenv postgresql-client curl

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY dist/ ./dist/
COPY oci-env/ ./oci-env/
COPY .env.production ./.env

# Create uploads directory
RUN mkdir -p uploads && chmod 755 uploads

# Setup Python virtual environment for OCI (if directory exists)
RUN if [ -d "oci-env" ]; then \
        cd oci-env && \
        python3 -m venv . && \
        . bin/activate && \
        pip install --no-cache-dir oci; \
    fi

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start application
CMD ["node", "dist/index.js"]