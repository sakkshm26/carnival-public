import { AnyColumn, GetColumnData, InferColumnsDataTypes, SQL, SQLChunk, sql } from "drizzle-orm";

export function jsonBuildObject<T extends Record<string, AnyColumn>>(shape: T) {
    const chunks: SQL[] = [];

    Object.entries(shape).forEach(([key, value]) => {
        if (chunks.length > 0) {
            chunks.push(sql.raw(`,`));
        }
        chunks.push(sql.raw(`'${key}',`));
        chunks.push(sql`${value}`);
    });

    return sql<InferColumnsDataTypes<T>[]>`json_build_object(${sql.fromList(
        chunks,
    )})`;
}

export function jsonAggBuildObject<T extends Record<string, AnyColumn>>(
    shape: T,
) {
    return sql<InferColumnsDataTypes<T>[]>`coalesce(json_agg(${jsonBuildObject(
        shape,
    )}), '[]')`;
}

export function arrayAgg<Column extends AnyColumn>(column: Column) {
    return sql<
        GetColumnData<Column, "raw">[]
    >`array_agg(distinct ${sql`${column}`}) filter (where ${column} is not null)`;
}