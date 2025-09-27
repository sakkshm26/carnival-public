import { AnyPgColumn, boolean, integer, jsonb, numeric, pgEnum, pgTable, primaryKey, text, timestamp, uuid, vector } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm";
import { ConnectorCredentialsData, ConversationMessageDocument, ConversationMessageThinkingStep, ConversationMessageUsageMetadata, UserConnectorCredentialsData } from "../types";

export function enumToPgEnum<T extends Record<string, any>>(
    myEnum: T,
): [T[keyof T], ...T[keyof T][]] {
    return Object.values(myEnum).map((value: any) => `${value}`) as any
}

export enum ProfileColorType {
    COLOR1 = "color1",
    COLOR2 = "color2",
    COLOR3 = "color3",
    COLOR4 = "color4",
    COLOR5 = "color5",
    COLOR6 = "color6",
    COLOR7 = "color7",
    COLOR8 = "color8",
    COLOR9 = "color9",
    COLOR10 = "color10",
}

export enum AppType {
    GOOGLE_DRIVE = "google_drive",
    SLACK = "slack",
    JIRA = "jira",
    HUBSPOT = "hubspot",
    GMAIL = "gmail",
    GITHUB = "github",
    SALESFORCE = "salesforce",
    CONFLUENCE = "confluence"
}

export enum SyncStatus {
    SUCCESS = "success",
    IN_PROCESS = "in_process",
    FAILED = "failed",
    DELETING = "deleting"
}

export enum DocumentType {
    MESSAGE = "message",
    FILE = "file",
    NOTE = "note",
    EMAIL = "email",
    CONTACT = "contact",
    LEAD = "lead",
    DEAL = "deal",
    OPPORTUNITY = "opportunity",
    TICKET = "ticket",
    ISSUE = "issue",
    PULL_REQUEST = "pull_request"
}

export enum OrgUserRole {
    ADMIN = "admin",
    READ_ONLY = "read_only"
}

export enum UserInvitationStatus {
    PENDING = "pending",
    ACCEPTED = "accepted",
    REJECTED = "rejected"
}

export const profile_color_type_enum = pgEnum("profile_color_type_enum", enumToPgEnum(ProfileColorType));
export const sync_status_enum = pgEnum("sync_status_enum", enumToPgEnum(SyncStatus));
export const app_type_enum = pgEnum("app_type_enum", enumToPgEnum(AppType));
export const document_type_enum = pgEnum("document_type_enum", enumToPgEnum(DocumentType));
export const org_user_role_enum = pgEnum("org_user_role_enum", enumToPgEnum(OrgUserRole))
export const user_invitation_status_enum = pgEnum("user_invitation_status_enum", enumToPgEnum(UserInvitationStatus))

// tables
export const org_table = pgTable("org", {
    id: uuid("id")
        .default(sql`gen_random_uuid()`)
        .primaryKey(),
    name: text("name").notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
})

export const user_table = pgTable("user", {
    id: uuid("id")
        .default(sql`gen_random_uuid()`)
        .primaryKey(),
    display_name: text("display_name"),
    email: text("email").notNull().unique(),
    email_verified: boolean("email_verified").notNull().default(false),
    fk_user_last_logged_in_org: uuid("fk_user_last_logged_in_org").references(() => org_table.id),
    color: profile_color_type_enum("color").notNull().default(ProfileColorType.COLOR1),
    image_url: text("image_url"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
})

export const session_table = pgTable("session", {
    id: uuid("id")
        .default(sql`gen_random_uuid()`)
        .primaryKey(),
    fk_session_user: uuid("fk_session_user").references(() => user_table.id).notNull(),
    token: text("token").notNull().unique(),
    expires_at: timestamp("expires_at", { withTimezone: true }).notNull(),
    ip_address: text("ip_address"),
    user_agent: text("user_agent"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
})

export const account_table = pgTable("account", {
    id: uuid("id")
        .default(sql`gen_random_uuid()`)
        .primaryKey(),
    fk_account_user: uuid("fk_account_user").references(() => user_table.id).notNull(),
    account_id: text("account_id").notNull(),
    provider_id: text("provider_id").notNull(),
    access_token: text("access_token"),
    refresh_token: text("refresh_token"), 
    access_token_expires_at: timestamp("access_token_expires_at", { withTimezone: true }),
    refresh_token_expires_at: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    id_token: text("id_token"),
    password: text("password"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
})

export const verification_table = pgTable("verification", {
    id: uuid("id")
        .default(sql`gen_random_uuid()`)
        .primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expires_at: timestamp("expires_at", { withTimezone: true }).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
})

export const org_user_map_table = pgTable("org_user_map", {
    fk_user_org: uuid("fk_user_org").references(() => org_table.id).notNull(),
    fk_org_user: uuid("fk_org_user").references(() => user_table.id).notNull(),
    role: org_user_role_enum("role").notNull().default(OrgUserRole.READ_ONLY),
    description: text("description"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (t) => [
    primaryKey({ columns: [t.fk_user_org, t.fk_org_user] }),
])

export const user_invitation_table = pgTable("user_invitation", {
    id: uuid("id")
        .default(sql`gen_random_uuid()`)
        .primaryKey(),
    fk_invitation_org: uuid("fk_invitation_org").references(() => org_table.id).notNull(),
    email: text("email").notNull(),
    status: user_invitation_status_enum("status").notNull().default(UserInvitationStatus.PENDING),
    role: org_user_role_enum("role").notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
})

export const user_group_table = pgTable("user_group", {
    id: uuid("id")
        .default(sql`gen_random_uuid()`)
        .primaryKey(),
    fk_group_org: uuid("fk_group_org").references(() => org_table.id).notNull(),
    name: text("name").notNull(),
    description: text("description"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
})

export const user_group_user_map_table = pgTable("user_group_user_map", {
    fk_group_user: uuid("fk_group_user").references(() => user_table.id).notNull(),
    fk_user_group: uuid("fk_user_group").references(() => user_group_table.id).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (t) => [
    primaryKey({ columns: [t.fk_group_user, t.fk_user_group] }),
])

export const connector_table = pgTable("connector", {
    id: uuid("id")
        .default(sql`gen_random_uuid()`)
        .primaryKey(),
    fk_connector_org: uuid("fk_connector_org").references(() => org_table.id).notNull(),
    name: text("name"),
    // sync_status: sync_status_enum("status").notNull().default(SyncStatus.IN_PROCESS),
    // last_synced_at: timestamp("last_synced_at", { withTimezone: true }).defaultNow().notNull(),
    app_type: app_type_enum("app_type").notNull(),
    credentials_data: jsonb("credentials_data").$type<ConnectorCredentialsData>(),
    // additional_data: jsonb("additional_data").$type<ConnectorAdditionalData>(),
    is_deleted: boolean("is_deleted").notNull().default(false),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
})

export const user_connector_table = pgTable("user_connector", {
    id: uuid("id")
        .default(sql`gen_random_uuid()`)
        .primaryKey(),
    fk_user_connector_org: uuid("fk_user_connector_org").references(() => org_table.id).notNull(),
    fk_connector_user: uuid("fk_connector_user").references(() => user_table.id).notNull(),
    fk_user_connector: uuid("fk_user_connector").references(() => connector_table.id).notNull(),
    credentials_data: jsonb("credentials_data").$type<UserConnectorCredentialsData | null>(),
    connected: boolean("connected").notNull().default(false),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
})

export const document_table = pgTable("document", {
    id: uuid("id")
        .default(sql`gen_random_uuid()`)
        .primaryKey(),
    fk_document_org: uuid("fk_document_org").references(() => org_table.id).notNull(),
    fk_document_connector: uuid("fk_document_connector").references(() => connector_table.id).notNull(),
    // title: text("title").notNull(),
    link: text("link"),
    // type: document_type_enum("type").notNull(),
    metadata: jsonb("metadata").$type<any>(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
})

export const document_chunk_table = pgTable("document_chunk", {
    id: uuid("id")
        .default(sql`gen_random_uuid()`)
        .primaryKey(),
    fk_chunk_org: uuid("fk_chunk_org").references(() => org_table.id).notNull(),
    fk_chunk_connector: uuid("fk_chunk_connector").references(() => connector_table.id).notNull(),
    fk_chunk_document: uuid("fk_chunk_document").references(() => document_table.id).notNull(),
    chunk_index: integer("chunk_index").notNull(),
    // content: text("content").notNull(),
    // display_content: text("display_content"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
})

export const connector_user_access_table = pgTable("connector_user_access", {
    fk_access_org: uuid("fk_access_org").references(() => org_table.id).notNull(),
    fk_access_connector: uuid("fk_access_connector").references(() => connector_table.id).notNull(),
    fk_access_user: uuid("fk_access_user").references(() => user_table.id).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (t) => [
    primaryKey({ columns: [t.fk_access_connector, t.fk_access_user] }),
])

export const connector_group_access_table = pgTable("connector_group_access", {
    fk_access_org: uuid("fk_access_org").references(() => org_table.id).notNull(),
    fk_access_connector: uuid("fk_access_connector").references(() => connector_table.id).notNull(),
    fk_access_user_group: uuid("fk_access_user_group").references(() => user_group_table.id).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (t) => [
    primaryKey({ columns: [t.fk_access_connector, t.fk_access_user_group] }),
])

export const user_conversation_table = pgTable("user_conversation", {
    id: uuid("id")
        .default(sql`gen_random_uuid()`)
        .primaryKey(),
    fk_conversation_org: uuid("fk_conversation_org").references(() => org_table.id).notNull(),
    fk_conversation_user: uuid("fk_conversation_user").references(() => user_table.id).notNull(),
    title: text("title"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
})

export const user_conversation_message_table = pgTable("user_conversation_message", {
    id: uuid("id")
        .default(sql`gen_random_uuid()`)
        .primaryKey(),
    fk_message_org: uuid("fk_message_org").references(() => org_table.id).notNull(),
    fk_message_user: uuid("fk_message_user").references(() => user_table.id).notNull(),
    fk_message_conversation: uuid("fk_message_conversation").references(() => user_conversation_table.id).notNull(),
    sent_by_bot: boolean("sent_by_bot").notNull(),
    text: text("text").notNull(),
    documents: jsonb("documents").default([]).notNull().$type<ConversationMessageDocument[]>(),
    usage_metadata: jsonb("usage_metadata").$type<ConversationMessageUsageMetadata | null>(),
    thinking_steps: jsonb("thinking_steps").$type<ConversationMessageThinkingStep[] | null>(),
    liked: boolean("liked"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
})