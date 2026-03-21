FROM python:3.12-slim

WORKDIR /app

# Install system dependencies for Pillow, PostgreSQL, and PDF generation
RUN apt-get update && apt-get install -y \
    libjpeg-dev \
    zlib1g-dev \
    gcc \
    python3-dev \
    libpq-dev \
    libcairo2-dev \
    pkg-config \
    libpango1.0-dev \
    libpangocairo-1.0-0 \
    libgdk-pixbuf-2.0-dev \
    libffi-dev \
    shared-mime-info \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .