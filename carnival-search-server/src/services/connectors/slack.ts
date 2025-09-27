import axios from "axios";
import { DB } from "../../db";
import { AppType, connector_table, document_chunk_table, document_table, DocumentType, SyncStatus } from "../../db/schema";
import { config } from "../../providers/config";
import { eq, and } from "drizzle-orm";
import { text_splitter } from "../../langchain";
import { Connector } from "../../db_types";
import { add_vector_entity_queue, delete_vector_entity_queue } from "../../providers/queues";
import { jsonExtract } from "../../utils";
import { VectorQueueService } from "../vector_queue.service";

// export const DISALLOWED_MESSAGE_TYPES = [
//     "channel_leave",
//     "channel_archive",
//     "channel_unarchive",
//     "pinned_item",
//     "unpinned_item",
//     "ekm_access_denied",
//     "channel_posting_permissions",
//     "group_join",
//     "group_leave",
//     "group_archive",
//     "group_unarchive",
//     "channel_leave",
//     "channel_name",
//     "channel_join"
// ]

export const fetchSlackAccessToken = async (DTO: { code: string }) => {
    const { code } = DTO;

    const form_data = new FormData();
    form_data.append("code", code);
    form_data.append("client_id", config.slack_client_id);
    form_data.append("client_secret", config.slack_client_secret);
    form_data.append("redirect_uri", config.slack_redirect_uri);
    form_data.append("grant_type", "authorization_code");

    const response = await axios.post("https://slack.com/api/oauth.v2.access", form_data);

    if (!response.data.ok) {
        throw new Error("Failed to fetch slack access token");
    }

    return { user_access_token: response.data.authed_user.access_token }
}

// const cleanSlackText = (text: string, users: { id: string; name: string }[], channels: { id: string; name: string }[], bots: { id: string; name: string }[]) => {
//     let cleaned_text = text.replace(/[\n\r\t]/g, ' ');
//     cleaned_text = cleaned_text.replace(/\s+/g, ' ');
//     cleaned_text = cleaned_text.trim();

//     // replace user id
//     cleaned_text = cleaned_text.replace(/<@(.*?)>/g, (match, id) => {
//         const user = users.find(u => u.id === id);
//         if (user) {
//             return `@${user.name}`;
//         } else {
//             const bot = bots.find(b => b.id === id);
//             return bot ? `@${bot.name}` : match;
//         }
//     });

//     // replace channel id
//     cleaned_text = cleaned_text.replace(/<#(.*?)\|(.*?)>/g, (match, channel_id, _) => {
//         const channel = channels.find(c => c.id === channel_id);
//         return channel ? `#${channel.name}` : match;
//     });

//     cleaned_text = cleaned_text.replace("<!here>", "@here");
//     cleaned_text = cleaned_text.replace("<!channel>", "@channel");

//     return cleaned_text;
// }

// export const initialIndexSlack = async (DTO: { connector_id: string, now_date: Date }) => {
//     /* const { connector_id, now_date } = DTO;

//     const connector: Connector & { credentials_data: SlackConnectorCredentialsData, additional_data: SlackConnectorAdditionalData } = (await DB.select().from(connector_table).where(eq(connector_table.id, connector_id)))[0] as any;

//     if (!connector) {
//         throw new Error(`Connector with ${connector_id} not found`);
//     }

//     const team_info_response = await axios.get("https://slack.com/api/team.info", {
//         headers: {
//             Authorization: `Bearer ${connector.credentials_data.user_access_token}`,
//         }
//     })

//     if (!team_info_response.data.ok) {
//         return;
//     }

//     let workspace_bots: { id: string, name: string }[] = [];
//     let workspace_users: { id: string, name: string, updated: number }[] = [];
//     let users_cursor = null;
//     let users_has_more = true;

//     while (users_has_more) {
//         let users_url = "https://slack.com/api/users.list?limit=200";
//         if (users_cursor) {
//             users_url += `&cursor=${users_cursor}`;
//         }

//         const users_response = await axios.get(users_url, {
//             headers: {
//                 Authorization: `Bearer ${connector.credentials_data.user_access_token}`,
//             }
//         });

//         if (users_response.data.ok) {
//             const filtered_users = users_response.data.members
//                 .filter((user: any) => user.name !== "slackbot" && user.is_bot === false)
//                 .map((user: any) => ({
//                     id: user.id,
//                     name: user.profile.real_name,
//                     updated: user.updated
//                 }));

//             const filtered_bots = users_response.data.members
//                 .filter((user: any) => user.is_bot === true)
//                 .map((user: any) => ({
//                     id: user.id,
//                     name: user.profile.real_name
//                 }));

//             workspace_bots = [...workspace_bots, ...filtered_bots];

//             workspace_users = [...workspace_users, ...filtered_users];
//         }

//         users_has_more = users_response.data.response_metadata?.next_cursor;
//         users_cursor = users_response.data.response_metadata?.next_cursor;
//     }

//     let workspace_channels: { id: string, name: string }[] = [];
//     let all_channels: { id: string, name: string }[] = [];
//     let channels_cursor = null;
//     let channels_has_more = true;

//     while (channels_has_more) {
//         let channels_url = "https://slack.com/api/conversations.list?limit=500&types=public_channel,private_channel";
//         if (channels_cursor) {
//             channels_url += `&cursor=${channels_cursor}`;
//         }

//         const channels_response = await axios.get(channels_url, {
//             headers: {
//                 Authorization: `Bearer ${connector.credentials_data.user_access_token}`,
//             },
//         });

//         if (channels_response.data.ok) {
//             let mapped_channels = channels_response.data.channels.map((channel: any) => ({
//                 id: channel.id,
//                 name: channel.name,
//                 updated: channel.updated
//             }));

//             all_channels = [...all_channels, ...mapped_channels];

//             if (connector.additional_data?.channel_ids?.length) {
//                 mapped_channels = mapped_channels.filter((channel: any) => connector.additional_data!.channel_ids!.includes(channel.id));
//             }

//             workspace_channels = [...workspace_channels, ...mapped_channels];
//         }

//         channels_has_more = channels_response.data.response_metadata?.next_cursor;
//         channels_cursor = channels_response.data.response_metadata?.next_cursor;
//     }

//     const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

//     let now_time = Date.now();

//     if (workspace_channels.length > 0) {
//         for (const channel of workspace_channels) {
//             let messages_cursor = null;
//             let messages_has_more = true;
//             while (messages_has_more) {
//                 const elapsed_time = Date.now() - now_time;
//                 if (elapsed_time < 63000) {
//                     await sleep(63000 - elapsed_time);
//                     now_time = Date.now();
//                 }
//                 let messages_url = `https://slack.com/api/conversations.history?channel=${channel.id}&limit=15&oldest=0&latest=${Math.floor(now_date.getTime() / 1000)}`;

//                 if (messages_cursor) {
//                     messages_url += `&cursor=${messages_cursor}`;
//                 }

//                 const messages_response = await axios.get(messages_url, {
//                     headers: {
//                         Authorization: `Bearer ${connector.credentials_data.user_access_token}`,
//                     },
//                 });

//                 if (messages_response.data.ok) {
//                     for (const message of messages_response.data.messages) {
//                         if (message.thread_ts) {
//                             let thread_messages_has_more = true;
//                             let thread_messages_cursor = null;

//                             while (thread_messages_has_more) {
//                                 const elapsed_time = Date.now() - now_time;
//                                 if (elapsed_time < 63000) {
//                                     await sleep(63000 - elapsed_time);
//                                     now_time = Date.now();
//                                 }
//                                 let thread_messages_url = `https://slack.com/api/conversations.replies?channel=${channel.id}&ts=${message.thread_ts}&limit=15`;
//                                 if (thread_messages_cursor) {
//                                     thread_messages_url += `&cursor=${thread_messages_cursor}`;
//                                 }

//                                 const thread_messages_response = await axios.get(thread_messages_url, {
//                                     headers: {
//                                         Authorization: `Bearer ${connector.credentials_data.user_access_token}`,
//                                     },
//                                 });

//                                 if (thread_messages_response.data.ok) {
//                                     for (const thread_message of thread_messages_response.data.messages) {
//                                         const sender_name = thread_message.bot_id ? workspace_bots.find(b => b.id === thread_message.user)?.name : workspace_users.find(u => u.id === thread_message.user)?.name;
//                                         if (sender_name) {
//                                             if (thread_message.type === "message" && !DISALLOWED_MESSAGE_TYPES.includes(thread_message.subtype) && thread_message.text) {
//                                                 const message_link = `${team_info_response.data.team.url}archives/${channel.id}/p${thread_message.ts}?thread_ts=${thread_message.thread_ts}`
    
//                                                 let clean_text = cleanSlackText(thread_message.text, workspace_users, all_channels, workspace_bots);
    
//                                                 let metadata: any = {
//                                                     ts: thread_message.ts,
//                                                     thread_ts: thread_message.thread_ts,
//                                                     sender: sender_name,
//                                                     channel: `#${channel.name}`
//                                                 }
    
//                                                 metadata = Object.fromEntries(Object.entries(metadata).filter(([_, value]) => value !== undefined));
    
//                                                 let message_content = `${clean_text} \n ${JSON.stringify(metadata)}`
    
//                                                 const document = (await DB.insert(document_table).values({
//                                                     fk_document_org: connector.fk_connector_org,
//                                                     fk_document_connector: connector.id,
//                                                     title: `${sender_name} · #${channel.name}`,
//                                                     link: message_link,
//                                                     metadata
//                                                 }).returning())[0]
    
//                                                 const chunks = await text_splitter.splitText(message_content);
    
//                                                 await Promise.all(chunks.map(async (chunk, index) => {
//                                                     await DB.insert(document_chunk_table).values({
//                                                         fk_chunk_org: connector.fk_connector_org,
//                                                         fk_chunk_connector: connector.id,
//                                                         fk_chunk_document: document.id,
//                                                         chunk_index: index,
//                                                     })
    
//                                                     await VectorQueueService.addVectorEntity({
//                                                         org_id: connector.fk_connector_org,
//                                                         connector_id: connector.id,
//                                                         document_id: document.id,
//                                                         title: clean_text,
//                                                         chunk_content: chunk,
//                                                         chunk_index: index
//                                                     })
//                                                 }))
//                                             }
//                                         }
//                                     }
//                                 }

//                                 thread_messages_has_more = thread_messages_response.data.has_more === true;
//                                 thread_messages_cursor = thread_messages_response.data.response_metadata?.next_cursor || null;
//                             }
//                         } else if (message.type === "message" && !DISALLOWED_MESSAGE_TYPES.includes(message.subtype) && message.text) {
//                             const sender_name = message.bot_id ? workspace_bots.find(b => b.id === message.user)?.name : workspace_users.find(u => u.id === message.user)?.name;
//                             if (sender_name) {
//                                 const message_link = `${team_info_response.data.team.url}archives/${channel.id}/p${message.ts}`;

//                                 let clean_text = cleanSlackText(message.text, workspace_users, all_channels, workspace_bots);
    
//                                 let metadata: any = {
//                                     ts: message.ts,
//                                     sender: sender_name,
//                                     channel: `#${channel.name}`
//                                 }
    
//                                 metadata = Object.fromEntries(Object.entries(metadata).filter(([_, value]) => value !== undefined));
    
//                                 let message_content = `${clean_text} \n ${JSON.stringify(metadata)}`
    
//                                 const document = (await DB.insert(document_table).values({
//                                     fk_document_org: connector.fk_connector_org,
//                                     fk_document_connector: connector.id,
//                                     title: `${sender_name} · #${channel.name}`,
//                                     link: message_link,
//                                     metadata
//                                 }).returning())[0]
    
//                                 const chunks = await text_splitter.splitText(message_content);
    
//                                 await Promise.all(chunks.map(async (chunk, index) => {
//                                     await DB.insert(document_chunk_table).values({
//                                         fk_chunk_org: connector.fk_connector_org,
//                                         fk_chunk_connector: connector.id,
//                                         fk_chunk_document: document.id,
//                                         chunk_index: index,
//                                     })
    
//                                     await VectorQueueService.addVectorEntity({
//                                         org_id: connector.fk_connector_org,
//                                         connector_id: connector.id,
//                                         document_id: document.id,
//                                         title: clean_text,
//                                         chunk_content: chunk,
//                                         chunk_index: index
//                                     })
//                                 }))
//                             }
//                         }
//                     }
//                 }

//                 messages_has_more = messages_response.data.has_more === true;
//                 messages_cursor = messages_response.data.response_metadata?.next_cursor || null;
//             }
//         }
//     } */

// }

// export const reindexSlack = async (DTO: { connector_id: string, now_date: Date }) => {
//     // const { connector_id, now_date } = DTO;

//     // const connector: Connector & { credentials_data: SlackConnectorCredentialsData, additional_data: SlackConnectorAdditionalData } = (await DB.select().from(connector_table).where(eq(connector_table.id, connector_id)))[0] as any;

//     // let channel_ids: string[] = [];

//     // if (connector.additional_data) {
//     //     channel_ids = connector.additional_data.channel_ids || [];
//     // }

//     // if (!connector) {
//     //     throw new Error(`Connector with ${connector_id} not found`);
//     // }

//     // const team_info_response = await axios.get("https://slack.com/api/team.info", {
//     //     headers: {
//     //         Authorization: `Bearer ${connector.credentials_data.user_access_token}`,
//     //     }
//     // });

//     // if (!team_info_response.data.ok) {
//     //     return;
//     // }

//     // let workspace_bots: { id: string, name: string }[] = [];
//     // let workspace_users: { id: string, name: string, updated: number }[] = [];
//     // let users_cursor = null;
//     // let users_has_more = true;

//     // while (users_has_more) {
//     //     let users_url = "https://slack.com/api/users.list?limit=200";
//     //     if (users_cursor) {
//     //         users_url += `&cursor=${users_cursor}`;
//     //     }

//     //     const users_response = await axios.get(users_url, {
//     //         headers: {
//     //             Authorization: `Bearer ${connector.credentials_data.user_access_token}`,
//     //         }
//     //     });

//     //     if (users_response.data.ok) {
//     //         const filtered_users = users_response.data.members
//     //             .filter((user: any) => user.name !== "slackbot" && user.is_bot === false)
//     //             .map((user: any) => ({
//     //                 id: user.id,
//     //                 name: user.profile.real_name,
//     //                 updated: user.updated
//     //             }));

//     //         const filtered_bots = users_response.data.members
//     //             .filter((user: any) => user.is_bot === true)
//     //             .map((user: any) => ({
//     //                 id: user.id,
//     //                 name: user.profile.real_name
//     //             }));

//     //         workspace_bots = [...workspace_bots, ...filtered_bots];

//     //         workspace_users = [...workspace_users, ...filtered_users];
//     //     }

//     //     users_has_more = users_response.data.response_metadata?.next_cursor;
//     //     users_cursor = users_response.data.response_metadata?.next_cursor;
//     // }

//     // let workspace_channels: { id: string, name: string, updated: number }[] = [];
//     // let channels_cursor = null;
//     // let channels_has_more = true;

//     // while (channels_has_more) {
//     //     let channels_url = "https://slack.com/api/conversations.list?limit=200&types=public_channel,private_channel";
//     //     if (channels_cursor) {
//     //         channels_url += `&cursor=${channels_cursor}`;
//     //     }

//     //     const channels_response = await axios.get(channels_url, {
//     //         headers: {
//     //             Authorization: `Bearer ${connector.credentials_data.user_access_token}`,
//     //         },
//     //     });

//     //     if (channels_response.data.ok) {
//     //         let mapped_channels = channels_response.data.channels.map((channel: any) => ({
//     //             id: channel.id,
//     //             name: channel.name,
//     //             updated: channel.updated
//     //         }));

//     //         if (channel_ids.length) {
//     //             mapped_channels = mapped_channels.filter((channel: any) => channel_ids.includes(channel.id));
//     //         }

//     //         workspace_channels = [...workspace_channels, ...mapped_channels];
//     //     }

//     //     channels_has_more = channels_response.data.response_metadata?.next_cursor;
//     //     channels_cursor = channels_response.data.response_metadata?.next_cursor;
//     // }

//     // // Handle new messages (created after last_synced_at and before now_date)
//     // for (const channel of workspace_channels) {
//     //     let messages_cursor = null;
//     //     let messages_has_more = true;
//     //     while (messages_has_more) {
//     //         let messages_url = `https://slack.com/api/conversations.history?channel=${channel.id}&limit=200&oldest=${Math.floor(connector.last_synced_at.getTime() / 1000)}&latest=${Math.floor(now_date.getTime() / 1000)}`;

//     //         if (messages_cursor) {
//     //             messages_url += `&cursor=${messages_cursor}`;
//     //         }

//     //         const messages_response = await axios.get(messages_url, {
//     //             headers: {
//     //                 Authorization: `Bearer ${connector.credentials_data.user_access_token}`,
//     //             },
//     //         });

//     //         if (messages_response.data.ok) {
//     //             for (const message of messages_response.data.messages) {
//     //                 if (message.thread_ts) {
//     //                     let thread_messages_has_more = true;
//     //                     let thread_messages_cursor = null;

//     //                     while (thread_messages_has_more) {
//     //                         let thread_messages_url = `https://slack.com/api/conversations.replies?channel=${channel.id}&ts=${message.thread_ts}&limit=200`;
//     //                         if (thread_messages_cursor) {
//     //                             thread_messages_url += `&cursor=${thread_messages_cursor}`;
//     //                         }

//     //                         const thread_messages_response = await axios.get(thread_messages_url, {
//     //                             headers: {
//     //                                 Authorization: `Bearer ${connector.credentials_data.user_access_token}`,
//     //                             },
//     //                         });

//     //                         if (thread_messages_response.data.ok) {
//     //                             for (const thread_message of thread_messages_response.data.messages) {
//     //                                 const sender_name = thread_message.bot_id ? workspace_bots.find(b => b.id === thread_message.user)?.name : workspace_users.find(u => u.id === thread_message.user)?.name;
//     //                                 if (thread_message.type === "message" && !DISALLOWED_MESSAGE_TYPES.includes(thread_message.subtype) && thread_message.text) {
//     //                                     const message_content = cleanSlackText(thread_message.text, workspace_users, workspace_channels, workspace_bots);
//     //                                     const message_link = `${team_info_response.data.team.url}archives/${channel.id}/p${thread_message.ts}?thread_ts=${thread_message.thread_ts}`

//     //                                     const document = (await DB.insert(document_table).values({
//     //                                         fk_document_org: connector.fk_connector_org,
//     //                                         fk_document_connector: connector.id,
//     //                                         title: `${sender_name} - #${channel.name}`,
//     //                                         link: message_link,
//     //                                         type: DocumentType.MESSAGE,
//     //                                         metadata: {
//     //                                             sender_user_id: thread_message.user,
//     //                                             channel_id: channel.id,
//     //                                             ts: thread_message.ts,
//     //                                             thread_ts: thread_message.thread_ts
//     //                                         }
//     //                                     }).returning())[0]

//     //                                     const chunks = await text_splitter.splitText(message_content);

//     //                                     await Promise.all(chunks.map(async (chunk, index) => {
//     //                                         await DB.insert(document_chunk_table).values({
//     //                                             fk_chunk_org: connector.fk_connector_org,
//     //                                             fk_chunk_document: document.id,
//     //                                             chunk_index: index,
//     //                                             content: chunk
//     //                                         })

//     //                                         await add_vector_entity_queue.add("add", {
//     //                                             org_id: connector.fk_connector_org,
//     //                                             document_id: document.id,
//     //                                             connector_id: connector.id,
//     //                                             chunk,
//     //                                             chunk_index: index
//     //                                         })
//     //                                     }))
//     //                                 }
//     //                             }
//     //                         }

//     //                         thread_messages_has_more = thread_messages_response.data.has_more === true;
//     //                         thread_messages_cursor = thread_messages_response.data.response_metadata?.next_cursor || null;
//     //                     }
//     //                 } else if (message.type === "message" && !DISALLOWED_MESSAGE_TYPES.includes(message.subtype) && message.text) {
//     //                     const message_content = cleanSlackText(message.text, workspace_users, workspace_channels, workspace_bots);
//     //                     const message_link = `${team_info_response.data.team.url}archives/${channel.id}/p${message.ts}`;

//     //                     const sender_name = message.bot_id ? workspace_bots.find(b => b.id === message.user)?.name : workspace_users.find(u => u.id === message.user)?.name;

//     //                     const document = (await DB.insert(document_table).values({
//     //                         fk_document_org: connector.fk_connector_org,
//     //                         fk_document_connector: connector.id,
//     //                         title: `${sender_name} - #${channel.name}`,
//     //                         link: message_link,
//     //                         type: DocumentType.MESSAGE,
//     //                         metadata: {
//     //                             sender_user_id: message.user,
//     //                             channel_id: channel.id,
//     //                             ts: message.ts,
//     //                         }
//     //                     }).returning())[0]

//     //                     const chunks = await text_splitter.splitText(message_content);

//     //                     await Promise.all(chunks.map(async (chunk, index) => {
//     //                         await DB.insert(document_chunk_table).values({
//     //                             fk_chunk_org: connector.fk_connector_org,
//     //                             fk_chunk_document: document.id,
//     //                             chunk_index: index,
//     //                             content: chunk
//     //                         })

//     //                         add_vector_entity_queue.add("add", {
//     //                             org_id: connector.fk_connector_org,
//     //                             document_id: document.id,
//     //                             connector_id: connector.id,
//     //                             chunk,
//     //                             chunk_index: index
//     //                         })
//     //                     }))
//     //                 }
//     //             }
//     //         }

//     //         messages_has_more = messages_response.data.has_more === true;
//     //         messages_cursor = messages_response.data.response_metadata?.next_cursor || null;
//     //     }
//     // }
// }

// export const getSlackChannels = async (DTO: { user_access_token: string }) => {
//     const { user_access_token } = DTO;

//     let workspace_channels: { id: string, name: string, }[] = [];
//     let channels_cursor = null;
//     let channels_has_more = true;

//     while (channels_has_more) {
//         let channels_url = "https://slack.com/api/conversations.list?limit=200&types=public_channel,private_channel";
//         if (channels_cursor) {
//             channels_url += `&cursor=${channels_cursor}`;
//         }

//         const channels_response = await axios.get(channels_url, {
//             headers: {
//                 Authorization: `Bearer ${user_access_token}`,
//             },
//         });

//         if (channels_response.data.ok) {
//             const mapped_channels: { id: string, name: string }[] = channels_response.data.channels.map((channel: any) => ({
//                 id: channel.id,
//                 name: channel.name,
//             }));

//             workspace_channels = [...workspace_channels, ...mapped_channels];
//         }

//         channels_has_more = channels_response.data.response_metadata?.next_cursor;
//         channels_cursor = channels_response.data.response_metadata?.next_cursor;
//     }

//     return workspace_channels;
// }