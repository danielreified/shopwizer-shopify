FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY apps/service-category-embeddings/python/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code (includes model/ directory)
COPY apps/service-category-embeddings/python/ .

# Expose port
EXPOSE 8003

# Default command
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8003"]
