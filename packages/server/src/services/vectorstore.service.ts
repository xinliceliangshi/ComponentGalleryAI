import { env } from "../config/env.js";

export type VectorDocument = {
  pageContent: string;
  metadata?: Record<string, unknown>;
};

type EmbeddingsInstance = unknown;
type ChromaClass = {
  fromDocuments(
    documents: VectorDocument[],
    embeddings: EmbeddingsInstance,
    options?: Record<string, unknown>
  ): Promise<{
    asRetriever(): unknown;
  }>;
};

async function loadLangChainVectorDeps() {
  try {
    const [{ OpenAIEmbeddings }, chromaModule, { RecursiveCharacterTextSplitter }] =
      await Promise.all([
        import("@langchain/openai"),
        import("@langchain/community/vectorstores/chroma"),
        import("langchain/text_splitter")
      ]);

    const Chroma = (chromaModule as { Chroma: ChromaClass }).Chroma;
    return { OpenAIEmbeddings, Chroma, RecursiveCharacterTextSplitter };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      "VectorStore 依赖加载失败。请先安装 @langchain/openai、@langchain/community、langchain。"
      + ` 原始错误: ${message}`
    );
  }
}

export async function buildChromaRetrieverFromTexts(
  texts: string[],
  options?: {
    chunkSize?: number;
    chunkOverlap?: number;
    apiKey?: string;
    baseUrl?: string;
    collectionName?: string;
  }
) {
  const { OpenAIEmbeddings, Chroma, RecursiveCharacterTextSplitter } =
    await loadLangChainVectorDeps();

  const docs: VectorDocument[] = texts
    .map((text, index) => text.trim() ? { pageContent: text, metadata: { index } } : null)
    .filter((item): item is VectorDocument => Boolean(item));

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: options?.chunkSize ?? 500,
    chunkOverlap: options?.chunkOverlap ?? 80
  });
  const splitDocs = await splitter.createDocuments(docs.map((doc) => doc.pageContent));

  const embeddings = new OpenAIEmbeddings({
    apiKey: options?.apiKey ?? env.apiKey,
    configuration: (options?.baseUrl ?? env.openAiBaseUrl)
      ? { baseURL: options?.baseUrl ?? env.openAiBaseUrl }
      : undefined
  });

  const vectorstore = await Chroma.fromDocuments(splitDocs, embeddings, {
    collectionName: options?.collectionName ?? "component-gallery-ai"
  });

  return vectorstore.asRetriever();
}
