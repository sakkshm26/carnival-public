# import os
# from bullmq import Worker
# from jobs import add_vector_entity_worker_handler, delete_vector_entity_worker_handler
# import asyncio
# import signal

# workers = []  # Store workers globally

# # Redis connection configuration for Docker Compose
# redis_connection = {
#     "host": os.getenv("REDIS_HOST"),
#     "port": int(os.getenv("REDIS_PORT")),
#     "db": "0"  # Fixed: was "0" string, should be integer
# }

# async def initialize_workers():
#     add_vector_entity_worker = Worker(os.getenv("ADD_VECTOR_ENTITY_QUEUE"), add_vector_entity_worker_handler, {
#         "concurrency": 5,  # Reduced from 100 to 5
#         "lockDuration": 300000,  # Increased from 120000 to 300000 (5 minutes)
#         "stalledInterval": 30000,  # Check for stalled jobs every 30 seconds
#         "maxStalledCount": 2,  # Allow 2 stalls before marking as failed
#         "connection": redis_connection
#     })

#     delete_vector_entity_worker = Worker(os.getenv("DELETE_VECTOR_ENTITY_QUEUE"), delete_vector_entity_worker_handler, {
#         "concurrency": 5,  # Reduced from 100 to 5
#         "lockDuration": 300000,  # Increased from 120000 to 300000 (5 minutes)
#         "stalledInterval": 30000,  # Check for stalled jobs every 30 seconds
#         "maxStalledCount": 2,  # Allow 2 stalls before marking as failed
#         "connection": redis_connection
#     })
    
#     workers.extend([add_vector_entity_worker, delete_vector_entity_worker])

# async def shutdown_workers():
#     print("closing workers")
#     for worker in workers:
#         await worker.close()
#     print("workers closed")
