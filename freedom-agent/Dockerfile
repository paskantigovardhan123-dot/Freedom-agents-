FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./backend/
COPY pyproject.toml .
COPY README.md .

RUN mkdir -p /data /workspace

ENV PYTHONPATH=/app
ENV WORKSPACE_ROOT=/workspace
ENV DATABASE_URL=sqlite:////data/freedom_agent.db

EXPOSE 8000

CMD ["python3", "-m", "backend.app.main"]
