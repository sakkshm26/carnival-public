import axios, { spread } from "axios";
import { config } from "../../providers/config";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { drive_v3, google } from "googleapis";
import { GaxiosResponse, OAuth2Client } from "googleapis-common";
import { DB } from "../../db";
import { AppType, connector_table, document_chunk_table, document_table, DocumentType, SyncStatus } from "../../db/schema";
import { eq, and } from "drizzle-orm";
import { cleanTextForEmbeddings, jsonExtract } from "../../utils";
import mammoth from "mammoth";
import XLSX from "xlsx";
import { text_splitter } from "../../langchain";
import dayjs from "dayjs";
import { Connector } from "../../db_types";
import { add_vector_entity_queue, delete_vector_entity_queue } from "../../providers/queues";

export enum GOOGLE_MIME_TYPES {
    DOCUMENT = "application/vnd.google-apps.document",
    MS_WORD = "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    SPREADSHEET = "application/vnd.google-apps.spreadsheet",
    MS_SPREADSHEET = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    PRESENTATION = "application/vnd.google-apps.presentation",
    MS_PRESENTATION = "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    FOLDER = "application/vnd.google-apps.folder",
    PDF = "application/pdf",
    TEXT = "text/plain",
    MARKDOWN = "text/markdown",
    CSV = "text/csv"
}

export const fetchGoogleAccessToken = async (DTO: { code: string }) => {
    const { code } = DTO;

    const form_data = new FormData();
    form_data.append("code", code);
    form_data.append("client_id", config.google_client_id);
    form_data.append("client_secret", config.google_client_secret);
    form_data.append("redirect_uri", config.google_redirect_uri);
    form_data.append("grant_type", "authorization_code");

    const response = await axios.post("https://oauth2.googleapis.com/token", form_data);

    return { access_token: response.data.access_token, refresh_token: response.data.refresh_token }
}

export const getFileContent = async (DTO: { file: drive_v3.Schema$File, drive: drive_v3.Drive, auth: OAuth2Client }): Promise<string | null> => {
    const { file, drive, auth } = DTO;

    if (!file.id) {
        return null;
    }

    let document_text: string | null = null;

    if (file.mimeType === GOOGLE_MIME_TYPES.DOCUMENT) {
        const response = await drive.files.export({
            fileId: file.id,
            mimeType: 'text/plain'
        }, {
            responseType: 'text'
        });

        if (response.data) {
            document_text = cleanTextForEmbeddings(response.data as string);
        }
    } else if (file.mimeType === GOOGLE_MIME_TYPES.MS_WORD) {
        const response = await drive.files.get({
            fileId: file.id,
            alt: 'media'
        }, {
            responseType: 'arraybuffer'
        });
        const buffer = Buffer.from(response.data as ArrayBuffer);
        const result = await mammoth.extractRawText({ buffer });
        if (result.value) {
            document_text = cleanTextForEmbeddings(result.value);
        }
    } else if (file.mimeType === GOOGLE_MIME_TYPES.SPREADSHEET) {
        const sheets = google.sheets({ version: "v4", auth });
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId: file.id,
            fields: 'sheets.properties',
        });
        const text_content: string[] = [];
        if (spreadsheet.data.sheets) {
            for (const sheet of spreadsheet.data.sheets) {
                const sheet_name = sheet.properties?.title;
                if (!sheet_name) continue;
                const response = await sheets.spreadsheets.values.get({
                    spreadsheetId: file.id,
                    range: sheet_name,
                });
                const rows = response.data.values || [];
                const rows_text = rows.filter(row => row.length).map(row => {
                    return row.map(cell => cell !== null && cell !== undefined ? String(cell) : '').join(',');
                });

                const sheet_text = rows_text.join('\n');
                text_content.push(sheet_text);
            }
        }
        if (text_content.length) {
            document_text = text_content.join("\n\n===== SHEET SEPARATOR =====\n\n");
        }
    } else if (file.mimeType === GOOGLE_MIME_TYPES.MS_SPREADSHEET) {
        const response = await drive.files.get({
            fileId: file.id,
            alt: "media"
        }, { responseType: "arraybuffer" });

        const buffer = Buffer.from(response.data as ArrayBuffer);
        const workbook = XLSX.read(buffer, { type: 'buffer' });

        const textContent: string[] = [];

        workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const data: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            const rowsText = data
                .filter(row => !(!row || row.length === 0 || row.every(cell => cell === undefined || cell === null || cell === '')))
                .map(row => {
                    return row.map(cell =>
                        cell !== null && cell !== undefined ? String(cell) : ''
                    ).join(',');
                });

            const sheetText = rowsText.join('\n');
            textContent.push(sheetText);
        });

        if (textContent.length) {
            document_text = textContent.join("\n\n===== SHEET SEPARATOR =====\n\n");
        }
    } else if (file.mimeType === GOOGLE_MIME_TYPES.TEXT) {
        const response = await drive.files.get(
            {
                fileId: file.id,
                alt: 'media',
            },
            {
                responseType: 'text',
            }
        );

        if (response.data) {
            let formatted_text = cleanTextForEmbeddings(response.data as string);
            if (formatted_text) {
                document_text = formatted_text;
            }
        }
    } else if (file.mimeType === GOOGLE_MIME_TYPES.CSV) {
        const response = await drive.files.get(
            {
                fileId: file.id,
                alt: 'media',
            },
            {
                responseType: 'text',
            }
        );

        if (response.data) {
            const csvRows = (response.data as string).split('\n');
            const rowsText = csvRows
                .filter(row => {
                    const trimmedRow = row.trim();
                    if (trimmedRow === '') return false;

                    const cells = trimmedRow.split(',');
                    const allCellsEmpty = cells.every(cell => cell.trim() === '');
                    return !allCellsEmpty;
                })
                .map(row => {
                    return row.trim();
                });
            const textContent = [rowsText.join('\n')];
            document_text = textContent.join('');
        }
    } else if (file.mimeType === GOOGLE_MIME_TYPES.MARKDOWN) {
        const response = await drive.files.get(
            {
                fileId: file.id,
                alt: 'media',
            },
            {
                responseType: 'text',
            }
        );

        if (response.data) {
            document_text = cleanTextForEmbeddings(response.data as string);
        }
    }

    return document_text;
}

export const initialIndexGoogleDrive = async (DTO: { connector_id: string, now_date: Date }) => {
    /* const { connector_id, now_date, additional_data } = DTO;

    const { folder_ids }: { folder_ids?: string[] } = additional_data;

    const connector: Connector & { credentials_data: GoogleDriveConnectorCredentialsData } = (await DB.select().from(connector_table).where(eq(connector_table.id, connector_id)))[0] as any;

    if (!connector) {
        throw new Error(`Connector with ${connector_id} not found`);
    }

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: connector.credentials_data.access_token });

    const drive = google.drive({ version: 'v3', auth });

    let page_token = null;
    let has_more_pages = true;

    let unique_users: { id: string, email: string, display_name: string }[] = [];
    let folders: { id: string, name: string }[] = [];

    if (folder_ids && folder_ids.length > 0) {
        const folderPromises = folder_ids.map(async (folderId) => {
            const response = await drive.files.get({
                fileId: folderId,
                fields: 'id, name'
            });
            return {
                id: response.data.id!,
                name: response.data.name!
            };
        });

        folders = await Promise.all(folderPromises);
    }

    while (has_more_pages) {
        let query = `trashed=false and 'me' in owners and createdTime < '${now_date.toISOString()}'`;

        if (folder_ids && folder_ids.length > 0) {
            const folderQuery = folder_ids.map(id => `'${id}' in parents`).join(' or ');
            query += ` and (${folderQuery})`;
        }

        const drive_response: GaxiosResponse<drive_v3.Schema$FileList> = await drive.files.list({
            q: query,
            includeItemsFromAllDrives: true,
            supportsAllDrives: true,
            pageSize: 100,
            pageToken: page_token || undefined,
            fields: "nextPageToken, files(id, name, webViewLink, mimeType, createdTime, modifiedTime, owners, description)"
        });

        if (!drive_response.data.files) {
            break;
        }

        for (const file of drive_response.data.files) {
            try {
                let document_text: string | null = null;

                if (file.id) {
                    document_text = await getFileContent({ file, drive, auth });

                    if (file.owners?.length) {
                        const owner = file.owners[0];
                        if (owner.emailAddress && !unique_users.some(user => user.email === owner.emailAddress)) {
                            unique_users.push({
                                id: owner.permissionId!,
                                email: owner.emailAddress!,
                                display_name: owner.displayName!
                            });
                        }
                    }

                    if (document_text) {
                        const created_document = (await DB.insert(document_table).values({
                            fk_document_org: connector.fk_connector_org,
                            fk_document_connector: connector.id,
                            title: file.name || "Untitled Document",
                            link: file.webViewLink,
                            type: DocumentType.FILE,
                            metadata: {
                                id: file.id,
                                mime_type: file.mimeType,
                                owner_email: file.owners ? file.owners[0].emailAddress : null,
                                created_at: new Date(file.createdTime!),
                                updated_at: new Date(file.modifiedTime!)
                            } as google_drive_file_metadata
                        }).returning())[0]

                        const chunks = await text_splitter.splitText(`${file.name} ${document_text}`);

                        await Promise.all(chunks.map(async (chunk, index) => {
                            await DB.insert(document_chunk_table).values({
                                fk_chunk_org: connector.fk_connector_org,
                                fk_chunk_document: created_document.id,
                                chunk_index: index,
                                content: chunk
                            })

                            await add_vector_entity_queue.add("add", {
                                org_id: connector.fk_connector_org,
                                document_id: created_document.id,
                                connector_id: connector.id,
                                chunk,
                                chunk_index: index
                            })
                        }))
                    }
                }

            } catch (err) {
                console.log(`Error processing document ${file.id}:`, err);
            }
        }

        page_token = drive_response.data.nextPageToken || null;
        has_more_pages = !!page_token;
    } */
}

const deleteDocumentChunks = async (DTO: { document_id: string }) => {
    const { document_id } = DTO;

    await DB.delete(document_chunk_table).where(eq(document_chunk_table.fk_chunk_document, document_id));

    await delete_vector_entity_queue.add("delete_from_document", {
        document_id
    })
}

// to implement refresh token

export const reindexGoogleDrive = async (DTO: { connector_id: string, now_date: Date }) => {
    /* const { connector_id, now_date } = DTO;

    const connector: Connector & { credentials_data: GoogleDriveConnectorCredentialsData, app_data: GoogleDriveConnectorAppData } = (await DB.select().from(connector_table).where(eq(connector_table.id, connector_id)))[0] as any;

    if (!connector) {
        throw new Error(`Connector with ${connector_id} not found`);
    }

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: connector.credentials_data.access_token });

    const drive = google.drive({ version: 'v3', auth });

    // Handle updated files
    let page_token = null;
    let has_more_pages = true;

    while (has_more_pages) {
        let query = `trashed=false and 'me' in owners and modifiedTime >= '${connector.last_synced_at.toISOString()}' and modifiedTime < '${now_date.toISOString()}' and createdTime < '${connector.last_synced_at.toISOString()}'`;

        if (connector.app_data.folders.length > 0) {
            const folderQuery = connector.app_data.folders.map(folder => `'${folder.id}' in parents`).join(' or ');
            query += ` and (${folderQuery})`;
        }

        const drive_response: GaxiosResponse<drive_v3.Schema$FileList> = await drive.files.list({
            q: query,
            includeItemsFromAllDrives: true,
            supportsAllDrives: true,
            pageSize: 100,
            pageToken: page_token || undefined,
            fields: "nextPageToken, files(id, name, webViewLink, mimeType, createdTime, modifiedTime, owners, description)"
        });

        if (!drive_response.data.files) {
            break;
        }

        for (const file of drive_response.data.files) {
            let document_text: string | null = null;

            if (file.id) {
                document_text = await getFileContent({ file, drive, auth });

                if (document_text) {
                    const found_document = (await DB.select().from(document_table).where(
                        and(
                            eq(document_table.fk_document_connector, connector.id),
                            eq(jsonExtract(document_table.metadata, "id"), file.id)
                        )
                    ))[0];

                    if (!found_document) {
                        throw new Error(`Document not found with file id ${file.id}`);
                    }

                    await DB.update(document_table).set({
                        title: file.name || "Untitled Document",
                        metadata: {
                            ...found_document.metadata,
                            mime_type: file.mimeType,
                            owner_email: file.owners ? file.owners[0].emailAddress : null,
                            updated_at: new Date(file.modifiedTime!)
                        } as google_drive_file_metadata
                    }).where(
                        and(
                            eq(document_table.fk_document_connector, connector.id),
                            eq(jsonExtract(document_table.metadata, "id"), file.id)
                        )
                    )

                    await deleteDocumentChunks({ document_id: found_document.id });

                    const chunks = await text_splitter.splitText(`${file.name} ${document_text}`);

                    await Promise.all(chunks.map(async (chunk, index) => {
                        await DB.insert(document_chunk_table).values({
                            fk_chunk_org: connector.fk_connector_org,
                            fk_chunk_document: found_document.id,
                            chunk_index: index,
                            content: chunk
                        });

                        await add_vector_entity_queue.add("add", {
                            org_id: connector.fk_connector_org,
                            document_id: found_document.id,
                            connector_id: connector.id,
                            chunk,
                            chunk_index: index
                        });
                    }));
                }
            }
        }

        page_token = drive_response.data.nextPageToken || null;
        has_more_pages = !!page_token;
    }

    // Handle new files
    page_token = null;
    has_more_pages = true;

    while (has_more_pages) {
        let query = `trashed=false and 'me' in owners and createdTime >= '${connector.last_synced_at.toISOString()}' and createdTime < '${now_date.toISOString()}'`;

        if (connector.app_data.folders.length > 0) {
            const folderQuery = connector.app_data.folders.map(folder => `'${folder.id}' in parents`).join(' or ');
            query += ` and (${folderQuery})`;
        }

        const drive_response: GaxiosResponse<drive_v3.Schema$FileList> = await drive.files.list({
            q: query,
            includeItemsFromAllDrives: true,
            supportsAllDrives: true,
            pageSize: 100,
            pageToken: page_token || undefined,
            fields: "nextPageToken, files(id, name, webViewLink, mimeType, createdTime, modifiedTime, owners, description)"
        });

        if (!drive_response.data.files) {
            break;
        }

        for (const file of drive_response.data.files) {
            let document_text: string | null = null;

            if (file.id) {
                document_text = await getFileContent({ file, drive, auth });

                if (document_text) {
                    const created_document = (await DB.insert(document_table).values({
                        fk_document_org: connector.fk_connector_org,
                        fk_document_connector: connector.id,
                        title: file.name || "Untitled Document",
                        link: file.webViewLink,
                        type: DocumentType.FILE,
                        metadata: {
                            id: file.id,
                            mime_type: file.mimeType,
                            owner_email: file.owners ? file.owners[0].emailAddress : null,
                            created_at: new Date(file.createdTime!),
                            updated_at: new Date(file.modifiedTime!)
                        } as google_drive_file_metadata
                    }).returning())[0];

                    const chunks = await text_splitter.splitText(`${file.name} ${document_text}`);

                    await Promise.all(chunks.map(async (chunk, index) => {
                        await DB.insert(document_chunk_table).values({
                            fk_chunk_org: connector.fk_connector_org,
                            fk_chunk_document: created_document.id,
                            chunk_index: index,
                            content: chunk
                        });

                        await add_vector_entity_queue.add("add", {
                            org_id: connector.fk_connector_org,
                            document_id: created_document.id,
                            connector_id: connector.id,
                            chunk,
                            chunk_index: index
                        });
                    }));
                }
            }
        }

        page_token = drive_response.data.nextPageToken || null;
        has_more_pages = !!page_token;
    } */
}

export const getGoogleDriveFolders = async (DTO: { access_token: string }) => {
    const { access_token } = DTO;

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token });
    const drive = google.drive({ version: 'v3', auth });

    let pageToken = null;
    let hasMorePages = true;

    const folders: drive_v3.Schema$File[] = [];

    while (hasMorePages) {
        const response: GaxiosResponse<drive_v3.Schema$FileList> = await drive.files.list({
            q: "mimeType='application/vnd.google-apps.folder' and trashed=false and 'me' in owners",
            includeItemsFromAllDrives: true,
            supportsAllDrives: true,
            pageSize: 100,
            pageToken: pageToken || undefined,
            fields: "nextPageToken, files(id, name)"
        });

        if (response.data.files) {
            folders.push(...response.data.files);
        }

        pageToken = response.data.nextPageToken || null;
        hasMorePages = !!pageToken;
    }

    return folders;
}