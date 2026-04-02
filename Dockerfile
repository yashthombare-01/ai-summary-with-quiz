# Use a lightweight python image
FROM python:3.10-slim

# Install ffmpeg because it's required for faster-whisper and yt-dlp audio extraction!
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements and install them securely
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire app into the environment
COPY . .

# Hugging Face Spaces automatically listens on port 7860 by default
ENV PORT=7860
EXPOSE 7860

# Use Gunicorn as a production runner pointing at the backend folder
CMD ["gunicorn", "backend.App:app", "--bind", "0.0.0.0:7860", "--timeout", "1200"]
