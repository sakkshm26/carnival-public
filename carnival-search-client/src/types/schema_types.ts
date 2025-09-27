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
    JIRA = 'jira',
    SALESFORCE = 'salesforce',
    SLACK = 'slack',
    CONFLUENCE = 'confluence',
    GOOGLE_DRIVE = 'google_drive',
    HUBSPOT = 'hubspot',
    GMAIL = 'gmail',
    GITHUB = 'github',
    NOTION = 'notion',
    TEAMS = 'teams',
    ZENDESK = 'zendesk',
    DROPBOX = 'dropbox',
    GOOGLE_CALENDAR = 'google_calendar',
    MONDAY = 'monday',
    LINEAR = 'linear',
}

export enum SyncStatus {
    SUCCESS = "success",
    IN_PROCESS = "in_process",
    FAILED = "failed"
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

export type Org = {
    id: string;
    name: string;
    created_at: Date;
    updated_at: Date;
};

export type User = {
    id: string;
    created_at: Date;
    updated_at: Date;
    display_name: string | null;
    email: string;
    fk_user_last_logged_in_org: string | null;
    color: ProfileColorType
};

export type OrgUserMap = {
    created_at: Date;
    updated_at: Date;
    fk_user_org: string;
    fk_org_user: string;
    role: OrgUserRole;
};

export type UserGroup = {
    id: string;
    name: string;
    created_at: Date;
    updated_at: Date;
    fk_group_org: string;
    description: string | null;
};

export type Connector = {
    id: string;
    name: string | null;
    created_at: Date;
    updated_at: Date;
    fk_connector_org: string;
    // sync_status: SyncStatus;
    app_type: AppType;
    // credentials_data: ConnectorCredentialsData;
    // app_data: ConnectorAppData | null;
};

export type UserConnector = {
    id: string;
    created_at: Date;
    updated_at: Date;
    fk_user_connector_org: string;
    fk_connector_user: string;
    fk_user_connector: string;
    credentials_data: UserConnectorCredentialsData;
    connected: boolean;
}

export type Document = {
    id: string;
    link: string | null;
    created_at: Date;
    updated_at: Date;
    fk_document_org: string;
    fk_document_connector: string;
    title: string;
    last_synced_at: Date;
};

export type DocumentChunk = {
    id: string;
    created_at: Date;
    updated_at: Date;
    fk_chunk_org: string;
    fk_chunk_connector: string;
    fk_chunk_document: string;
    chunk_index: number;
};

export type ConnectorAccess = {
    id: string;
    created_at: Date;
    updated_at: Date;
    fk_access_org: string;
    fk_access_connector: string;
    fk_access_user_group: string | null;
    fk_access_user: string | null;
};

export type UserInvitation = {
    email: string;
    role: "admin" | "read_only";
    fk_invitation_org: string;
    id: string;
    created_at: Date;
    updated_at: Date;
    status: UserInvitationStatus;
};

export type Conversation = {
    id: string;
    fk_conversation_org: string;
    fk_conversation_user: string;
    title: string;
    created_at: Date;
    updated_at: Date;
}

export type ConversationMessage = {
    id: string;
    fk_message_conversation: string;
    fk_message_user: string;
    fk_message_org: string;
    sent_by_bot: boolean;
    text: string;
    documents: ConversationMessageDocument[];
    thinking_steps: ConversationMessageThinkingStep[] | null
    liked: boolean | null;
    created_at: Date;
    updated_at: Date;
}

export type SlackUserConnectorCredentialsData = {
    user_access_token: string
}
export type JiraUserConnectorCredentialsData = {
    access_token: string;
    email: string;
    base_url: string;
    cloud_id: string;
}
export type ConfluenceUserConnectorCredentialsData = {
    access_token: string;
    email: string;
    base_url: string;
    cloud_id: string;
}
export type SalesforceUserConnectorCredentialsData = {
    access_token: string;
    refresh_token: string;
    instance_url: string;
}
export type UserConnectorCredentialsData = SlackUserConnectorCredentialsData;

export type ConversationMessageDocument = {
    title: string;
    content: string | null;
    url: string;
    metadata: any;
    app_type: AppType | "web";
}

export type ConversationMessageThinkingStep = {
    type: "text" | "sources"
    data: string | { app_type: AppType | "web", title: string }[]
}