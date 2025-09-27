import { add_vector_entity_queue, delete_vector_entity_queue } from "../providers/queues";

export type AddVectorEntityDTO = {
    org_id: string;
    document_id: string;
    connector_id: string;
    title: string;
    chunk_content: string;
    chunk_index: number
}

export type DeleteVectorEntity = {
    document_id: string;
}

export const VectorQueueService = {
    addVectorEntity: async (DTO: AddVectorEntityDTO) => {
        const { org_id, document_id, connector_id, title, chunk_content, chunk_index } = DTO;

        await add_vector_entity_queue.add("add", {
            org_id,
            connector_id,
            document_id,
            title,
            chunk_content,
            chunk_index
        }, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 2000
            }
        })
    },

    deleteVectorEntity: async (DTO: DeleteVectorEntity) => {
        const { document_id } = DTO;

        await delete_vector_entity_queue.add("delete_from_document", {
            document_id
        }, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 2000
            }
        })
    }
}