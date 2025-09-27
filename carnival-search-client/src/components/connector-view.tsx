import { useContext, useEffect, useState } from "react";
import CustomToast from "./toast";
import { useApiClient } from "@/utils/axios";
import CustomInput from "./elements/CustomInput";
import { X, Check, Loader2, AlertCircle, Users, Trash2, MoreVertical, Edit, ExternalLink } from "lucide-react";
import DashboardPanelsContext from "@/contexts/dashboard-panel-context";
import dayjs from "dayjs";
import Image from "next/image";
import Loader from "./loader";
import { AppType, Connector, User, UserConnector, UserGroup } from "@/types/schema_types";
import { Button } from "./ui/button";
import { MultiSelect } from "./ui/multiselect";
import Avatar from "./elements/Avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { CONNECTOR_INPUTS } from "@/constants";
import ConfigContext from "@/contexts/config-context";
import { Input } from "./ui/input";
import GetAppLogo from "./GetAppLogo";

const ConnectorView = (props: { orgConnectorId: string, getConnectors: () => void }) => {
    const { closePanel } = useContext(DashboardPanelsContext);
    const api_client = useApiClient();
    const configContext = useContext(ConfigContext)

    const [connector, setConnector] = useState<(Connector & {
        // user_access: { created_at: Date, user: User }[],
        // group_access: { created_at: Date, group: UserGroup }[],
        user_connector: UserConnector | null
    }) | null>(null);
    // const [allUsers, setAllUsers] = useState<User[]>([]);
    // const [allUserGroups, setAllUserGroups] = useState<UserGroup[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    // const [isRetrying, setIsRetrying] = useState(false);
    const [isEditingCredentials, setIsEditingCredentials] = useState(false);
    const [credentialsData, setCredentialsData] = useState<Record<string, string>>({});
    const [oauthInputData, setOauthInputData] = useState<Record<string, string>>({});

    const [updatedConnectorData, setUpdatedConnectorData] = useState<{ name: string } | null>(null);
    const [updatedUserAccess, setUpdatedUserAccess] = useState<{ label: string, value: string }[]>([]);
    const [updatedGroupAccess, setUpdatedGroupAccess] = useState<{ label: string, value: string }[]>([]);

    const getConnector = async () => {
        try {
            const response = await api_client.get(`/internal/connector/${props.orgConnectorId}`)
            setConnector(response.data);
            setUpdatedConnectorData({ name: response.data.name });
            setUpdatedUserAccess(response.data.user_access.map((user: { created_at: Date, user: User }) => {
                return { label: user.user.display_name!, value: user.user.id }
            }));
            setUpdatedGroupAccess(response.data.group_access.map((group: { created_at: Date, group: UserGroup }) => {
                return { label: group.group.name, value: group.group.id }
            }));

            // Initialize credentials data for API key connectors
            if (response.data.user_connector?.credentials_data) {
                setCredentialsData(response.data.user_connector.credentials_data);
                setOauthInputData(response.data.user_connector.credentials_data);
            }
        } catch (err) {
            CustomToast({ message: "Error fetching connector details" })
        }
    }

    /* const getAllUsers = async () => {
        try {
            const response = await api_client.get(`/internal/user/org-users`);
            setAllUsers(response.data);
        } catch (err) {
            CustomToast({ message: "Error fetching users" });
        }
    };

    const getAllUserGroups = async () => {
        try {
            const response = await api_client.get(`/internal/user/user-group`)
            setAllUserGroups(response.data)
        } catch (error) {
            console.log(error)
        }
    }

    const handleUpdateConnector = async () => {
        try {
            await api_client.put(`/internal/connector/${props.orgConnectorId}`, {
                name: updatedConnectorData!.name
            });
            await getConnector();
        } catch (err) {
            CustomToast({ message: "Error updating connector" });
        }
    } */

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            // if (event.origin !== configContext!.SERVER_URL) return;

            if (event.data.type === 'OAUTH_SUCCESS') {
                CustomToast({ message: "Connector connected successfully" })
                getConnector()
                props.getConnectors()
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const upsertUserConnector = async () => {
        try {
            await api_client.put(`/internal/connector/user-connector`, {
                connector_id: props.orgConnectorId,
                credentials_data: credentialsData
            });
            await getConnector();
            setIsEditingCredentials(false);
            CustomToast({ message: "Credentials updated successfully" });
        } catch (err) {
            CustomToast({ message: "Error updating credentials" });
        }
    };

    const handleOAuthConnect = async (DTO: { appType: AppType, connectorId: string }) => {
        const { appType, connectorId } = DTO;
        try {
            const response = await api_client.get('/internal/user')
            const baseState = { 
                org_id: response.data.fk_user_last_logged_in_org, 
                user_id: response.data.id, 
                connector_id: connectorId,
                ...oauthInputData
            };
            
            if (appType === AppType.SLACK) {
                window.open(
                    `https://slack.com/oauth/v2/authorize?client_id=${configContext!.SLACK_CLIENT_ID}&user_scope=channels:history,channels:read,groups:read,mpim:read,im:read,users:read,team:read,search:read,groups:history&state=${JSON.stringify(baseState)}&redirect_uri=${configContext!.SLACK_REDIRECT_URI}`,
                    'oauth_popup',
                    'width=700,height=500'
                );
            } else if (appType === AppType.SALESFORCE) {
                window.open(
                    `https://login.salesforce.com/services/oauth2/authorize?response_type=code&client_id=${configContext!.SALESFORCE_CLIENT_ID}&redirect_uri=${configContext!.SALESFORCE_REDIRECT_URI}&scope=api refresh_token offline_access&state=${JSON.stringify(baseState)}`,
                    'oauth_popup',
                    'width=700,height=500'
                )
            } else if (appType === AppType.JIRA) {
                window.open(
                    `https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=${configContext!.ATLASSIAN_CLIENT_ID}&scope=read%3Ajira-work%20read%3Ajira-user%20offline_access&state=${JSON.stringify({...baseState, app_type: AppType.JIRA})}&redirect_uri=${encodeURIComponent(configContext!.ATLASSIAN_REDIRECT_URI)}&response_type=code&prompt=consent`,
                    'oauth_popup',
                    'width=700,height=500'
                );
            } else if (appType === AppType.CONFLUENCE) {
                window.open(
                    `https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=${configContext!.ATLASSIAN_CLIENT_ID}&scope=search%3Aconfluence%20read%3Aconfluence-content.all%20read%3Aconfluence-content.summary%20read%3Aconfluence-user%20offline_access&state=${JSON.stringify({...baseState, app_type: AppType.CONFLUENCE})}&redirect_uri=${encodeURIComponent(configContext!.ATLASSIAN_REDIRECT_URI)}&response_type=code&prompt=consent`,
                    'oauth_popup',
                    'width=700,height=500'
                );
            }
        } catch (err) {
            CustomToast({ message: "Error initiating OAuth connection" });
        }
    };

    const handleUpdateAccess = async () => {
        try {
            await api_client.put(`/internal/connector/${props.orgConnectorId}`, {
                user_access: updatedUserAccess.map(user => user.value),
                group_access: updatedGroupAccess.map(group => group.value)
            });
            await getConnector();
            setIsEditing(false);
        } catch (err) {
            CustomToast({ message: "Error updating access" });
        }
    };

    /* const getAllAccessItems = () => {
        const userAccessItems = connector?.user_access?.map(access => ({
            id: access.user.id,
            name: access.user.display_name!,
            email: access.user.email,
            type: 'user' as const,
            color: access.user.color,
            created_at: new Date(access.created_at)
        }));

        const groupAccessItems = connector?.group_access.map(access => ({
            id: access.group.id,
            name: access.group.name,
            description: access.group.description,
            type: 'group' as const,
            created_at: new Date(access.created_at)
        }));

        return [...userAccessItems || [], ...groupAccessItems || []]
            .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
    }; */

    const handleDeleteConnector = async () => {
        try {
            setIsDeleting(true);
            await api_client.delete(`/internal/connector/${props.orgConnectorId}`);
            closePanel(`connector-view-${props.orgConnectorId}`);
            CustomToast({ message: "Deleting connector..." });
        } catch (err) {
            CustomToast({ message: "Error deleting connector" });
        } finally {
            setIsDeleting(false);
        }
    };

    /* const handleRetrySync = async () => {
        try {
            setIsRetrying(true);
            await api_client.post(`/internal/connector/${props.orgConnectorId}/retry`);
            await getConnector();
            CustomToast({ message: "Retrying sync..." });
        } catch (err) {
            CustomToast({ message: "Error retrying sync" });
        } finally {
            setIsRetrying(false);
        }
    }; */

    useEffect(() => {
        getConnector();
        // getAllUsers();
        // getAllUserGroups();
    }, [])

    const getConnectorType = () => {
        if (!connector) return null;
        return CONNECTOR_INPUTS[connector.app_type as AppType]?.type || null;
    };

    const getConnectorInputs = () => {
        if (!connector) return [];
        return CONNECTOR_INPUTS[connector.app_type as AppType]?.inputs || [];
    };

    return (
        connector ?
            <div className="overflow-hidden border-l w-screen sm:w-[480px] shadow-[0_2px_12px_0_hsla(228_10%_8%_/0.12),0_0_6px_0_hsla(228_10%_8%_/0.05)]">
                <div className="py-6 px-6 border-b flex flex-col justify-center">
                    <div className="flex justify-end items-center space-x-2">
                        {/* <Dialog>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="p-1 rounded-md hover:bg-gray-100">
                                        <MoreVertical className="w-5 h-5 text-gray-500 hover:text-black" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DialogTrigger asChild>
                                        <DropdownMenuItem className="text-red-700 cursor-pointer flex items-center gap-2">
                                            <Trash2 className="h-4 w-4" />
                                            Delete Connector
                                        </DropdownMenuItem>
                                    </DialogTrigger>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Delete Connector</DialogTitle>
                                    <DialogDescription className="pt-2">
                                        Are you sure you want to delete <span className="font-semibold">{connector?.name}</span>?
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="mt-2 flex items-start space-x-2 text-amber-600">
                                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                                    <span>
                                        This action is permanent and cannot be undone. All access configurations and connection
                                        settings for this connector will be permanently lost.
                                    </span>
                                </div>

                                <DialogFooter>
                                    <Button variant="outline" onClick={() => { }}>Cancel</Button>
                                    <Button
                                        variant="destructive"
                                        onClick={handleDeleteConnector}
                                        disabled={isDeleting}
                                    >
                                        {isDeleting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Deleting...
                                            </>
                                        ) : (
                                            "Delete Permanently"
                                        )}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog> */}
                        <X
                            className="w-5 h-5 cursor-pointer text-gray-500 hover:text-black"
                            onClick={() => closePanel(`connector-view-${props.orgConnectorId}`)}
                        />
                    </div>
                    <div className="flex flex-col space-y-5 items-center justify-center">
                        <GetAppLogo 
                            appType={connector?.app_type} 
                            width={60} 
                            height={60} 
                        />
                        <p className="text-base">{connector?.name}</p>
                    </div>
                </div>

                <div className="py-6 px-6 border-b">
                    <h3 className="text-base font-medium mb-4">Connection Configuration</h3>

                    {getConnectorType() === "api_key" ? (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">API Credentials</span>
                                <Button
                                    variant="outline"
                                    onClick={() => setIsEditingCredentials(!isEditingCredentials)}
                                    className="flex items-center gap-2 text-xs"
                                >
                                    <Edit className="h-2 w-2" />
                                    {isEditingCredentials ? "Cancel" : "Edit"}
                                </Button>
                            </div>

                            {isEditingCredentials ? (
                                <div className="space-y-3">
                                    {getConnectorInputs().map((input) => (
                                        <div key={input.name}>
                                            <label className="text-sm text-gray-600 mb-1 block">
                                                {input.label}
                                                {input.required && <span className="text-red-500 ml-1">*</span>}
                                            </label>
                                            <Input
                                                value={credentialsData[input.name] || ""}
                                                onChange={(e) => setCredentialsData(prev => ({
                                                    ...prev,
                                                    [input.name]: e.target.value
                                                }))}
                                                placeholder={input.placeholder}
                                                type={input.type || "text"}
                                                className="text-sm w-full"
                                            />
                                        </div>
                                    ))}
                                    <div></div>
                                    <Button
                                        className="w-full text-xs"
                                        onClick={upsertUserConnector}
                                    >
                                        Update Credentials
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {getConnectorInputs().map((input) => (
                                        <div key={input.name} className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">{input.label}</span>
                                            <span className="text-sm">
                                                {credentialsData[input.name] ?
                                                    (input.name.toLowerCase().includes('token') || input.name.toLowerCase().includes('password') ?
                                                        '••••••••' :
                                                        credentialsData[input.name]
                                                    ) :
                                                    'Not configured'
                                                }
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : getConnectorType() === "oauth2" ? (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">OAuth Connection</span>
                                <div className="flex items-center gap-2">
                                    {connector.user_connector?.connected ? (
                                        <>
                                            <Check className="h-4 w-4 text-green-500" />
                                            <span className="text-sm text-green-600">Connected</span>
                                        </>
                                    ) : (
                                        <>
                                            <AlertCircle className="h-4 w-4 text-amber-500" />
                                            <span className="text-sm text-amber-600">Not Connected</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {getConnectorInputs().length > 0 && (
                                <div className="space-y-3 mb-4">
                                    {getConnectorInputs().map((input) => (
                                        <div key={input.name}>
                                            <label className="text-sm text-gray-600 mb-1 block">
                                                {input.label}
                                                {input.required && <span className="text-red-500 ml-1">*</span>}
                                            </label>
                                            <Input
                                                value={oauthInputData[input.name]}
                                                onChange={(e) => setOauthInputData(prev => ({
                                                    ...prev,
                                                    [input.name]: e.target.value
                                                }))}
                                                placeholder={input.placeholder}
                                                type={input.type || "text"}
                                                className="text-sm w-full"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}

                            <Button
                                className="w-full text-xs"
                                onClick={() => handleOAuthConnect({ appType: connector.app_type, connectorId: props.orgConnectorId })}
                                variant={connector.user_connector?.connected ? "outline" : "default"}
                            >
                                <ExternalLink className="mr-2 h-4 w-4" />
                                {connector.user_connector?.connected ? "Reconnect" : "Connect"} to {CONNECTOR_INPUTS[connector.app_type as AppType]?.title}
                            </Button>
                        </div>
                    ) : null}
                </div>

                {/* <div className="flex h-full">
                    <div className="w-[480px]">
                        {connector ? (
                            <div>
                                <div className="py-4 px-7">
                                    <div className="flex items-center space-x-2 mt-3">
                                        <label className="w-[100px] text-sm text-gray-600">
                                            Name
                                        </label>
                                        <CustomInput
                                            value={updatedConnectorData?.name || ""}
                                            onChange={val => setUpdatedConnectorData(prev => ({ ...prev!, name: val }))}
                                            onBlur={handleUpdateConnector}
                                        />
                                    </div>
                                    <div className="flex items-center space-x-2 mt-3">
                                        <label className="w-[100px] text-sm text-gray-600">
                                            Status
                                        </label>
                                        <div className="flex items-center space-x-2">
                                            {connector.sync_status === "success" ? (
                                                <>
                                                    <Check className="h-5 w-5 text-green-500" />
                                                    <p>Connected</p>
                                                </>
                                            ) : connector.sync_status === "in_process" ? (
                                                <>
                                                    <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                                                    <p>Syncing...</p>
                                                </>
                                            ) : (
                                                <>
                                                    <AlertCircle className="h-5 w-5 text-red-500" />
                                                    <p>Failed</p>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={handleRetrySync}
                                                        disabled={isRetrying}
                                                        className="ml-2"
                                                    >
                                                        {isRetrying ? (
                                                            <>
                                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                Retrying...
                                                            </>
                                                        ) : (
                                                            "Retry"
                                                        )}
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 border-t">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg">Access Control</h3>
                                        <Button
                                            variant="outline"
                                            onClick={() => setIsEditing(!isEditing)}
                                            className="font-normal"
                                        >
                                            {isEditing ? "Cancel" : "Edit Access"}
                                        </Button>
                                    </div>

                                    {isEditing ? (
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-sm text-gray-600 mb-2 block">Users</label>
                                                <MultiSelect
                                                    options={allUsers.map(user => ({
                                                        label: user.display_name!,
                                                        value: user.id
                                                    }))}
                                                    selectedValues={updatedUserAccess}
                                                    setSelectedValues={setUpdatedUserAccess}
                                                    placeholder="Select users"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-sm text-gray-600 mb-2 block">User Groups</label>
                                                <MultiSelect
                                                    options={allUserGroups.map(group => ({
                                                        label: group.name,
                                                        value: group.id
                                                    }))}
                                                    selectedValues={updatedGroupAccess}
                                                    setSelectedValues={setUpdatedGroupAccess}
                                                    placeholder="Select user groups"
                                                />
                                            </div>
                                            <Button
                                                className="w-full"
                                                onClick={handleUpdateAccess}
                                            >
                                                Update Access
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="h-[calc(100vh-400px)] overflow-y-auto">
                                            <div className="space-y-3">
                                                {getAllAccessItems().map((item) => (
                                                    <div key={item.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                                                        {item.type === 'user' ? (
                                                            <>
                                                                <Avatar
                                                                    name={item.name}
                                                                    color_type={item.color}
                                                                    className="h-8 w-8 rounded-md text-sm"
                                                                />
                                                                <div>
                                                                    <p className="">{item.name}</p>
                                                                    <p className="text-xs text-gray-500">{item.email}</p>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div className="h-8 w-8 rounded-md bg-gray-100 flex items-center justify-center">
                                                                    <Users className="h-5 w-5 text-gray-500" />
                                                                </div>
                                                                <div>
                                                                    <p className="">{item.name}</p>
                                                                    <p className="text-xs text-gray-500">{item.description || 'No description'}</p>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div> */}
            </div> : <Loader global={true} />
    )
}

export default ConnectorView 