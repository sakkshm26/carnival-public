'use client'

import { AppType } from "@/constants"
import GoogleDriveDialog from "./connector-dialogs/google_drive"
import SlackDialog from "./connector-dialogs/slack"
import JiraDialog from "./connector-dialogs/jira"
import SalesforceDialog from "./connector-dialogs/salesforce"
import ConfluenceDialog from "./connector-dialogs/confluence"

interface SelectionDialogProps {
    connectorType: AppType
    connectorData: Record<string, any>
    onSuccess: () => void
}

const SelectionDialog = ({ connectorType, connectorData, onSuccess }: SelectionDialogProps) => {
    const renderConnectorDialog = () => {
        switch (connectorType) {
            case AppType.GOOGLE_DRIVE:
                return (
                    <GoogleDriveDialog
                        connectorData={{
                            access_token: connectorData.access_token,
                            refresh_token: connectorData.refresh_token,
                            state: connectorData.state
                        }}
                        onSuccess={onSuccess}
                    />
                );
            case AppType.SLACK:
                return (
                    <SlackDialog
                        connectorData={{
                            user_access_token: connectorData.user_access_token,
                            state: connectorData.state
                        }}
                        onSuccess={onSuccess}
                    />
                )
            case AppType.JIRA:
                return (
                    <JiraDialog
                        connectorData={{
                            projects: connectorData.projects,
                            connectorName: connectorData.connectorName,
                            access_token: connectorData.access_token,
                            email: connectorData.email,
                            base_url: connectorData.base_url
                        }}
                        onSuccess={onSuccess}
                    />
                )
            case AppType.SALESFORCE:
                return (
                    <SalesforceDialog
                        connectorData={{
                            access_token: connectorData.access_token,
                            refresh_token: connectorData.refresh_token,
                            instance_url: connectorData.instance_url
                        }}
                        onSuccess={onSuccess}
                    />
                )
            case AppType.CONFLUENCE:
                return (
                    <ConfluenceDialog
                        connectorData={{
                            spaces: connectorData.spaces,
                            connectorName: connectorData.connectorName,
                            access_token: connectorData.access_token,
                            email: connectorData.email,
                            base_url: connectorData.base_url
                        }}
                        onSuccess={onSuccess}
                    />
                )
            default:
                return null;
        }
    };

    return (
        renderConnectorDialog()
    );
};

export default SelectionDialog; 