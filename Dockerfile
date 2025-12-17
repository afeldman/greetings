# Magic Mirror - Production Docker Image
# Lightweight Deno-based avatar animation platform

# Stage 1: Builder
FROM denoland/deno:latest as builder

WORKDIR /app

# Copy project files
COPY deno.json deno.lock ./
COPY src/ ./src/
COPY public/ ./public/
COPY characters/ ./characters/
COPY nvidia/ ./nvidia/

# Pre-cache dependencies
RUN deno cache --reload src/server.ts

# Stage 2: Runtime (Minimal)
FROM denoland/deno:latest

WORKDIR /app

# Copy only necessary files from builder
COPY --from=builder /app/deno.json /app/deno.lock ./
COPY --from=builder /app/src/ ./src/
COPY --from=builder /app/public/ ./public/
COPY --from=builder /app/characters/ ./characters/
COPY --from=builder /app/nvidia/ ./nvidia/

# Copy environment template
COPY .env.example ./

# Create runtime user (security)
RUN useradd -m -u 1000 deno-user && \
    chown -R deno-user:deno-user /app

USER deno-user

# Expose port
EXPOSE 1234

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD deno run --allow-net --allow-read https://deno.land/std@0.208.0/http/file_server.ts &> /dev/null || exit 1

# Start server
CMD ["deno", "run", \
     "--allow-net", \
     "--allow-read", \
     "--allow-env", \
     "src/server.ts"]
