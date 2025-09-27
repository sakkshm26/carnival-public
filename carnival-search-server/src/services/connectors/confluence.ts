import axios, { AxiosResponse } from "axios";
import { config } from "../../providers/config";
// import { DB } from "../../db";
// import { connector_table, document_chunk_table, document_table } from "../../db/schema";
// import { eq } from "drizzle-orm";
// import { text_splitter } from "../../langchain";
// import { Connector } from "../../db_types";
// import { ConfluenceConnectorCredentialsData, ConfluenceConnectorAdditionalData } from "../../types";
// import { VectorQueueService } from "../vector_queue.service";
// import dayjs from "dayjs";
// import { Job } from "bullmq";
// import https from "https";
// import { convert, HtmlToTextOptions } from 'html-to-text';
// import * as cheerio from 'cheerio';

export const fetchConfluenceAccessToken = async (DTO: { code: string }) => {
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

    return {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
    }
};

// interface ConfluenceUser {
//     userId: string;
//     displayName: string;
//     email?: string;
// }

// const fetchAllConfluenceUsers = async (DTO: { 
//     cloud_id: string, 
//     email: string, 
//     access_token: string 
// }): Promise<Map<string, ConfluenceUser>> => {
//     const { cloud_id, email, access_token } = DTO;
    
//     const userMap = new Map<string, ConfluenceUser>();
//     let start = 0;
//     const limit = 200;
//     let hasMore = true;

//     while (hasMore) {
//         try {
//             const response = await axios.get(
//                 `https://api.atlassian.com/ex/confluence/${cloud_id}/wiki/rest/api/search/user`,
//                 {
//                     params: {
//                         cql: 'type=user',
//                         start: start,
//                         limit: limit
//                     },
//                     headers: {
//                         Authorization: `Basic ${Buffer.from(`${email}:${access_token}`).toString('base64')}`,
//                         Accept: 'application/json'
//                     },
//                     httpsAgent: new https.Agent({
//                         keepAlive: true
//                     }),
//                     timeout: 30000
//                 }
//             );

//             const users = response.data.results || [];
            
//             for (const user of users) {
//                 const userId = user?.user?.accountId;
//                 if (userId) {
//                     userMap.set(userId, {
//                         userId: userId,
//                         displayName: user?.user?.displayName || 'Unknown User'
//                     });
//                 }
//             }

//             hasMore = users.length === limit;
//             start += limit;
            
//         } catch (error) {
//             console.warn('Error fetching users from Confluence:', error);
//             break;
//         }
//     }
    
//     return userMap;
// };

// const extractContentFromConfluencePage = async (
//     html_content: string, 
//     userMap: Map<string, ConfluenceUser>
// ): Promise<string> => {
//     function removeMacroStylings($: cheerio.CheerioAPI): void {
//         $('ac\\:structured-macro').each((_, element) => {
//             const $element = $(element);
//             const $macroStyling = $element.find('ac\\:parameter[ac\\:name="page"]');
//             $macroStyling.remove();
//         });
//     }

//     function getUser(userId: string, userMap: Map<string, ConfluenceUser>): string {
//         const user = userMap.get(userId);
//         return user?.displayName || 'Unknown Confluence User';
//     }

//     function processUserMentions($: cheerio.CheerioAPI, userMap: Map<string, ConfluenceUser>): void {
//         const userElements = $('ri\\:user');

//         userElements.each((_, element) => {
//             const $element = $(element);
//             const userId = $element.attr('ri:account-id') || $element.attr('ri:userkey');

//             if (!userId) {
//                 console.warn('ri:userkey not found in ri:user element:', $element.attr());
//                 return;
//             }

//             const displayName = getUser(userId, userMap);
//             $element.replaceWith(`@${displayName}`);
//         });
//     }

//     function processLinkText($: cheerio.CheerioAPI): void {
//         $('ac\\:link-body').each((_, element) => {
//             const $element = $(element);
//             try {
//                 const textFromLink = $element.text();
//                 $element.replaceWith(`(LINK TEXT: ${textFromLink})`);
//             } catch (error) {
//                 console.warn(`Error processing ac:link-body: ${error}`);
//             }
//         });
//     }

//     function stripExcessiveNewlinesAndSpaces(text: string): string {
//         let cleaned = text.replace(/\n{3,}/g, '\n\n');

//         cleaned = cleaned.replace(/ {2,}/g, ' ');

//         cleaned = cleaned.replace(/ +\n/g, '\n');

//         cleaned = cleaned.replace(/[ \t]+$/gm, '');

//         cleaned = cleaned.trim();

//         return cleaned;
//     }

//     function formatDocumentSoup(html: string): string {
//         const options: HtmlToTextOptions = {
//             preserveNewlines: false,

//             wordwrap: false,

//             selectors: [
//                 {
//                     selector: 'h1',
//                     format: 'heading',
//                     options: {
//                         leadingLineBreaks: 1,
//                         trailingLineBreaks: 1
//                     }
//                 },
//                 {
//                     selector: 'h2',
//                     format: 'heading',
//                     options: {
//                         leadingLineBreaks: 1,
//                         trailingLineBreaks: 1
//                     }
//                 },
//                 {
//                     selector: 'h3',
//                     format: 'heading',
//                     options: {
//                         leadingLineBreaks: 1,
//                         trailingLineBreaks: 1
//                     }
//                 },
//                 {
//                     selector: 'h4',
//                     format: 'heading',
//                     options: {
//                         leadingLineBreaks: 1,
//                         trailingLineBreaks: 1
//                     }
//                 },
//                 {
//                     selector: 'h5',
//                     format: 'heading',
//                     options: {
//                         leadingLineBreaks: 1,
//                         trailingLineBreaks: 1
//                     }
//                 },
//                 {
//                     selector: 'h6',
//                     format: 'heading',
//                     options: {
//                         leadingLineBreaks: 1,
//                         trailingLineBreaks: 1
//                     }
//                 },

//                 {
//                     selector: 'p',
//                     format: 'paragraph',
//                     options: {
//                         leadingLineBreaks: 1,
//                         trailingLineBreaks: 1
//                     }
//                 },
//                 {
//                     selector: 'div',
//                     format: 'paragraph',
//                     options: {
//                         leadingLineBreaks: 1,
//                         trailingLineBreaks: 1
//                     }
//                 },

//                 {
//                     selector: 'br',
//                     format: 'lineBreak'
//                 },

//                 {
//                     selector: 'li',
//                     format: 'listItem',
//                     options: {
//                         leadingLineBreaks: 1,
//                         trailingLineBreaks: 0
//                     }
//                 },

//                 {
//                     selector: 'pre',
//                     format: 'pre',
//                     options: {
//                         leadingLineBreaks: 1,
//                         trailingLineBreaks: 1
//                     }
//                 },

//                 {
//                     selector: 'table',
//                     format: 'table',
//                     options: {
//                         uppercaseHeaderCells: false
//                     }
//                 },

//                 {
//                     selector: 'a',
//                     format: 'anchor',
//                     options: {
//                         hideLinkHrefIfSameAsText: true,
//                         ignoreHref: false
//                     }
//                 }
//             ],

//             formatters: {
//                 listItem: (elem, walk, builder, formatOptions) => {
//                     builder.openBlock({ leadingLineBreaks: formatOptions.leadingLineBreaks || 1 });
//                     builder.addInline('- ');
//                     walk(elem.children, builder);
//                     builder.closeBlock({ trailingLineBreaks: formatOptions.trailingLineBreaks || 0 });
//                 },

//                 heading: (elem, walk, builder, formatOptions) => {
//                     builder.openBlock({ leadingLineBreaks: formatOptions.leadingLineBreaks || 1 });
//                     walk(elem.children, builder);
//                     builder.closeBlock({ trailingLineBreaks: formatOptions.trailingLineBreaks || 1 });
//                 }
//             }
//         };

//         const text = convert(html, options);
//         return stripExcessiveNewlinesAndSpaces(text);
//     }

//     function extractTextFromConfluenceHtml(
//         html_content: string,
//         userMap: Map<string, ConfluenceUser>
//     ): string {
//         const objectHtml = html_content

//         if (!objectHtml) {
//             return '';
//         }

//         const $ = cheerio.load(objectHtml);

//         removeMacroStylings($);

//         processUserMentions($, userMap);

//         processLinkText($);

//         const cleanedHtml = $.html();
//         return formatDocumentSoup(cleanedHtml);
//     }

//     let result = extractTextFromConfluenceHtml(html_content, userMap);

//     return result;
// };

// export const initialIndexConfluence = async (DTO: { connector_id: string, now_date: Date, job?: Job }) => {
//     const { connector_id, now_date, job } = DTO;

//     const now_date_formatted = dayjs(now_date).format("YYYY-MM-DD HH:mm");

//     const connector: Connector & {
//         credentials_data: ConfluenceConnectorCredentialsData,
//         additional_data: ConfluenceConnectorAdditionalData
//     } = (await DB.select().from(connector_table).where(eq(connector_table.id, connector_id)))[0] as any;

//     if (!connector) {
//         throw new Error(`Connector with ${connector_id} not found`);
//     }

//     // Get cloud ID
//     const cloud_id_response = await axios.get(`${connector.credentials_data.base_url}/_edge/tenant_info`);
//     const cloud_id = cloud_id_response.data.cloudId;

//     // Fetch all users upfront
//     console.log('Fetching all Confluence users...');
//     const userMap = await fetchAllConfluenceUsers({
//         cloud_id: cloud_id,
//         email: connector.credentials_data.email,
//         access_token: connector.credentials_data.access_token
//     });

//     console.log("user map ---->", userMap)

//     let has_more_pages = true;
//     let start_at = 0;
//     const limit = 50;

//     while (has_more_pages) {
//         if (job) {
//             await job.extendLock(job.token ?? "", 60000);
//         }

//         let cql = `lastModified < '${now_date_formatted}' and type = page`;
//         if (connector.additional_data?.space_keys?.length) {
//             const spaceKeysFilter = connector.additional_data.space_keys.map((key) => `space = '${key}'`).join(" OR ");
//             cql += ` AND (${spaceKeysFilter})`;
//         }

//         const response: AxiosResponse<any, any> = await axios.get(`https://api.atlassian.com/ex/confluence/${cloud_id}/rest/api/content/search`, {
//             params: {
//                 cql: cql,
//                 limit: limit,
//                 start: start_at,
//                 expand: 'body.storage.value,space,version,history.lastUpdated'
//             },
//             headers: {
//                 Authorization: `Basic ${Buffer.from(`${connector.credentials_data.email}:${connector.credentials_data.access_token}`).toString('base64')}`,
//                 Accept: 'application/json'
//             },
//             httpsAgent: new https.Agent({
//                 keepAlive: true
//             }),
//             timeout: 60000
//         });

//         if (!response.data.results || response.data.results.length === 0) {
//             has_more_pages = false;
//             break;
//         }

//         if (response.data.results.length < limit) {
//             has_more_pages = false;
//         }

//         for (const page of response.data.results) {
//             const page_link = `${connector.credentials_data.base_url}/wiki${page._links.webui}`;

//             const storage_value = page?.body?.storage?.value;

//             if (storage_value?.length) {
//                 console.log("page ---->", page.title)
//                 const content_text = await extractContentFromConfluencePage(storage_value, userMap);
//                 console.log("content_text ---->", content_text)
//                 /* let page_content = `${page.title}`;
//                 if (content_text) {
//                     page_content += ` ${content_text}`;
//                 }

//                 let metadata: any = {
//                     id: page.id,
//                     title: page.title,
//                     type: page.type,
//                     space_key: page.space?.key,
//                     space_name: page.space?.name,
//                     status: page.status,
//                     created_at: page.history?.createdDate || page.version?.when,
//                     updated_at: page.version?.when,
//                     version_number: page.version?.number,
//                     created_by: page.history?.createdBy?.displayName || page.version?.by?.displayName,
//                     updated_by: page.version?.by?.displayName,
//                 };

//                 if (page.ancestors && page.ancestors.length > 0) {
//                     metadata.ancestors = page.ancestors.map((ancestor: any) => ({
//                         id: ancestor.id,
//                         title: ancestor.title
//                     }));
//                 }

//                 metadata = Object.fromEntries(Object.entries(metadata).filter(([_, value]) => value !== undefined));

//                 page_content += `\n ${Object.entries(metadata).map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`).join(", ")}`;

//                 const document = (await DB.insert(document_table).values({
//                     fk_document_org: connector.fk_connector_org,
//                     fk_document_connector: connector.id,
//                     link: page_link,
//                     metadata
//                 }).returning())[0];

//                 const chunks = await text_splitter.splitText(page_content);

//                 await Promise.all(chunks.map(async (chunk, index) => {
//                     await DB.insert(document_chunk_table).values({
//                         fk_chunk_org: connector.fk_connector_org,
//                         fk_chunk_connector: connector.id,
//                         fk_chunk_document: document.id,
//                         chunk_index: index
//                     });

//                     await VectorQueueService.addVectorEntity({
//                         org_id: connector.fk_connector_org,
//                         connector_id: connector.id,
//                         document_id: document.id,
//                         title: page.title,
//                         chunk_content: chunk,
//                         chunk_index: index
//                     });
//                 })); */
//             }
//         }

//         start_at += limit;
//     }
// };

// export const reindexConfluence = async (DTO: { connector_id: string, now_date: Date }) => {
    
// };

// export const getConfluenceSpaces = async (DTO: { base_url: string, email: string, access_token: string }) => {
//     const { base_url, email, access_token } = DTO;

//     const cloud_id_response = await axios.get(`${base_url}/_edge/tenant_info`);
//     const cloud_id = cloud_id_response.data.cloudId;

//     let all_spaces: any[] = [];
//     let cursor: string | null = null;
//     let has_more = true;

//     while (has_more) {
//         const params: any = {
//             limit: 200,
//         };
        
//         if (cursor) {
//             params.cursor = cursor;
//         }

//         const response = await axios.get(
//             `https://api.atlassian.com/ex/confluence/${cloud_id}/wiki/api/v2/spaces`,
//             {
//                 headers: {
//                     Authorization: `Basic ${Buffer.from(`${email}:${access_token}`).toString('base64')}`
//                 },
//                 params
//             }
//         );
        
//         const { results, _links } = response.data;
//         if (Array.isArray(results)) {
//             all_spaces.push(...results);
//         }
        
//         if (_links?.next) {
//             const nextUrl = new URL(_links.next, _links.base);
//             cursor = nextUrl.searchParams.get('cursor');
//         } else {
//             has_more = false;
//         }
//     }

//     return all_spaces.map((space: any) => ({
//         label: space.name,
//         value: space.key
//     }));
// }