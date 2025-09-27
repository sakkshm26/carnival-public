import { sql } from "drizzle-orm";
import { PgColumn } from "drizzle-orm/pg-core";
import { DB } from "./db";
import OpenAI from 'openai';
import { config } from "./providers/config";

export const openai = new OpenAI({
    apiKey: config.openai_api_key
})

export const cleanTextForEmbeddings = (text: string): string => {
    if (!text) return "";

    let cleaned_text = text;

    cleaned_text = cleaned_text
        .replace(/\\n/g, " ")
        .replace(/\\t/g, " ")
        .replace(/\\r/g, "")
        .replace(/\\\\/g, "\\")
        .replace(/\\"/g, '"')
        .replace(/\\'/g, "'");

    cleaned_text = cleaned_text
        .replace(/\s+/g, " ")
        .trim();

    cleaned_text = cleaned_text
        .replace(/\n{3,}/g, "\n\n")
        .replace(/\n\s+/g, "\n");

    cleaned_text = cleaned_text.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, "");

    cleaned_text = cleaned_text
        .split("\n")
        .filter(line => line.trim() !== "")
        .join("\n");

    return cleaned_text;
};

export const getRandomEnumValue = <T extends object>(an_enum: T): T[keyof T] => {
    const enum_values = Object.values(an_enum) as unknown as T[keyof T][]
    const random_index = Math.floor(Math.random() * enum_values.length)
    const random_enum_value = enum_values[random_index]
    return random_enum_value;
}

export type PathsToStringProperty<T> = T extends object
    ? {
        [K in keyof T & string]: T[K] extends string
        ? K
        : T[K] extends object
        ? `${K & string}.${PathsToStringProperty<T[K]>}`
        : never;
    }[keyof T & string]
    : never;

type ExtractColumnData<T> =
    T extends PgColumn<infer Config, any, any>
    ? Config extends { data: any }
    ? Config["data"]
    : never
    : never;

export function jsonExtract<
    TColumn extends PgColumn<any, any, any>,
    TPath extends PathsToStringProperty<NonNullable<ExtractColumnData<TColumn>>>,
>(column: TColumn, path: TPath) {
    const parts = path.split(".");
    const last_part = parts.pop()!;
    const path_parts = parts.length
        ? parts.map((p) => `'${p}'`).join("->") + `->'${last_part}'`
        : `'${last_part}'`;
    return sql`${column}->>${sql.raw(path_parts)}`;
}

export const executeRawSQL = async (query: string) => {
    const normalized_query = query.trim().toLowerCase();
    if (!normalized_query.startsWith('select ')) {
        throw new Error('Some error occurred');
    }
    const forbidden_keywords = ['insert', 'update', 'delete', 'drop', 'alter', 'create', 'truncate'];

    if (forbidden_keywords.some(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'i');
        return regex.test(normalized_query);
    })) {
        throw new Error('Some error occurred');
    }

    const result = await DB.execute(query);
    return result?.rows || [];
}

export const createEmbeddings = async (text: string) => {
    const embeddings = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text
    })

    return embeddings.data[0].embedding
}