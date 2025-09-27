import { Worker } from "bullmq"
import { config } from "./config"
import { indexWorkerHandler } from "../jobs/indexing"
import redis from "./redis"
import { addVectorEntityWorkerHandler, deleteVectorEntityWorkerHandler } from "../jobs/vector_db"

export const initializeWorkers = () => {
    console.log("Initializing workers")
    
    new Worker(config.index_queue, indexWorkerHandler, {
        connection: redis.duplicate(),
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 200 },
        concurrency: 5,
        lockDuration: 300000,
        stalledInterval: 30000,
        maxStalledCount: 2
    })

    new Worker(config.add_vector_entity_queue, addVectorEntityWorkerHandler, {
        connection: redis.duplicate(),
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 500 },
        concurrency: 5,
        lockDuration: 300000,
        stalledInterval: 30000,
        maxStalledCount: 2
    })

    new Worker(config.delete_vector_entity_queue, deleteVectorEntityWorkerHandler, {
        connection: redis.duplicate(),
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 500 },
        concurrency: 5,
        lockDuration: 300000,
        stalledInterval: 30000,
        maxStalledCount: 2
    })
}