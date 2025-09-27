import { and, eq, not, sql } from "drizzle-orm";
import { DB } from "../db";
import {
    org_user_map_table,
    user_conversation_message_table,
    user_connector_table,
    user_table
} from "../db/schema";

export const AdminService = {
    getTotalUsers: async (DTO: { org_id: string }) => {
        const { org_id } = DTO;
        const rows = await DB
            .select({ count: sql<number>`CAST(COUNT(*) AS INTEGER)` })
            .from(org_user_map_table)
            .where(and(eq(org_user_map_table.fk_user_org, org_id), not(eq(org_user_map_table.fk_org_user, "982f2a28-cf4f-4891-ad28-131a9f35044d"))));
        return rows[0]?.count ?? 0;
    },

    getTotalMessages: async (DTO: { org_id: string }) => {
        const { org_id } = DTO;
        const rows = await DB
            .select({ count: sql<number>`CAST(COUNT(*) AS INTEGER)` })
            .from(user_conversation_message_table)
            .where(
                and(
                    eq(user_conversation_message_table.fk_message_org, org_id),
                    eq(user_conversation_message_table.sent_by_bot, false),
                    not(eq(user_conversation_message_table.fk_message_user, "982f2a28-cf4f-4891-ad28-131a9f35044d"))
                )
            );
        return rows[0]?.count ?? 0;
    },

    getDailyMessageCounts: async (DTO: { org_id: string, days?: number }) => {
        const { org_id, days = 30 } = DTO;
        const target_timezone = 'Asia/Kolkata';
        const result = await DB.execute(sql`
            WITH date_series AS (
                SELECT 
                    CAST(generate_series(
                        (NOW() AT TIME ZONE ${target_timezone}) - (INTERVAL '1 day' * ${days}),
                        (NOW() AT TIME ZONE ${target_timezone}),
                        '1 day'
                    ) AS date) AS date
            ),
            message_counts AS (
                SELECT
                    CAST(DATE_TRUNC('day', created_at AT TIME ZONE ${target_timezone}) AS date) AS date,
                    COUNT(id) AS message_count
                FROM
                    public.user_conversation_message
                WHERE
                    fk_message_org = ${org_id}
                    AND sent_by_bot = false
                    AND (created_at AT TIME ZONE ${target_timezone}) >= (NOW() AT TIME ZONE ${target_timezone}) - (INTERVAL '1 day' * ${days})
                    AND fk_message_user != '982f2a28-cf4f-4891-ad28-131a9f35044d'
                GROUP BY
                    date
            )
            SELECT
                ds.date,
                COALESCE(mc.message_count, 0) AS message_count
            FROM
                date_series ds
            LEFT JOIN
                message_counts mc ON ds.date = mc.date
            ORDER BY
                ds.date;
        `);

        return (result.rows as any[]).map(row => ({
            date: row.date,
            message_count: parseInt(row.message_count)
        }));
    },

    getDailyUniqueUserCounts: async (DTO: { org_id: string, days?: number }) => {
        const { org_id, days = 30 } = DTO;

        const target_timezone = 'Asia/Kolkata';

        const result = await DB.execute(sql`
            WITH date_series AS (
                SELECT 
                    CAST(generate_series(
                        (NOW() AT TIME ZONE ${target_timezone}) - (INTERVAL '1 day' * ${days}),
                        (NOW() AT TIME ZONE ${target_timezone}),
                        '1 day'
                    ) AS date) AS date
            ),
            user_activity_counts AS (
                SELECT
                    CAST(DATE_TRUNC('day', created_at AT TIME ZONE ${target_timezone}) AS date) AS date,
                    COUNT(DISTINCT fk_message_user) AS unique_user_count
                FROM
                    public.user_conversation_message
                WHERE
                    fk_message_org = ${org_id}
                    AND sent_by_bot = false
                    AND (created_at AT TIME ZONE ${target_timezone}) >= (NOW() AT TIME ZONE ${target_timezone}) - (INTERVAL '1 day' * ${days})
                    AND fk_message_user != '982f2a28-cf4f-4891-ad28-131a9f35044d'
                GROUP BY
                    date
            )
            SELECT
                ds.date,
                COALESCE(uac.unique_user_count, 0) AS unique_user_count
            FROM
                date_series ds
            LEFT JOIN
                user_activity_counts uac ON ds.date = uac.date
            ORDER BY
                ds.date;
        `);

        return (result.rows as any[]).map(row => ({
            date: row.date,
            user_count: parseInt(row.unique_user_count)
        }));
    },

    getUserStats: async (DTO: { org_id: string }) => {
        const { org_id } = DTO;

        const rows = await DB
            .select({
                user_id: user_table.id,
                email: user_table.email,
                display_name: user_table.display_name,
                account_created_at: user_table.created_at,
                first_app_connected_at: sql<string | null>`MIN(${user_connector_table.created_at})`,
                total_apps_connected: sql<number>`CAST(COUNT(DISTINCT ${user_connector_table.id}) AS INTEGER)`,
                first_chat_at: sql<string | null>`MIN(${user_conversation_message_table.created_at})`,
                total_chats: sql<number>`CAST(COUNT(DISTINCT ${user_conversation_message_table.id}) AS INTEGER)`
            })
            .from(org_user_map_table)
            .innerJoin(user_table, eq(user_table.id, org_user_map_table.fk_org_user))
            .leftJoin(
                user_connector_table,
                and(
                    eq(user_connector_table.fk_connector_user, user_table.id),
                    eq(user_connector_table.fk_user_connector_org, org_id),
                    eq(user_connector_table.connected, true)
                )
            )
            .leftJoin(
                user_conversation_message_table,
                and(
                    eq(user_conversation_message_table.fk_message_user, user_table.id),
                    eq(user_conversation_message_table.fk_message_org, org_id),
                    eq(user_conversation_message_table.sent_by_bot, false)
                )
            )
            .where(eq(org_user_map_table.fk_user_org, org_id))
            .groupBy(user_table.id, user_table.email, user_table.display_name, user_table.created_at);

        return rows.map(r => ({
            id: r.user_id,
            email: r.email,
            display_name: r.display_name,
            account_created_at: r.account_created_at,
            first_app_connected_at: r.first_app_connected_at,
            total_apps_connected: r.total_apps_connected,
            first_chat_at: r.first_chat_at,
            total_messages_sent: r.total_chats
        }));
    }
}