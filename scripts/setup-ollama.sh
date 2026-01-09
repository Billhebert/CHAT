#!/bin/bash

# Script para configurar Ollama e baixar modelo de embeddings
# Uso: ./scripts/setup-ollama.sh [modelo]

set -e

EMBEDDING_MODEL="${1:-nomic-embed-text}"
OLLAMA_CONTAINER="chat-ollama"

echo "🚀 Setting up Ollama for RAG embeddings..."
echo "Model: $EMBEDDING_MODEL"
echo ""

# Verifica se o container está rodando
if ! docker ps | grep -q "$OLLAMA_CONTAINER"; then
    echo "❌ Error: Ollama container '$OLLAMA_CONTAINER' is not running"
    echo "   Start it with: docker-compose up -d ollama"
    exit 1
fi

echo "✅ Ollama container is running"
echo ""

# Aguarda Ollama estar pronto
echo "⏳ Waiting for Ollama to be ready..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if docker exec "$OLLAMA_CONTAINER" curl -s http://localhost:11434/ > /dev/null 2>&1; then
        echo "✅ Ollama is ready"
        break
    fi
    attempt=$((attempt + 1))
    sleep 2
    echo -n "."
done

if [ $attempt -eq $max_attempts ]; then
    echo ""
    echo "❌ Error: Ollama failed to start after $max_attempts attempts"
    exit 1
fi

echo ""
echo "📦 Pulling embedding model: $EMBEDDING_MODEL"
echo "   This may take a few minutes (model size: ~274MB)..."
echo ""

docker exec "$OLLAMA_CONTAINER" ollama pull "$EMBEDDING_MODEL"

echo ""
echo "✅ Model downloaded successfully!"
echo ""
echo "📋 Available models:"
docker exec "$OLLAMA_CONTAINER" ollama list

echo ""
echo "🎉 Setup complete! Your RAG system is ready to use."
echo ""
echo "Next steps:"
echo "  1. Start all services: docker-compose up -d"
echo "  2. Access frontend: http://localhost"
echo "  3. Upload documents and search in the RAG page"
echo ""

# Informações sobre modelos disponíveis
echo "ℹ️  Available embedding models:"
echo "   - nomic-embed-text (768 dim) - Recommended, balanced performance"
echo "   - mxbai-embed-large (1024 dim) - Better quality, larger size"
echo "   - all-minilm (384 dim) - Fastest, smaller size"
echo ""
echo "   To use a different model, set OLLAMA_EMBEDDING_MODEL in .env"
echo ""
