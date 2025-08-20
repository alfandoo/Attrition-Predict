FROM python:3.10-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Dependensi sistem ringan agar numpy/pandas/scikit-learn mulus
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential gfortran \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/requirements.txt
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy seluruh project
COPY . /app

# Jalankan via gunicorn, listen ke $PORT (disediakan oleh Spaces)
CMD bash -lc 'gunicorn -w 2 -k gthread --threads 8 -t 120 -b 0.0.0.0:${PORT:-7860} app:app'
