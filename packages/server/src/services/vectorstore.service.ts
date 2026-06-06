import { env } from "../config/env.js";
import { loadKnowledgeDb } from "./component-knowledge/db.js";
import type { Chunk, ToolCard } from "./component-knowledge/types.js";

type VectorStoreDocument = {
  pageContent: string;
  metadata: {
    kind: "card" | "chunk";
    id: string;
  };
};

type KnowledgeRetriever = {
  invoke(query: string): Promise<VectorStoreDocument[]>;
};

type VectorKnowledgeResult = {
  cards: ToolCard[];
  chunks: Chunk[];
};

let cachedRetrieverPromise: Promise<KnowledgeRetriever | null> | null = null;

function normalizeLines(parts: Array<string | undefined>): string {
  return parts
    .map((part) => (part ?? "").trim())
    .filter(Boolean)
    .join("\n");
}

function buildCardDocument(card: ToolCard): VectorStoreDocument {
  return {
    pageContent: normalizeLines([
      `component: ${card.id}`,
      card.title ? `title: ${card.title}` : undefined,
      card.name ? `name: ${card.name}` : undefined,
      card.aliases?.length ? `aliases: ${card.aliases.join("、")}` : undefined,
      card.summary ? `summary: ${card.summary}` : undefined,
      card.whenToUse ? `whenToUse: ${card.whenToUse}` : undefined,
      card.importHint ? `importHint: ${card.importHint}` : undefined
    ]),
    metadata: {
      kind: "card",
      id: card.id
    }
  };
}

function buildChunkDocument(chunk: Chunk): VectorStoreDocument {
  return {
    pageContent: normalizeLines([
      chunk.component ? `component: ${chunk.component}` : undefined,
      chunk.type ? `type: ${chunk.type}` : undefined,
      chunk.title ? `title: ${chunk.title}` : undefined,
      chunk.text
    ]),
    metadata: {
      kind: "chunk",
      id: chunk.id
    }
  };
}

async function createMemoryRetriever(documents: VectorStoreDocument[]): Promise<KnowledgeRetriever> {
  try {
    const [{ OpenAIEmbeddings }, memoryModule] = await Promise.all([
      import("@langchain/openai"),
      import("langchain/vectorstores/memory")
    ]);

    const { MemoryVectorStore } = memoryModule as {
      MemoryVectorStore: {
        fromDocuments(
          docs: VectorStoreDocument[],
          embeddings: unknown
        ): Promise<{ asRetriever(input: number): KnowledgeRetriever }>;
      };
    };

    const embeddings = new OpenAIEmbeddings({
      apiKey: env.apiKey,
      model: env.openAiEmbeddingModel,
      configuration: {
        baseURL: env.openAiBaseUrl
      }
    });

    const store = await MemoryVectorStore.fromDocuments(documents, embeddings);
    return store.asRetriever(env.componentVectorTopK);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      "向量召回初始化失败。请确认已安装 @langchain/openai 与 langchain，且 embeddings 上游可用。"
      + ` 原始错误: ${message}`
    );
  }
}

async function getKnowledgeRetriever(): Promise<KnowledgeRetriever | null> {
  if (!env.componentVectorRecallEnabled) return null;
  if (cachedRetrieverPromise) return cachedRetrieverPromise;

  cachedRetrieverPromise = (async () => {
    const db = loadKnowledgeDb();
    if (!db) return null;

    const documents = [
      ...db.toolCards.map(buildCardDocument),
      ...db.chunks.map(buildChunkDocument)
    ];

    if (documents.length === 0) return null;
    return createMemoryRetriever(documents);
  })();

  return cachedRetrieverPromise;
}

export async function retrieveVectorKnowledgeForQuery(query: string): Promise<VectorKnowledgeResult> {
  const retriever = await getKnowledgeRetriever();
  const db = loadKnowledgeDb();
  if (!retriever || !db) return { cards: [], chunks: [] };

  const docs = await retriever.invoke(query);
  const cardById = new Map(db.toolCards.map((card) => [card.id, card]));
  const chunkById = new Map(db.chunks.map((chunk) => [chunk.id, chunk]));

  const cards: ToolCard[] = [];
  const chunks: Chunk[] = [];

  for (const doc of docs) {
    if (doc.metadata.kind === "card") {
      const card = cardById.get(doc.metadata.id);
      if (card && !cards.some((item) => item.id === card.id)) cards.push(card);
      continue;
    }

    const chunk = chunkById.get(doc.metadata.id);
    if (chunk && !chunks.some((item) => item.id === chunk.id)) chunks.push(chunk);
  }

  return { cards, chunks };
}
