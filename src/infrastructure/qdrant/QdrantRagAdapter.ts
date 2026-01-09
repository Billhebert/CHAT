import { QdrantClient } from '@qdrant/js-client-rest';
import { RagPort } from '../../application/ports/RagPort.js';
import { RagQuery, RagResult } from '../../domain/rag/RagQuery.js';
import OpenAI from 'openai';

export class QdrantRagAdapter implements RagPort {
  private client: QdrantClient;
  private openai: OpenAI;

  constructor() {
    const url = process.env.QDRANT_URL || 'http://localhost:6333';
    this.client = new QdrantClient({ url });

    // Inicializa OpenAI para embeddings
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required for RAG functionality');
    }
    this.openai = new OpenAI({ apiKey });
  }

  private getCollectionName(tenantId: string): string {
    return `tenant_${tenantId}`;
  }

  async ensureCollection(tenantId: string): Promise<void> {
    const collectionName = this.getCollectionName(tenantId);

    try {
      await this.client.getCollection(collectionName);
    } catch (error) {
      // Collection não existe, cria
      await this.client.createCollection(collectionName, {
        vectors: {
          size: 1536, // OpenAI embedding dimension (ajustar conforme modelo)
          distance: 'Cosine',
        },
      });

      // Cria índice para filtros
      await this.client.createPayloadIndex(collectionName, {
        field_name: 'accessScope.department',
        field_schema: 'keyword',
      });

      await this.client.createPayloadIndex(collectionName, {
        field_name: 'accessScope.tags',
        field_schema: 'keyword',
      });
    }
  }

  async search(tenantId: string, query: RagQuery): Promise<RagResult[]> {
    const collectionName = this.getCollectionName(tenantId);

    // Gera embedding do query (simplificado - usar modelo real em produção)
    const queryVector = await this.generateEmbedding(query.text);

    // Constrói filtros baseados em ACL
    const filter: any = {
      must: [],
    };

    if (query.filters?.departments && query.filters.departments.length > 0) {
      filter.must.push({
        key: 'accessScope.department',
        match: { any: query.filters.departments },
      });
    }

    if (query.filters?.tags && query.filters.tags.length > 0) {
      filter.must.push({
        key: 'accessScope.tags',
        match: { any: query.filters.tags },
      });
    }

    if (query.filters?.documentVersionIds && query.filters.documentVersionIds.length > 0) {
      filter.must.push({
        key: 'metadata.documentVersionId',
        match: { any: query.filters.documentVersionIds },
      });
    }

    // Busca no Qdrant
    const searchResult = await this.client.search(collectionName, {
      vector: queryVector,
      filter: filter.must.length > 0 ? filter : undefined,
      limit: query.limit || 10,
      score_threshold: query.minScore || 0.7,
      with_payload: true,
    });

    // Converte para RagResult
    return searchResult.map(point => ({
      documentId: point.payload!.metadata.documentId as string,
      documentVersionId: point.payload!.metadata.documentVersionId as string,
      chunkId: point.id as string,
      text: point.payload!.text as string,
      score: point.score,
      metadata: point.payload!.metadata as Record<string, any>,
      accessScope: point.payload!.accessScope as Record<string, any>,
    }));
  }

  async indexDocument(
    tenantId: string,
    documentVersionId: string,
    chunks: {
      chunkId: string;
      text: string;
      metadata: Record<string, any>;
      accessScope: Record<string, any>;
    }[]
  ): Promise<void> {
    const collectionName = this.getCollectionName(tenantId);
    await this.ensureCollection(tenantId);

    // Gera embeddings para todos os chunks
    const points = await Promise.all(
      chunks.map(async (chunk) => ({
        id: chunk.chunkId,
        vector: await this.generateEmbedding(chunk.text),
        payload: {
          text: chunk.text,
          metadata: chunk.metadata,
          accessScope: chunk.accessScope,
        },
      }))
    );

    // Insere em batch
    await this.client.upsert(collectionName, {
      points,
    });
  }

  async removeDocument(tenantId: string, documentVersionId: string): Promise<void> {
    const collectionName = this.getCollectionName(tenantId);

    await this.client.delete(collectionName, {
      filter: {
        must: [
          {
            key: 'metadata.documentVersionId',
            match: { value: documentVersionId },
          },
        ],
      },
    });
  }

  async updateChunkAccessScope(
    tenantId: string,
    documentVersionId: string,
    chunkId: string,
    accessScope: Record<string, any>
  ): Promise<void> {
    const collectionName = this.getCollectionName(tenantId);

    await this.client.setPayload(collectionName, {
      points: [chunkId],
      payload: { accessScope },
    });
  }

  async deleteCollection(tenantId: string): Promise<void> {
    const collectionName = this.getCollectionName(tenantId);
    await this.client.deleteCollection(collectionName);
  }

  /**
   * Gera embedding usando OpenAI API
   * Modelo: text-embedding-3-small (1536 dimensões, custo-efetivo)
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
        encoding_format: 'float',
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
