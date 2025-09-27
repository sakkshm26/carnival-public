import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

export const text_splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 2600,
    chunkOverlap: 325,
});