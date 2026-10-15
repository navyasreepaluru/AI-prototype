FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend codebase
COPY backend/ ./backend/

# Train ML models and seed initial database
ENV PYTHONPATH=/app
RUN python backend/ml/train_models.py
RUN python backend/seed_data.py

# Expose server port
EXPOSE 5000

ENV PORT=5000
ENV HOST=0.0.0.0
ENV FLASK_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Start production server
CMD ["python", "backend/wsgi.py"]
