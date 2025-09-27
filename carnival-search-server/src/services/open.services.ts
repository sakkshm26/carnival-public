import { config } from "../providers/config";
import axios from "axios";
import { DB } from "../db";
import { AppType, connector_table, document_chunk_table, document_table, DocumentType, SyncStatus, user_connector_table } from "../db/schema";
import { and, eq, inArray, or, sql } from "drizzle-orm";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Project, SyntaxKind, ts } from "ts-morph";
import path from "path";

export const OpenService = {
    createChunk: async (DTO: { org_id: string, document_id: string, chunk_index: number, content: string }) => {
        /* const { org_id, document_id, chunk_index, content } = DTO;
        await DB.insert(document_chunk_table).values({
            fk_chunk_org: org_id,
            fk_chunk_document: document_id,
            chunk_index
        }) */
    },

    getMetadataTypeForAppDoc: (app_type: AppType, document_type: DocumentType) => {
        const project = new Project({
            compilerOptions: {
                strictNullChecks: true
            }
        });
        const source_file = project.addSourceFileAtPath(path.join(__dirname, '../types.ts'));
        const type_aliases = source_file.getDescendantsOfKind(SyntaxKind.TypeAliasDeclaration);

        const targetTypeName = `${app_type}_${document_type}_metadata`.toLowerCase();

        for (const type_alias of type_aliases) {
            const name = type_alias.getName().toLowerCase();

            if (name === targetTypeName) {
                const type = type_alias.getType();
                const properties = type.getProperties();

                const typeStructure: Record<string, string> = {};
                properties.forEach(prop => {
                    const propName = prop.getName();
                    const propType = prop.getTypeAtLocation(type_alias);
                    typeStructure[propName] = propType.getText();
                });

                return JSON.stringify(typeStructure);
            }
        }

        return null;
    },

    getDocumentsWithChunk: async (data: { document_id: string, chunk_index: number }[]) => {
        const documents = await DB.select({ id: document_table.id, link: document_table.link, metadata: document_table.metadata }).from(document_table).where(inArray(document_table.id, data.map(d => d.document_id)));
        const chunks = await DB.select({ id: document_chunk_table.id, fk_chunk_document: document_chunk_table.fk_chunk_document, chunk_index: document_chunk_table.chunk_index }).from(document_chunk_table).where(
            or(
                ...data.map(item =>
                    and(
                        eq(document_chunk_table.fk_chunk_document, item.document_id),
                        eq(document_chunk_table.chunk_index, item.chunk_index)
                    )
                )
            )
        );

        const documentsMap = new Map(documents.map(doc => [doc.id, doc]));
        const chunksMap = new Map(chunks.map(chunk => [`${chunk.fk_chunk_document}_${chunk.chunk_index}`, chunk]));

        const results = data.map(item => {
            const document = documentsMap.get(item.document_id);
            const chunk = chunksMap.get(`${item.document_id}_${item.chunk_index}`);

            if (!document || !chunk) {
                return null;
            }

            return {
                ...document,
                chunk: { id: chunk.id }
            };
        }).filter(Boolean);

        return results;
    },

    getDocumentsWithChunksAndAppType: async (data: { document_id: string, chunk_index: number }[]) => {
        const documents = await DB.select({ id: document_table.id, link: document_table.link, metadata: document_table.metadata, app_type: connector_table.app_type })
            .from(document_table)
            .where(inArray(document_table.id, data.map(d => d.document_id))).leftJoin(connector_table, eq(document_table.fk_document_connector, connector_table.id));
        const chunks = await DB.select({ id: document_chunk_table.id, fk_chunk_document: document_chunk_table.fk_chunk_document, chunk_index: document_chunk_table.chunk_index }).from(document_chunk_table).where(
            or(
                ...data.map(item =>
                    and(
                        eq(document_chunk_table.fk_chunk_document, item.document_id),
                        eq(document_chunk_table.chunk_index, item.chunk_index)
                    )
                )
            )
        );

        const documentsMap = new Map(documents.map(doc => [doc.id, doc]));
        const chunksMap = new Map(chunks.map(chunk => [`${chunk.fk_chunk_document}_${chunk.chunk_index}`, chunk]));

        const results = data.map(item => {
            const document = documentsMap.get(item.document_id);
            const chunk = chunksMap.get(`${item.document_id}_${item.chunk_index}`);

            if (!document || !chunk) {
                return null;
            }

            return {
                ...document,
                chunk: { id: chunk.id }
            };
        }).filter(Boolean);

        return results;
    },
}