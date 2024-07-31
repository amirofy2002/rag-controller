import { ChromaClient, IEmbeddingFunction } from "chromadb";
import axios from "axios";
import { Faker, en } from "@faker-js/faker";

const embeddingModel = "nomic-embed-text:v1.5";
const client = new ChromaClient({});
const collectionName = "collection";

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

async function addData(
  client: ChromaClient,
  collectionName: string,
  start = 40,
  length = 100
) {
  const collection = await client.getOrCreateCollection({
    name: collectionName,
    embeddingFunction: embedder,
  });

  for (let i = start; i < start + length; i++) {
    const faker = new Faker({ locale: [en] });
    const fakeName = faker.company.name();
    const doc = `fullname:${faker.person.fullName()}, department:${faker.commerce.department()}, company:${faker.company.name()}, job:${faker.person.jobTitle()}, address:${faker.location.streetAddress(
      { useFullAddress: true }
    )}, country:${faker.location.country()}, salary:${faker.finance.amount({
      min: 500,
      max: 6000,
    })}, sex:${faker.person.sex()}, loan:${faker.commerce.price({
      min: 1000000,
      max: 9900000,
    })}`;
    console.log(`adding ${fakeName}`);
    await collection.add({
      ids: ["comp-" + i.toString()],
      documents: [doc],
      metadatas: {
        id: i,
      },
    });
  }
  console.log("done.");
}

addData(client, collectionName, 0, 100);
