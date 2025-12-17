# 🐳 Docker Deployment Guide

Run Magic Mirror in production using Docker containers.

## 🚀 Quick Start

### 1. Prepare Environment

```bash
# Copy and configure environment
cp .env.docker .env.prod

# Edit with your API keys
nano .env.prod
```

Set these required variables:

```env
OPENAI_API_KEY=sk-...your-key...
```

### 2. Build & Run

**Option A: Docker Compose (Recommended)**

```bash
docker-compose up -d
```

Access at: `http://localhost:1234/prod.html`

**Option B: Docker CLI**

```bash
docker build -t magic-mirror:latest .

docker run -d \
  --name magic-mirror \
  --env-file .env.prod \
  -p 1234:1234 \
  magic-mirror:latest
```

### 3. Access

```
http://localhost:1234/prod.html       (Landing page)
http://localhost:1234/talk            (Voice chat)
http://localhost:1234/face            (Avatar viewer)
```

---

## 📋 Configuration

### Environment Variables (`.env.prod`)

```bash
# Required
OPENAI_API_KEY=sk-...                 # OpenAI API key

# Optional
OPENAI_MODEL=gpt-4o-mini              # AI model (default)
OPENAI_VOICE=alloy                    # TTS voice
MAMMOUTH_API_KEY=...                  # Alternative AI provider
PORT=1234                              # Server port
NVIDIA_A2F_ENDPOINT=...               # Avatar animation service
```

### Minimal Setup (Voice Only)

```bash
docker run -d \
  -e OPENAI_API_KEY=sk-... \
  -p 1234:1234 \
  magic-mirror:latest
```

### Full Setup (All Features)

```bash
docker run -d \
  -e OPENAI_API_KEY=sk-... \
  -e NVIDIA_A2F_ENDPOINT=grpc.nvcf.nvidia.com:443 \
  -e OPENAI_VOICE=nova \
  -p 1234:1234 \
  magic-mirror:latest
```

---

## 🛠️ Management

### View Logs

```bash
docker-compose logs -f magic-mirror
# or
docker logs -f magic-mirror
```

### Stop Container

```bash
docker-compose down
# or
docker stop magic-mirror
```

### Restart

```bash
docker-compose restart
# or
docker restart magic-mirror
```

### Check Health

```bash
docker-compose ps
# or
docker ps | grep magic-mirror
```

---

## 📊 Resource Usage

Default limits:

- **CPU**: 2 cores max, 1 core reserved
- **Memory**: 2GB max, 1GB reserved

### Adjust Resources

Edit `docker-compose.yml`:

```yaml
deploy:
  resources:
    limits:
      cpus: "2"
      memory: 2G
```

Or via CLI:

```bash
docker run \
  --cpus="2" \
  --memory="2g" \
  ...
```

---

## 🔒 Security

Container runs with:

- ✅ No root privileges (user: deno-user)
- ✅ All capabilities dropped
- ✅ Read-only filesystem (except /tmp)
- ✅ Resource limits enforced
- ✅ Health checks enabled

### Network Security

```bash
# Restrict to localhost only
docker run \
  -p 127.0.0.1:1234:1234 \
  ...
```

### Secret Management (Production)

```bash
# Use Docker secrets instead of .env
docker secret create magic_mirror_key .env.prod

docker service create \
  --secret magic_mirror_key \
  ...
```

---

## 🚀 Production Deployment

### Docker Hub (Optional)

```bash
# Tag image
docker tag magic-mirror:latest yourname/magic-mirror:latest

# Push to registry
docker push yourname/magic-mirror:latest

# Pull & run anywhere
docker run -d \
  --env-file .env.prod \
  -p 1234:1234 \
  yourname/magic-mirror:latest
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: magic-mirror
spec:
  replicas: 1
  template:
    spec:
      containers:
        - name: magic-mirror
          image: magic-mirror:latest
          ports:
            - containerPort: 1234
          env:
            - name: OPENAI_API_KEY
              valueFrom:
                secretKeyRef:
                  name: magic-mirror-secrets
                  key: openai-api-key
          resources:
            limits:
              memory: "2Gi"
              cpu: "2"
            requests:
              memory: "1Gi"
              cpu: "1"
```

### Docker Swarm

```bash
docker service create \
  --name magic-mirror \
  --publish 1234:1234 \
  --limit-memory 2g \
  --limit-cpus 2 \
  --env-file .env.prod \
  magic-mirror:latest
```

---

## 📈 Monitoring

### View CPU/Memory Usage

```bash
docker stats magic-mirror
```

### Collect Logs

```bash
# Save logs to file
docker logs magic-mirror > mirror.log 2>&1

# Follow in real-time
docker logs -f --tail 100 magic-mirror
```

### Performance Metrics

```bash
docker inspect magic-mirror --format='{{json .State}}'
```

---

## 🔧 Troubleshooting

### Port Already in Use

```bash
# Find process using port 1234
lsof -i :1234

# Kill it
kill -9 <PID>

# Or use different port
docker run -p 3000:1234 ...
```

### Out of Memory

```bash
# Check container memory
docker inspect magic-mirror --format='{{.HostConfig.Memory}}'

# Increase in docker-compose.yml
deploy:
  resources:
    limits:
      memory: 4G
```

### API Key Issues

```bash
# Check environment variables inside container
docker exec magic-mirror env | grep OPENAI

# Verify key is set
docker run -it \
  -e OPENAI_API_KEY=sk-test \
  magic-mirror:latest \
  /bin/sh
```

### Network Issues

```bash
# Test connectivity
docker exec magic-mirror curl https://api.openai.com/v1/models

# Check DNS
docker exec magic-mirror nslookup api.openai.com
```

---

## 📚 Docker Compose Reference

### View services

```bash
docker-compose ps
```

### Execute command in container

```bash
docker-compose exec magic-mirror deno --version
```

### Rebuild image

```bash
docker-compose build --no-cache
```

### Scale services (if applicable)

```bash
docker-compose up -d --scale magic-mirror=3
```

---

## 🌐 Networking

### Access from Other Machines

```bash
# Linux/macOS/Windows machine IP
ifconfig        # macOS
ipconfig        # Windows
ip addr         # Linux

# Access from other machine
http://192.168.x.x:1234/prod.html
```

### Docker Network

```bash
# Create custom network
docker network create magic-mirror-net

# Connect container
docker run --network magic-mirror-net ...
```

---

## 🎯 Common Commands Cheatsheet

```bash
# Build
docker build -t magic-mirror:latest .

# Run
docker run -d -e OPENAI_API_KEY=sk-... -p 1234:1234 magic-mirror:latest

# Compose
docker-compose up -d
docker-compose down
docker-compose logs -f

# Inspect
docker ps
docker logs <container-id>
docker stats <container-id>

# Clean
docker stop <container-id>
docker rm <container-id>
docker rmi magic-mirror:latest
```

---

## 📖 Additional Resources

- Docker Docs: https://docs.docker.com/
- Docker Compose: https://docs.docker.com/compose/
- Deno Docker: https://hub.docker.com/r/denoland/deno
- Kubernetes: https://kubernetes.io/

---

**Ready for production!** 🚀
