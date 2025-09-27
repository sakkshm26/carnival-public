import { Job } from "bullmq";
import { DB } from "../db";
import { AppType, connector_table, SyncStatus } from "../db/schema";
import { eq } from "drizzle-orm";
import { IndexingJobTypes } from "../types";

export const indexWorkerHandler = async (job: Job) => {
    /* const { connector_id, type } = job.data;

    let now_date = new Date();

    try {
        const connector = (await DB.select().from(connector_table).where(eq(connector_table.id, connector_id)))[0];

        if (!connector) {
            throw new Error(`connector with id ${connector_id} not found`)
        }

        if (connector.app_type === AppType.JIRA) {
            if (type === IndexingJobTypes.INITIAL_INDEX) {
                await initialIndexJira({ connector_id, now_date, job });
                await index_queue.upsertJobScheduler(`${connector.id}`, {
                    every: config.default_reindex_interval,
                }, {
                    data: {
                        connector_id,
                        type: IndexingJobTypes.REINDEX
                    }
                })
            } else if (type === IndexingJobTypes.REINDEX) {
                try {
                    await DB.update(connector_table).set({
                        sync_status: SyncStatus.IN_PROCESS
                    }).where(eq(connector_table.id, connector_id))
                    await reindexJira({ connector_id, now_date });
                } catch (err) {
                    await index_queue.removeJobScheduler(`${connector.id}`)
                    throw err;
                }
            }
        } else if (connector.app_type === AppType.GOOGLE_DRIVE) {
            if (type === IndexingJobTypes.INITIAL_INDEX) {
                await initialIndexGoogleDrive({ connector_id, now_date })
                await index_queue.upsertJobScheduler(`${connector.id}`, {
                    every: config.default_reindex_interval,
                }, {
                    data: {
                        connector_id,
                        type: IndexingJobTypes.REINDEX
                    }
                })
            } else if (type === IndexingJobTypes.REINDEX) {
                try {
                    await DB.update(connector_table).set({
                        sync_status: SyncStatus.IN_PROCESS
                    }).where(eq(connector_table.id, connector_id))
                    await reindexGoogleDrive({ connector_id, now_date });
                } catch (err) {
                    await index_queue.removeJobScheduler(`${connector.id}`)
                    throw err;
                }
            }
        } else if (connector.app_type === AppType.SLACK) {
            if (type === IndexingJobTypes.INITIAL_INDEX) {
                await initialIndexSlack({ connector_id, now_date })
                await index_queue.upsertJobScheduler(`${connector.id}`, {
                    every: config.default_reindex_interval,
                }, {
                    data: {
                        connector_id,
                        type: IndexingJobTypes.REINDEX
                    }
                })
            } else if (type === IndexingJobTypes.REINDEX) {
                try {
                    await DB.update(connector_table).set({
                        sync_status: SyncStatus.IN_PROCESS
                    }).where(eq(connector_table.id, connector_id))
                    await reindexSlack({ connector_id, now_date });
                } catch (err) {
                    await index_queue.removeJobScheduler(`${connector.id}`)
                    throw err;
                }
            }
        } else if (connector.app_type === AppType.GITHUB) {
            if (type === IndexingJobTypes.INITIAL_INDEX) {
                await initialIndexGithub({ connector_id, now_date })
                await index_queue.upsertJobScheduler(`${connector.id}`, {
                    every: config.default_reindex_interval,
                }, {
                    data: {
                        connector_id,
                        type: IndexingJobTypes.REINDEX
                    }
                })
            } else if (type === IndexingJobTypes.REINDEX) {
                try {
                    await DB.update(connector_table).set({
                        sync_status: SyncStatus.IN_PROCESS
                    }).where(eq(connector_table.id, connector_id))
                    await reindexGithub({ connector_id, now_date });
                } catch (err) {
                    await index_queue.removeJobScheduler(`${connector.id}`)
                    throw err;
                }
            }
        } else if (connector.app_type === AppType.SALESFORCE) {
            if (type === IndexingJobTypes.INITIAL_INDEX) {
                await initialIndexSalesforce({ connector_id, now_date })
                await index_queue.upsertJobScheduler(`${connector.id}`, {
                    every: config.default_reindex_interval,
                }, {
                    data: {
                        connector_id,
                        type: IndexingJobTypes.REINDEX
                    }
                })
            } else if (type === IndexingJobTypes.REINDEX) {
                try {
                    await DB.update(connector_table).set({
                        sync_status: SyncStatus.IN_PROCESS
                    }).where(eq(connector_table.id, connector_id))
                    await reindexSalesforce({ connector_id, now_date });
                } catch (err) {
                    await index_queue.removeJobScheduler(`${connector.id}`)
                    throw err;
                }
            }
        } else if (connector.app_type === AppType.CONFLUENCE) {
            if (type === IndexingJobTypes.INITIAL_INDEX) {
                await initialIndexConfluence({ connector_id, now_date })
                await index_queue.upsertJobScheduler(`${connector.id}`, {
                    every: config.default_reindex_interval,
                }, {
                    data: {
                        connector_id,
                        type: IndexingJobTypes.REINDEX
                    }
                })
            } else if (type === IndexingJobTypes.REINDEX) {
                try {
                    await DB.update(connector_table).set({
                        sync_status: SyncStatus.IN_PROCESS
                    }).where(eq(connector_table.id, connector_id))
                    await reindexConfluence({ connector_id, now_date });
                } catch (err) {
                    await index_queue.removeJobScheduler(`${connector.id}`)
                    throw err;
                }
            }
        } else {
            throw new Error(`Unsupported app type: ${connector.app_type}`)
        }

        await DB.update(connector_table).set({
            sync_status: SyncStatus.SUCCESS,
            last_synced_at: now_date
        }).where(eq(connector_table.id, connector_id))
    } catch (err) {
        await DB.update(connector_table).set({
            sync_status: SyncStatus.FAILED
        }).where(eq(connector_table.id, connector_id))

        throw err;
    } */
}