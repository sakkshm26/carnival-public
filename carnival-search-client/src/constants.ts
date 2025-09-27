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

export const APP_TYPE_NAME_MAP: Record<AppType, string> = {
    [AppType.JIRA]: "Jira",
    [AppType.GITHUB]: "GitHub",
    [AppType.SLACK]: "Slack",
    [AppType.CONFLUENCE]: "Confluence",
    [AppType.SALESFORCE]: "Salesforce",
    [AppType.GOOGLE_DRIVE]: "Google Drive",
    [AppType.HUBSPOT]: "HubSpot",
    [AppType.GMAIL]: "Gmail",
    [AppType.NOTION]: "Notion",
    [AppType.TEAMS]: "Microsoft Teams",
    [AppType.ZENDESK]: "Zendesk",
    [AppType.DROPBOX]: "Dropbox",
    [AppType.GOOGLE_CALENDAR]: "Google Calendar",
    [AppType.MONDAY]: "Monday",
    [AppType.LINEAR]: "Linear",
}


export const AVATAR_COLORS: Record<string, string> = {
    color1: "#6B9AC4",  // Muted blue
    color2: "#D4846A",  // Soft coral
    color3: "#789F8A",  // Sage green
    color4: "#D4B483",  // Warm beige
    color5: "#8B7A9F",  // Dusty purple
    color6: "#679B9B",  // Muted teal
    color7: "#C47B8F",  // Dusty rose
    color8: "#707B9C",  // Steel blue
    color9: "#C17F59",  // Muted terracotta
    color10: "#5B9AA9", // Soft sky blue
}

export const CONNECTOR_INPUTS: Record<AppType, {
    title: string;
    description: string;
    type: "oauth2" | "api_key";
    inputs?: {
        name: string;
        label: string;
        type?: string;
        placeholder?: string;
        defaultValue?: string;
        required?: boolean;
    }[]
}> = {
    [AppType.JIRA]: {
        title: "Jira",
        description: "Connect your Jira account to start syncing your data.",
        type: "oauth2",
        inputs: [
            {
                name: "email",
                label: "Email",
                required: true,
            },
            {
                name: "base_url",
                label: "Base URL",
                required: true,
            }
        ]
    },
    [AppType.GITHUB]: {
        title: "GitHub",
        description: "Connect your GitHub account to start syncing your data.",
        inputs: [
            {
                name: "access_token",
                label: "Access Token",
                required: true,
            }
        ],
        type: "api_key"
    },
    [AppType.SLACK]: {
        title: "Slack",
        description: "Enter credentials of your slack app",
        type: "oauth2"
    },
    [AppType.CONFLUENCE]: {
        title: "Confluence",
        description: "Connect your Confluence account to start syncing your data.",
        type: "oauth2",
        inputs: [
            {
                name: "email",
                label: "Email",
                required: true,
            },
            {
                name: "base_url",
                label: "Base URL",
                required: true,
            }
        ]
    },
    [AppType.SALESFORCE]: {
        title: "Salesforce",
        description: "Connect your Salesforce account to start syncing your data.",
        type: "oauth2"
    },
    [AppType.GOOGLE_DRIVE]: {
        title: "Google Drive",
        description: "Connect your Google Drive account to start syncing your data.",
        type: "oauth2"
    },
    [AppType.HUBSPOT]: {
        title: "HubSpot",
        description: "Connect your HubSpot account to start syncing your data.",
        type: "oauth2"
    },
    [AppType.GMAIL]: {
        title: "Gmail",
        description: "Connect your Gmail account to start syncing your data.",
        type: "oauth2"
    },
    [AppType.NOTION]: {
        title: "Notion",
        description: "Connect your Notion account to start syncing your data.",
        type: "oauth2"
    },
    [AppType.TEAMS]: {
        title: "Microsoft Teams",
        description: "Connect your Microsoft Teams account to start syncing your data.",
        type: "oauth2"
    },
    [AppType.ZENDESK]: {
        title: "Zendesk",
        description: "Connect your Zendesk account to start syncing your data.",
        type: "oauth2"
    },
    [AppType.DROPBOX]: {
        title: "Dropbox",
        description: "Connect your Dropbox account to start syncing your data.",
        type: "oauth2"
    },
    [AppType.GOOGLE_CALENDAR]: {
        title: "Google Calendar",
        description: "Connect your Google Calendar account to start syncing your data.",
        type: "oauth2"
    },
    [AppType.MONDAY]: {
        title: "Monday",
        description: "Connect your Monday account to start syncing your data.",
        type: "oauth2"
    },
    [AppType.LINEAR]: {
        title: "Linear",
        description: "Connect your Linear account to start syncing your data.",
        type: "oauth2"
    }
}

export const APP_DESCRIPTIONS_MAP: Record<string, string> = {
    [AppType.JIRA]: "Track and manage issues, sprints, and projects.",
    [AppType.SALESFORCE]: "Access and update contacts, deals, and leads.",
    [AppType.SLACK]: "Search messages and take action in Slack.",
    [AppType.CONFLUENCE]: "Search pages, blogs, and internal documentation quickly.",
    [AppType.GOOGLE_DRIVE]: "Find and manage files across Google Drive.",
    [AppType.HUBSPOT]: "Search and update contacts in HubSpot CRM.",
    [AppType.GMAIL]: "Search, read, and manage Gmail inbox emails.",
    [AppType.GITHUB]: "Search and update repositories, issues, and PRs.",
    [AppType.NOTION]: "Search and edit Notion pages and databases.",
    [AppType.TEAMS]: "Search and engage in Teams chats and channels.",
    [AppType.ZENDESK]: "Manage tickets, users, and articles in Zendesk.",
    [AppType.DROPBOX]: "Search and organize files in Dropbox folders.",
    [AppType.GOOGLE_CALENDAR]: "View and manage events in Google Calendar.",
    [AppType.MONDAY]: "Manage boards, tasks, and projects on Monday.",
    [AppType.LINEAR]: "Create and track issues, projects in Linear."
};
