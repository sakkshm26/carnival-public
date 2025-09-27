import axios from "axios";
import { AppType, connector_group_access_table, connector_table, connector_user_access_table, document_chunk_table, document_table, org_user_map_table, SyncStatus, user_connector_table, user_group_table, user_group_user_map_table, user_table } from "../db/schema";
import { config } from "../providers/config";
import { DB } from "../db";
import { and, asc, desc, eq, getTableColumns, inArray, isNotNull, or } from "drizzle-orm";
import { delete_vector_entity_queue, index_queue } from "../providers/queues";
import { IndexingJobTypes, UserConnectorCredentialsData } from "../types";
import { Connector, Document, DocumentChunk, UserConnector } from "../db_types";

export const ConnectorService = {
    search: async (DTO: { org_id: string, user_id: string, query_text: string }) => {
        const { org_id, user_id, query_text } = DTO;

        // To verify this query
        const accessible_connector_ids = await DB
            .selectDistinct({
                connector_id: connector_table.id
            })
            .from(connector_table)
            .leftJoin(
                connector_user_access_table,
                eq(connector_table.id, connector_user_access_table.fk_access_connector)
            )
            .leftJoin(
                user_group_user_map_table,
                eq(user_group_user_map_table.fk_group_user, user_id)
            )
            .leftJoin(
                connector_group_access_table,
                and(
                    eq(connector_table.id, connector_group_access_table.fk_access_connector),
                    eq(user_group_user_map_table.fk_user_group, connector_group_access_table.fk_access_user_group)
                )
            )
            .where(
                or(
                    eq(connector_user_access_table.fk_access_user, user_id),
                    isNotNull(connector_group_access_table.fk_access_connector)
                )
            );

        const response = await axios.post(`${config.vector_server_url}/search`, {
            "org_id": org_id,
            "query": query_text,
            "connector_ids": accessible_connector_ids.map((connector) => connector.connector_id)
        })

        const result = await ConnectorService.getDataFromSourceApp({ chunks: response.data });

        return result;
    },

    getOrgConnectors: async (DTO: { org_id: string, user_id: string }) => {
        const { org_id, user_id } = DTO;
        const org_connector_table_columns = getTableColumns(connector_table)
        const { credentials_data: user_connector_credentials_data, ...user_connector_table_columns } = getTableColumns(user_connector_table)

        const connectors = await DB.select({ org_connector: org_connector_table_columns, user_connector: user_connector_table_columns })
            .from(connector_table)
            .leftJoin(user_connector_table, and(
                eq(user_connector_table.fk_user_connector, connector_table.id),
                eq(user_connector_table.fk_connector_user, user_id)
            ))
            .where(and(eq(connector_table.fk_connector_org, org_id), eq(connector_table.is_deleted, false)))

        return connectors;
    },

    createConnector: async (DTO: {
        org_id: string,
        user_id: string,
        connector_name: string,
        app_type: AppType,
        connector_data: Record<string, any>, // user input for key-based apps, and user input & credentials for oauth apps
    }) => {
        const { org_id, user_id, app_type, connector_data, connector_name } = DTO;
        /* if (app_type === AppType.JIRA) {
            const cloud_id_response = await axios.get(`${connector_data.base_url}/_edge/tenant_info`);
            const connector = (await DB.insert(connector_table).values({
                fk_connector_org: org_id,
                name: connector_name || "Jira Connector",
                sync_status: SyncStatus.IN_PROCESS,
                app_type: AppType.JIRA,
                credentials_data: {
                    access_token: connector_data.access_token,
                    email: connector_data.email,
                    base_url: connector_data.base_url,
                    cloud_id: cloud_id_response.data.cloudId
                },
                additional_data: {
                    project_ids: connector_data.project_ids ?? undefined
                }
            }).returning())[0]
            await DB.insert(connector_user_access_table).values({
                fk_access_org: org_id,
                fk_access_connector: connector.id,
                fk_access_user: user_id
            })
            await index_queue.add(`index-${connector.app_type}`, {
                connector_id: connector.id,
                type: IndexingJobTypes.INITIAL_INDEX
            })
        } else if (app_type === AppType.GOOGLE_DRIVE) {
            const connector = (await DB.insert(connector_table).values({
                fk_connector_org: org_id,
                name: connector_name || "Google Drive Connector",
                sync_status: SyncStatus.IN_PROCESS,
                app_type: AppType.GOOGLE_DRIVE,
                credentials_data: {
                    access_token: connector_data.access_token,
                    refresh_token: connector_data.refresh_token
                },
                app_data: {
                    users: [],
                    folders: []
                }
            }).returning())[0];
            await DB.insert(connector_user_access_table).values({
                fk_access_org: org_id,
                fk_access_connector: connector.id,
                fk_access_user: user_id
            })
            await index_queue.add(`index-${connector.app_type}`, {
                connector_id: connector.id,
                type: IndexingJobTypes.INITIAL_INDEX,
                additional_data: {
                    folder_ids: connector_data.folder_ids
                }
            })
        } else if (app_type === AppType.SLACK) {
            const connector = (await DB.insert(connector_table).values({
                fk_connector_org: org_id,
                name: connector_name || "Slack Connector",
                sync_status: SyncStatus.SUCCESS,
                app_type: AppType.SLACK,
                credentials_data: {
                    client_id: connector_data.client_id,
                    client_secret: connector_data.client_secret
                },
            }).returning())[0]
            const all_org_users = await DB.select().from(org_user_map_table).where(eq(org_user_map_table.fk_user_org, org_id))
            await Promise.all(all_org_users.map(async (user) => {
                await DB.insert(connector_user_access_table).values({
                    fk_access_org: org_id,
                    fk_access_connector: connector.id,
                    fk_access_user: user.fk_org_user
                })
            }))
            await DB.insert(connector_user_access_table).values({
                fk_access_org: org_id,
                fk_access_connector: connector.id,
                fk_access_user: user_id
            })
            await index_queue.add(`index-${connector.app_type}`, {
                connector_id: connector.id,
                type: IndexingJobTypes.INITIAL_INDEX
            })
        } else if (app_type === AppType.GITHUB) {
            const connector = (await DB.insert(connector_table).values({
                fk_connector_org: org_id,
                name: connector_name || "Github Connector",
                sync_status: SyncStatus.IN_PROCESS,
                app_type: AppType.GITHUB,
                credentials_data: {
                    access_token: connector_data.access_token
                },
                app_data: {
                    users: [],
                    repositories: [],
                    pull_request_states: []
                }
            }).returning())[0]
            await DB.insert(connector_user_access_table).values({
                fk_access_org: org_id,
                fk_access_connector: connector.id,
                fk_access_user: user_id
            })
            await index_queue.add(`index-${connector.app_type}`, {
                connector_id: connector.id,
                type: IndexingJobTypes.INITIAL_INDEX
            })
        }
        else if (app_type === AppType.SALESFORCE) {
            const connector = (await DB.insert(connector_table).values({
                fk_connector_org: org_id,
                name: connector_name || "Salesforce Connector",
                sync_status: SyncStatus.IN_PROCESS,
                app_type: AppType.SALESFORCE,
                credentials_data: {
                    access_token: connector_data.access_token,
                    refresh_token: connector_data.refresh_token,
                    instance_url: connector_data.instance_url
                }
            }).returning())[0]
            await DB.insert(connector_user_access_table).values({
                fk_access_org: org_id,
                fk_access_connector: connector.id,
                fk_access_user: user_id
            })
            await index_queue.add(`index-${connector.app_type}`, {
                connector_id: connector.id,
                type: IndexingJobTypes.INITIAL_INDEX
            })
        } else if (app_type === AppType.CONFLUENCE) {
            const cloud_id_response = await axios.get(`${connector_data.base_url}/_edge/tenant_info`);
            const connector = (await DB.insert(connector_table).values({
                fk_connector_org: org_id,
                name: connector_name || "Confluence Connector",
                sync_status: SyncStatus.IN_PROCESS,
                app_type: AppType.CONFLUENCE,
                credentials_data: {
                    access_token: connector_data.access_token,
                    email: connector_data.email,
                    base_url: connector_data.base_url,
                    cloud_id: cloud_id_response.data.cloudId
                },
                additional_data: {
                    space_keys: connector_data.space_keys ?? undefined
                }
            }).returning())[0]
            await DB.insert(connector_user_access_table).values({
                fk_access_org: org_id,
                fk_access_connector: connector.id,
                fk_access_user: user_id
            })
            await index_queue.add(`index-${connector.app_type}`, {
                connector_id: connector.id,
                type: IndexingJobTypes.INITIAL_INDEX
            })
        }
        else {
            throw new Error(`Unsupported app type: ${app_type}`)
        } */
    },

    /* retryConnector: async (DTO: { connector_id: string }) => {
        const { connector_id } = DTO;

        const connector = (await DB.select().from(connector_table).where(eq(connector_table.id, connector_id)))[0]

        if (!connector) {
            throw new Error(`Connector with ${connector_id} not found`)
        }

        if (connector.sync_status === SyncStatus.FAILED) {
            await index_queue.upsertJobScheduler(`${connector.id}`, {
                every: config.default_reindex_interval,
            }, {
                data: {
                    connector_id,
                    type: IndexingJobTypes.REINDEX
                }
            })
        } else {
            throw new Error(`Connector with ${connector_id} is not in failed state`)
        }

        return connector;
    }, */

    getConnectorById: async (DTO: { connector_id: string, user_id: string }) => {
        const { connector_id, user_id } = DTO;

        const connector_table_columns = getTableColumns(connector_table)
        const user_connector_table_columns = getTableColumns(user_connector_table)

        const connector = (await DB.select({ ...connector_table_columns, user_connector: user_connector_table_columns })
            .from(connector_table)
            .where(eq(connector_table.id, connector_id))
            .leftJoin(user_connector_table, and(eq(user_connector_table.fk_user_connector, connector_id), eq(user_connector_table.fk_connector_user, user_id)))
        )[0]

        const user_columns = getTableColumns(user_table)

        const connector_user_access = await DB.select({ created_at: connector_user_access_table.created_at, user: user_columns })
            .from(connector_user_access_table)
            .where(and(eq(connector_user_access_table.fk_access_connector, connector_id), isNotNull(user_table.display_name)))
            .leftJoin(user_table, eq(connector_user_access_table.fk_access_user, user_table.id))
        const connector_group_access = await DB.select({ created_at: connector_group_access_table.created_at, group: getTableColumns(user_group_table) })
            .from(connector_group_access_table)
            .where(eq(connector_group_access_table.fk_access_connector, connector_id))
            .leftJoin(user_group_table, eq(connector_group_access_table.fk_access_user_group, user_group_table.id))

        return { ...connector, user_access: connector_user_access, group_access: connector_group_access };
    },

    updateConnector: async (DTO: { org_id: string, connector_id: string, name?: string, user_access?: string[], group_access?: string[] }) => {
        const { org_id, connector_id, name, user_access, group_access } = DTO;

        let update_data: any = {};

        if (name) {
            update_data.name = name;
        }

        if (user_access) {
            const connector_user_access = await DB.select()
                .from(connector_user_access_table)
                .where(eq(connector_user_access_table.fk_access_connector, connector_id));

            const added_users = user_access.filter((user_id) => !connector_user_access.some((user) => user.fk_access_user === user_id));
            const removed_users = connector_user_access.filter((user) => !user_access.includes(user.fk_access_user)).map((user) => user.fk_access_user);

            await Promise.all(added_users.map(async (user_id) => {
                await DB.insert(connector_user_access_table).values({
                    fk_access_org: org_id,
                    fk_access_connector: connector_id,
                    fk_access_user: user_id
                })
            }))

            await Promise.all(removed_users.map(async (user_id) => {
                await DB.delete(connector_user_access_table).where(
                    and(
                        eq(connector_user_access_table.fk_access_connector, connector_id),
                        eq(connector_user_access_table.fk_access_user, user_id)
                    )
                )
            }))
        }

        if (group_access) {
            const connector_group_access = await DB.select()
                .from(connector_group_access_table)
                .where(eq(connector_group_access_table.fk_access_connector, connector_id));

            const added_groups = group_access.filter((group_id) => !connector_group_access.some((group) => group.fk_access_user_group === group_id));
            const removed_groups = connector_group_access.filter((group) => !group_access.includes(group.fk_access_user_group)).map((group) => group.fk_access_user_group);

            await Promise.all(added_groups.map(async (group_id) => {
                await DB.insert(connector_group_access_table).values({
                    fk_access_org: org_id,
                    fk_access_connector: connector_id,
                    fk_access_user_group: group_id
                })
            }))

            await Promise.all(removed_groups.map(async (group_id) => {
                await DB.delete(connector_group_access_table).where(
                    and(
                        eq(connector_group_access_table.fk_access_connector, connector_id),
                        eq(connector_group_access_table.fk_access_user_group, group_id)
                    )
                )
            }))
        }

        let connector: typeof connector_table.$inferSelect | null = null;

        if (Object.keys(update_data).length) {
            connector = (await DB.update(connector_table).set(update_data).where(eq(connector_table.id, connector_id)).returning())[0];
        } else {
            connector = (await DB.select().from(connector_table).where(eq(connector_table.id, connector_id)))[0];
        }

        return connector;
    },

    deleteConnector: async (DTO: { connector_id: string }) => {
        /* const { connector_id } = DTO;

        await index_queue.removeJobScheduler(`${connector_id}`)

        await DB.transaction(async (tx) => {
            await DB.update(connector_table).set({
                sync_status: SyncStatus.DELETING
            }).where(eq(connector_table.id, connector_id));

            const documents = await tx.select({ id: document_table.id }).from(document_table).where(eq(document_table.fk_document_connector, connector_id));

            await Promise.all(documents.map(async document => {
                await tx.delete(document_chunk_table).where(eq(document_chunk_table.fk_chunk_document, document.id));
            }))

            await tx.delete(document_table).where(eq(document_table.fk_document_connector, connector_id));

            await tx.delete(connector_user_access_table).where(eq(connector_user_access_table.fk_access_connector, connector_id));

            await tx.delete(connector_group_access_table).where(eq(connector_group_access_table.fk_access_connector, connector_id));

            await tx.delete(user_connector_table).where(eq(user_connector_table.fk_user_connector, connector_id));

            await tx.delete(connector_table).where(eq(connector_table.id, connector_id));

            await delete_vector_entity_queue.add("delete_from_connector", {
                connector_id
            })
        }) */
    },

    recoverJobs: async () => {
        /* const stuck_connectors = await DB.select().from(connector_table).where(
            and(
                eq(connector_table.sync_status, SyncStatus.IN_PROCESS),
            )
        )

        for (const connector of stuck_connectors) {
            await index_queue.add(`recovery-${connector.id}`, {
                connector_id: connector.id
            })
        } */
    },

    getDataFromSourceApp: async (DTO: { chunks: { document_id: string, chunk_index: number }[] }) => {
        /* const { chunks } = DTO;

        const document_chunks: { chunk: DocumentChunk, document: Document, connector: Connector }[] = (await DB
            .select({ chunk: document_chunk_table, document: document_table, connector: connector_table })
            .from(document_chunk_table)
            .where(or(
                ...(chunks.map((chunk) => and(eq(document_chunk_table.fk_chunk_document, chunk.document_id), eq(document_chunk_table.chunk_index, chunk.chunk_index))))
            ))
            .leftJoin(document_table, eq(document_chunk_table.fk_chunk_document, document_table.id))
            .leftJoin(connector_table, eq(document_table.fk_document_connector, connector_table.id))) as any

        const result = await Promise.all(document_chunks.map(async chunk => {
            if (chunk.connector.app_type === AppType.JIRA) {
                try {
                    const jira_connector = chunk.connector as Connector & { credentials_data: JiraConnectorCredentialsData }
                    const issue_response = await axios.get(`https://api.atlassian.com/ex/jira/${jira_connector.credentials_data.cloud_id}/rest/api/3/issue/${chunk.document.metadata.id}`, {
                        headers: {
                            Authorization: `Basic ${Buffer.from(`${jira_connector.credentials_data.email}:${jira_connector.credentials_data.access_token}`).toString('base64')}`
                        }
                    })
                    const description_text = extract_description_text(issue_response.data);
                    return { ...chunk, display: { title: `${issue_response.data.key}`, description: `${issue_response.data.fields.summary} ${description_text}` } }
                } catch (err) {
                    console.log("err --->", err)
                    return chunk;
                }
            }
            return chunk;
        }))

        return result.map(item => ({ ...item, connector: { app_type: item.connector.app_type } })); */
    },

    upsertUserConnector: async (DTO: { org_id: string, user_id: string, connector_id: string, credentials_data: UserConnectorCredentialsData }) => {
        const { org_id, user_id, connector_id, credentials_data } = DTO;

        let user_connector: UserConnector | null = null;

        const existing_user_connector = (await DB.select().from(user_connector_table)
            .where(
                and(
                    eq(user_connector_table.fk_connector_user, user_id),
                    eq(user_connector_table.fk_user_connector_org, org_id),
                    eq(user_connector_table.fk_user_connector, connector_id)
                )
            ))[0]

        if (existing_user_connector) {
            user_connector = (await DB.update(user_connector_table).set({
                credentials_data,
                connected: true
            }).where(eq(user_connector_table.id, existing_user_connector.id)).returning())[0]
        } else {
            user_connector = (await DB.insert(user_connector_table).values({
                fk_connector_user: user_id,
                fk_user_connector: connector_id,
                fk_user_connector_org: org_id,
                credentials_data,
                connected: true
            }).returning())[0]
        }

        return user_connector
    }
}