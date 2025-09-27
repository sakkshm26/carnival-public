import { Queue } from 'bullmq';
import { config } from './config';
import redis from './redis';

export const index_queue = new Queue(config.index_queue, {
    connection: redis.duplicate()
})

export const add_vector_entity_queue = new Queue(config.add_vector_entity_queue, {
    connection: redis.duplicate()
})

export const delete_vector_entity_queue = new Queue(config.delete_vector_entity_queue, {
    connection: redis.duplicate()
})
