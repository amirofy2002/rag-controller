import { ChromaClient, IEmbeddingFunction } from "chromadb";
import axios from "axios";

const llamaModel = "llama2:latest";
const collectionName = "collection";
const client = new ChromaClient({});
const embeddingModel = "nomic-embed-text:v1.5";

const embedder: IEmbeddingFunction = {
  async generate(text: string[]) {
    const data = await axios.post("http://localhost:11434/api/embeddings", {
      model: embeddingModel,
      prompt: text[0],
    });
    const response = data.data["embedding"];
    return [response];
  },
};

async function queryData(
  client: ChromaClient,
  collectionName: string,
  search: string,
  resultCount = 3
) {
  const collection = await client.getCollection({
    name: collectionName,
    embeddingFunction: embedder,
  });
  console.log(`generate embedding.... for ${search}`);
  const queryVetex = await embedder.generate([search]);
  const query = await collection.query({
    queryEmbeddings: queryVetex,
    nResults: resultCount,
  });
  console.log(`query data have been populated for ${search}`);
  console.log({ doc: query.documents });
  return query;
}

async function askAI(
  client: ChromaClient,
  collectionName: string,
  question: string
) {
  console.log(`thinking about....${question}`);
  const data = await queryData(client, collectionName, question, 10);
  const context = data.documents[0];

  const contextText = context.join("\n----\n").replace(/\"/g, "").toString();
  const promptTemplate = `Answer the question based only on the following context:
  
  ${contextText}
  
  ---
  
  Answer the question based on the above context: ${question}
  NOTE: in case u couldnt answer the question u have to answer: 'I DONT KNOW'.
  `;

  console.log({ promptTemplate: promptTemplate.toString() });
  console.log(
    `asking from llama for \"${question}\" to generate the response.`
  );
  const response = await axios.post("http://localhost:11434/api/generate", {
    model: llamaModel,
    prompt: promptTemplate,
    stream: false,
    context: [],
  });
  console.log({ response: response.data["response"] });
}
askAI(client, collectionName, "who came from USA?");
