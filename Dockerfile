# Use official Python image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy project files
COPY . .

# Install dependencies (ignoring Node.js stuff)
RUN pip install --no-cache-dir -r api/requirements.txt

# Start command
# Uses the environment variable PORT provided by Railway
CMD sh -c "uvicorn api.app:app --host 0.0.0.0 --port ${PORT:-8000}"
