import axios, { AxiosResponse } from "axios";
import { config } from "../../providers/config";
// import { DB } from "../../db";
// import { AppType, connector_table, document_chunk_table, document_table, DocumentType, SyncStatus } from "../../db/schema";
// import { config } from "../../providers/config";
// import { and, eq, sql } from "drizzle-orm";
// import { text_splitter } from "../../langchain";
// import { Connector } from "../../db_types";
// import { JiraConnectorAdditionalData, JiraConnectorCredentialsData } from "../../types";
// import dayjs from "dayjs";
// import { delete_vector_entity_queue } from "../../providers/queues";
// import { jsonExtract } from "../../utils";
// import { VectorQueueService } from "../vector_queue.service";
// import { Job } from "bullmq";
// import https from "https";

export const fetchJiraAccessToken = async (DTO: { code: string }) => {
    const { code } = DTO;

    const response = await axios.post("https://auth.atlassian.com/oauth/token", {
        grant_type: "authorization_code",
        client_id: config.atlassian_client_id,
        client_secret: config.atlassian_client_secret,
        redirect_uri: config.atlassian_redirect_uri,
        code: code
    }, {
        headers: {
            "Content-Type": "application/json"
        }
    });

    if (response.status !== 200) {
        throw new Error("Failed to fetch Jira access token");
    }

    return {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token
    };
};

// const extract_comments_array = (issue: any) => {
//     let comments: string[] = [];

//     // TODO: Extract other types of comments as well, not just text
//     try {
//         for (const comment of issue.fields.comment.comments) {
//             let comment_text: string[] = [];
//             for (const body of comment.body?.content) {
//                 if (body.content) {
//                     for (const item of body.content) {
//                         if (item.type === "text" && item.text?.trim()) {
//                             comment_text.push(item.text)
//                         }
//                     }
//                 }
//             }
//             if (comment_text.length) {
//                 comments.push(comment_text.join(" "))
//             }
//         }

//     } catch (err) {
//         console.log("err --->", err);
//     }

//     return comments;
// }

// export const extract_description_text = (issue: any) => {
//     let description_text: string[] = [];
//     try {
//         if (issue.fields.description) {
//             for (const description of issue.fields.description.content) {
//                 if (description.content) {
//                     for (const item of description.content) {
//                         if (item.type === "text") {
//                             description_text.push(item.text)
//                         }
//                     }
//                 }
//             }
//         }
//     } catch (err) {
//         console.log("err --->", err);
//     }

//     return description_text.join(" ");
// }

// export const initialIndexJira = async (DTO: { connector_id: string, now_date: Date, job: Job }) => {
//     const { connector_id, now_date, job } = DTO;

//     const now_date_formatted = dayjs(now_date).format("YYYY-MM-DD HH:mm");

//     const connector: Connector & { credentials_data: JiraConnectorCredentialsData, additional_data: JiraConnectorAdditionalData } = (await DB.select().from(connector_table).where(eq(connector_table.id, connector_id)))[0] as any;

//     if (!connector) {
//         throw new Error(`Connector with ${connector_id} not found`);
//     }

//     let has_more_issues = true;
//     let next_page_token: string | null = null;

//     while (has_more_issues) {
//         await job.extendLock(job.token ?? "", 60000)
//         let jql = `created < '${now_date_formatted}'`;
//         if (connector.additional_data?.project_ids?.length) {
//             jql += ` AND project IN (${connector.additional_data!.project_ids!.map((project_id: string) => `'${project_id}'`).join(", ")})`;
//         }

//         const response: AxiosResponse<any, any> = await axios.post(`https://api.atlassian.com/ex/jira/${connector.credentials_data.cloud_id}/rest/api/3/search/jql`, {
//             expand: "",
//             fields: [
//                 "*all"
//             ],
//             fieldsByKeys: true,
//             jql,
//             maxResults: 500,
//             nextPageToken: next_page_token ?? undefined,
//         }, {
//             headers: {
//                 Authorization: `Basic ${Buffer.from(`${connector.credentials_data.email}:${connector.credentials_data.access_token}`).toString('base64')}`
//             },
//             httpsAgent: new https.Agent({
//                 keepAlive: true
//             }),
//             timeout: 60000
//         })

//         if (response.data.nextPageToken) {
//             next_page_token = response.data.nextPageToken;
//         } else {
//             has_more_issues = false;
//         }

//         for (const issue of response.data.issues) {
//             const issue_link = `${connector.credentials_data.base_url}/browse/${issue.key}`;

//             const comments_arr = extract_comments_array(issue);
//             const description_text = extract_description_text(issue);
//             let issue_content = `${issue.key} ${issue.fields.summary} ${description_text} \n ${comments_arr.map(comment => `Comment: ${comment}`).join("\n")}`;

//             let metadata: any = {
//                 id: issue.id,
//                 key: issue.key,
//                 created: issue.fields.created,
//                 updated: issue.fields.updated,
//                 status: issue.fields.status?.name,
//                 priority: issue.fields.priority?.name,
//                 reporter: issue.fields.reporter?.displayName,
//                 assignee: issue.fields.assignee?.displayName,
//                 creator: issue.fields.creator?.displayName,
//                 resolution: issue.fields.resolution?.name,
//                 resolution_date: issue.fields.resolutiondate,
//                 labels: issue.fields.project.labels?.length ? issue.fields.project.labels : undefined,
//                 due_date: issue.fields.duedate,
//                 issue_type: issue.fields.issuetype?.name,
//                 project_name: issue.fields.project?.name,
//                 project_key: issue.fields.project?.key,
//             }

//             metadata = Object.fromEntries(Object.entries(metadata).filter(([_, value]) => value !== undefined));

//             issue_content += `\n ${Object.entries(metadata).map(([key, value]) => `${key}: ${value}`).join(", ")}`

//             const document = (await DB.insert(document_table).values({
//                 fk_document_org: connector.fk_connector_org,
//                 fk_document_connector: connector.id,
//                 link: issue_link,
//                 metadata
//             }).returning())[0]

//             const chunks = await text_splitter.splitText(issue_content);

//             await Promise.all(chunks.map(async (chunk, index) => {
//                 await DB.insert(document_chunk_table).values({
//                     fk_chunk_org: connector.fk_connector_org,
//                     fk_chunk_connector: connector.id,
//                     fk_chunk_document: document.id,
//                     chunk_index: index
//                 })

//                 await VectorQueueService.addVectorEntity({
//                     org_id: connector.fk_connector_org,
//                     connector_id: connector.id,
//                     document_id: document.id,
//                     title: `${issue.key} ${issue.fields.summary}`,
//                     chunk_content: chunk,
//                     chunk_index: index
//                 })
//             }))
//         }
//     }
// }

// const deleteDocumentChunks = async (DTO: { document_id: string }) => {
//     const { document_id } = DTO;

//     await DB.delete(document_chunk_table).where(eq(document_chunk_table.fk_chunk_document, document_id));

//     await delete_vector_entity_queue.add("delete_from_document", {
//         document_id
//     })
// }

// export const reindexJira = async (DTO: { connector_id: string, now_date: Date }) => {
//     // const { connector_id, now_date } = DTO;

//     // const connector: Connector & { credentials_data: JiraConnectorCredentialsData } = (await DB.select().from(connector_table).where(eq(connector_table.id, connector_id)))[0] as any;

//     // if (!connector) {
//     //     throw new Error(`Connector with ${connector_id} not found`);
//     // }

//     // const last_synced_at_formatted = dayjs(connector.last_synced_at).format("YYYY-MM-DD HH:mm");
//     // const now_date_formatted = dayjs(now_date).format("YYYY-MM-DD HH:mm");

//     // // Updated issues
//     // let has_more_updated_issues = true;
//     // let next_updated_page_token: string | null = null;

//     // while (has_more_updated_issues) {
//     //     const response: AxiosResponse<any, any> = await axios.post(`${connector.credentials_data.base_url}/rest/api/3/search/jql`, {
//     //         "expand": "",
//     //         "fields": ["*all"],
//     //         "fieldsByKeys": true,
//     //         "jql": `updated >= '${last_synced_at_formatted}' AND updated < '${now_date_formatted}' AND created < '${last_synced_at_formatted}'`,
//     //         "maxResults": 50,
//     //         "nextPageToken": next_updated_page_token ?? undefined
//     //     }, {
//     //         headers: {
//     //             Authorization: `Basic ${Buffer.from(`${connector.credentials_data.email}:${connector.credentials_data.access_token}`).toString('base64')}`
//     //         }
//     //     });

//     //     if (response.data.nextPageToken) {
//     //         next_updated_page_token = response.data.nextPageToken;
//     //     } else {
//     //         has_more_updated_issues = false;
//     //     }

//     //     for (const issue of response.data.issues) {
//     //         const comments_arr = extract_comments_array(issue);
//     //         const description_text = extract_description_text(issue);
//     //         const issue_content = `${issue.key} ${issue.fields.summary} ${description_text}\n${comments_arr.map(comment => `Comment: ${comment}`).join("\n")}`;

//     //         const found_document = (await DB.select().from(document_table)
//     //             .where(
//     //                 and(
//     //                     eq(document_table.fk_document_connector, connector.id),
//     //                     eq(jsonExtract(document_table.metadata, "id"), issue.id)
//     //                 )
//     //             ))[0];

//     //         if (!found_document) {
//     //             throw new Error(`Document not found with issue id ${issue.id}`);
//     //         }

//     //         const metadata = {
//     //             updated: issue.fields.updated,
//     //             statuscategorychangedate: issue.fields.statuscategorychangedate,
//     //             status_id: issue.fields.status.id,
//     //             project_id: issue.fields.project.id,
//     //             assignee_account_id: issue.fields.assignee?.accountId,
//     //             creator_account_id: issue.fields.creator.accountId,
//     //             reporter_account_id: issue.fields.reporter?.accountId,
//     //             issue_type_id: issue.fields.issuetype.id,
//     //         }

//     //         await DB.update(document_table).set({
//     //             title: `${issue.key} - ${issue.fields.summary}`,
//     //             metadata: {
//     //                 ...(found_document.metadata),
//     //                 ...metadata
//     //             }
//     //         }).where(
//     //             eq(document_table.id, found_document.id)
//     //         )

//     //         await deleteDocumentChunks({ document_id: found_document.id });

//     //         const chunks = await text_splitter.splitText(issue_content);

//     //         await Promise.all(chunks.map(async (chunk, index) => {
//     //             await DB.insert(document_chunk_table).values({
//     //                 fk_chunk_org: connector.fk_connector_org,
//     //                 fk_chunk_document: found_document.id,
//     //                 chunk_index: index,
//     //                 content: chunk
//     //             })

//     //             await VectorQueueService.addVectorEntity({
//     //                 org_id: connector.fk_connector_org,
//     //                 document_id: found_document.id,
//     //                 connector_id: connector.id,
//     //                 title: `${issue.key} - ${issue.fields.summary}`
//     //             })
//     //         }))
//     //     }
//     // }


//     // // New issues`;
//     // let has_more_new_issues = true;
//     // let next_new_page_token: string | null = null;

//     // while (has_more_new_issues) {
//     //     const response: AxiosResponse<any, any> = await axios.post(`${connector.credentials_data.base_url}/rest/api/3/search/jql`, {
//     //         "expand": "",
//     //         "fields": ["*all"],
//     //         "fieldsByKeys": true,
//     //         "jql": `created >= "${last_synced_at_formatted}" AND created < "${now_date_formatted}"`,
//     //         "maxResults": 50,
//     //         "nextPageToken": next_new_page_token ?? undefined
//     //     }, {
//     //         headers: {
//     //             Authorization: `Basic ${Buffer.from(`${connector.credentials_data.email}:${connector.credentials_data.access_token}`).toString('base64')}`
//     //         }
//     //     });

//     //     if (response.data.nextPageToken) {
//     //         next_new_page_token = response.data.nextPageToken;
//     //     } else {
//     //         has_more_new_issues = false;
//     //     }

//     //     for (const issue of response.data.issues) {
//     //         const comments_arr = extract_comments_array(issue);
//     //         const description_text = extract_description_text(issue);
//     //         const issue_content = `${issue.key} ${issue.fields.summary} ${description_text}\n${comments_arr.map(comment => `Comment: ${comment}`).join("\n")}`;
//     //         const issue_link = `${connector.credentials_data.base_url}/browse/${issue.key}`;

//     //         const metadata = {
//     //             id: issue.id,
//     //             key: issue.key,
//     //             created: issue.fields.created,
//     //             updated: issue.fields.updated,
//     //             statuscategorychangedate: issue.fields.statuscategorychangedate,
//     //             status_id: issue.fields.status.id,
//     //             project_id: issue.fields.project.id,
//     //             assignee_account_id: issue.fields.assignee?.accountId,
//     //             creator_account_id: issue.fields.creator.accountId,
//     //             reporter_account_id: issue.fields.reporter?.accountId,
//     //             issue_type_id: issue.fields.issuetype.id,
//     //         }

//     //         const document = (await DB.insert(document_table).values({
//     //             fk_document_org: connector.fk_connector_org,
//     //             fk_document_connector: connector.id,
//     //             title: `${issue.key} - ${issue.fields.summary}`,
//     //             link: issue_link,
//     //             type: DocumentType.ISSUE,
//     //             metadata
//     //         }).returning())[0]

//     //         const chunks = await text_splitter.splitText(issue_content);

//     //         await Promise.all(chunks.map(async (chunk, index) => {
//     //             await DB.insert(document_chunk_table).values({
//     //                 fk_chunk_org: connector.fk_connector_org,
//     //                 fk_chunk_document: document.id,
//     //                 chunk_index: index,
//     //                 content: chunk
//     //             })

//     //             /* await VectorQueueService.addVectorEntity({
//     //                 org_id: connector.fk_connector_org,
//     //                 document_id: document.id,
//     //                 connector_id: connector.id,
//     //                 chunk,
//     //                 chunk_index: index
//     //             }) */
//     //         }))
//     //     }
//     // }
// }

// export const getJiraProjects = async (DTO: { base_url: string, email: string, access_token: string }) => {
//     const { base_url, email, access_token } = DTO;

//     const cloud_id_response = await axios.get(`${base_url}/_edge/tenant_info`);
//     const cloud_id = cloud_id_response.data.cloudId;

//     let all_projects: any[] = [];
//     let start_at = 0;
//     let total = 0;

//     do {
//         const response = await axios.get(
//             `https://api.atlassian.com/ex/jira/${cloud_id}/rest/api/3/project/search`,
//             {
//                 headers: {
//                     Authorization: `Basic ${Buffer.from(`${email}:${access_token}`).toString('base64')}`
//                 },
//                 params: {
//                     startAt: start_at,
//                     maxResults: 100,
//                     status: "live"
//                 }
//             }
//         );
//         const { values, total: response_total } = response.data;
//         if (Array.isArray(values)) {
//             all_projects.push(...values);
//         }
//         total = response_total;
//         start_at += 100;
//     } while (all_projects.length < total);

//     return all_projects.map((project: any) => ({
//         label: project.name,
//         value: project.key
//     }));
// }