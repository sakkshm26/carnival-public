import { AppType } from "./db/schema";

// App credentials types
export type JiraConnectorCredentialsData = {
}
export type ConfluenceConnectorCredentialsData = {
}
export type SlackConnectorCredentialsData = {
    client_id: string;
    client_secret: string;
}
/* export type GoogleDriveConnectorCredentialsData = {
    access_token: string;
    refresh_token: string;
}
export type GithubConnectorCredentialsData = {
    access_token: string;
} */
export type SalesforceConnectorCredentialsData = {
    client_id: string;
    client_secret: string;
}
export type ConnectorCredentialsData = JiraConnectorCredentialsData | ConfluenceConnectorCredentialsData | SlackConnectorCredentialsData | SalesforceConnectorCredentialsData;


// export type JiraConnectorAdditionalData = {
//     project_ids?: string[]
// }
// export type ConfluenceConnectorAdditionalData = {
//     space_keys?: string[]
// }
// export type ConnectorAdditionalData = JiraConnectorAdditionalData | ConfluenceConnectorAdditionalData;


// User connector types
export type SlackUserConnectorCredentialsData = {
    user_access_token: string
}
export type JiraUserConnectorCredentialsData = {
    access_token: string;
    email: string;
    base_url: string;
    cloud_id?: string;
    refresh_token?: string;
}
export type ConfluenceUserConnectorCredentialsData = {
    access_token: string;
    email: string;
    base_url: string;
    cloud_id?: string;
    refresh_token?: string;
}
export type SalesforceUserConnectorCredentialsData = {
    access_token: string;
    refresh_token: string;
    instance_url: string;
}
export type UserConnectorCredentialsData = SlackUserConnectorCredentialsData | SalesforceUserConnectorCredentialsData | JiraUserConnectorCredentialsData | ConfluenceUserConnectorCredentialsData;


export type ConversationMessageDocument = {
    title: string;
    content: string | null;
    url: string;
    metadata: any;
    app_type: AppType | "web";
}

export type ConversationMessageUsageMetadata = {
    total_input_tokens: number;
    total_output_tokens: number;
    total_tokens: number;
    llm_calls: number;
    estimated_cost_usd: number;
}

export type ConversationMessageThinkingStep = {
    type: "text" | "sources"
    data: string | { app_type: AppType | "web", title: string }[]
}


// Generic types
export enum ErrorType {
    ACCESS_TOKEN_EXPIRED = "ACCESS_TOKEN_EXPIRED"
}
export enum IndexingJobTypes {
    INITIAL_INDEX = "initial_index",
    REINDEX = "reindex"
}