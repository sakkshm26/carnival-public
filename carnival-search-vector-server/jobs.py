# from bullmq import Job
# from milvus import store_embeddings, delete_entities_from_connector_id, delete_entities_from_document_id
# from database import get_db_cursor
# from milvus import create_embeddings

# async def add_vector_entity_worker_handler(job: Job, job_token: str):
#     title_embedding = create_embeddings(job.data["title"])
#     with get_db_cursor() as cursor:
#         cursor.execute(f"SELECT * from document_chunk where fk_chunk_org = '{job.data['org_id']}' and fk_chunk_document = '{job.data['document_id']}'")
#         result = cursor.fetchall()
#         for index, row in enumerate(result):
#             store_embeddings(
#                 row["content"],
#                 job.data["title"],
#                 title_embedding,
#                 job.data["org_id"],
#                 job.data["document_id"],
#                 job.data["connector_id"],
#                 index
#             )

# async def delete_vector_entity_worker_handler(job: Job, job_token: str):
#     print("deleting vector entity --->", job.data)
#     document_id = job.data.get("document_id")
#     connector_id = job.data.get("connector_id")
    
#     if document_id is not None:
#         delete_entities_from_document_id(document_id)
#     elif connector_id is not None:
#         delete_entities_from_connector_id(connector_id)
#     else:
#         raise Exception("Invalid job data provided: both document_id and connector_id are missing")