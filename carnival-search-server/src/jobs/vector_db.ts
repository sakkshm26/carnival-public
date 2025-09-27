import { Job } from "bullmq";
import { createEmbeddings } from "../utils";
import { DB } from "../db";
import { document_chunk_table } from "../db/schema";
import { eq } from "drizzle-orm";
import { MilvusClient } from "@zilliz/milvus2-sdk-node";
import { config } from "../providers/config";

const client = new MilvusClient({
    address: config.milvus_uri,
    token: config.milvus_token
})

export const addVectorEntityWorkerHandler = async (job: Job) => {
    const { org_id, connector_id, document_id, title, chunk_content, chunk_index } = job.data;

    const title_embeddings = await createEmbeddings(title);
    const content_embeddings = await createEmbeddings(chunk_content);

    const result = await client.insert({
        collection_name: "app_documents",
        data: [
            {
                content_dense_vector: content_embeddings,
                title_dense_vector: title_embeddings,
                org_id: org_id,
                document_id: document_id,
                connector_id: connector_id,
                chunk_index
            }
        ]
    })

    if (result.err_index.length) {
        throw new Error(JSON.stringify(result))
    }
}

export const deleteVectorEntityWorkerHandler = async (job: Job) => {
    const { org_id, connector_id, document_id } = job.data;

    if (document_id) {
        client.delete({
            collection_name: "app_documents",
            filter: `document_id == "${document_id}"`
        })
    } else if (connector_id) {
        client.delete({
            collection_name: "app_documents",
            filter: `connector_id == "${connector_id}"`
        })
    } else {
        throw new Error("document_id or connector_id is required")
    }
}