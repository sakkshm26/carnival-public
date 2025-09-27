import os
from bullmq import Queue

# Redis connection configuration for Docker Compose
redis_connection = {
    "host": os.getenv("REDIS_HOST"),
    "port": int(os.getenv("REDIS_PORT")),
    "db": int(os.getenv("0"))
}

add_vector_entity_queue = Queue(os.getenv("ADD_VECTOR_ENTITY_QUEUE"), {"connection": redis_connection})
delete_vector_entity_queue = Queue(os.getenv("DELETE_VECTOR_ENTITY_QUEUE"), {"connection": redis_connection})
