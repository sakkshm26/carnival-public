'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import Image from 'next/image'
import { useApiClient } from "@/utils/axios"
import { AppType } from '@/constants'
import { useContext, useEffect, useState } from 'react'
import SelectionDialog from "./selection-dialog"
import ConfigContext from "@/contexts/config-context"
import CustomToast from "./toast"

interface ConnectorDialogProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

const ConnectorDialog = ({ isOpen, onClose, onSuccess }: ConnectorDialogProps) => {
    const configContext = useContext(ConfigContext);
    const api_client = useApiClient();

    const [connectorDialog, setConnectorDialog] = useState<string | null>(null)
    const [connectorName, setConnectorName] = useState<string>("")
    const [dialogFormData, setDialogFormData] = useState<Record<string, string>>({})
    const [connectorData, setConnectorData] = useState<{ connectorType: AppType, data: Record<string, any> } | null>(null)

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            // if (event.origin !== configContext!.SERVER_URL) return;

            if (event.data.type === 'OAUTH_SUCCESS') {
                const { connector_type, data } = event.data;
                setConnectorData({ connectorType: connector_type, data });

                if (event.source && 'close' in event.source) {
                    (event.source as Window).close();
                }
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const handleGoogleAuth = async () => {
        const response = await api_client.get('/internal/user')
        window.open(
            `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${configContext!.GOOGLE_CLIENT_ID}&redirect_uri=${configContext!.GOOGLE_REDIRECT_URI}&scope=https://www.googleapis.com/auth/drive.readonly&access_type=offline&include_granted_scopes=true&prompt=consent&state=${JSON.stringify({ org_id: response.data.fk_user_last_logged_in_org })}`,
            'oauth_popup',
            'width=700,height=500'
        );
    }

    const handleSalesforceAuth = async () => {
        const response = await api_client.get('/internal/user')
        window.open(
            `https://login.salesforce.com/services/oauth2/authorize?response_type=code&client_id=${configContext!.SALESFORCE_CLIENT_ID}&redirect_uri=${configContext!.SALESFORCE_REDIRECT_URI}&scope=api refresh_token offline_access&state=${JSON.stringify({ org_id: response.data.fk_user_last_logged_in_org })}`,
            'oauth_popup',
            'width=700,height=500'
        )
    }

    const handleDialogSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        try {
            if (connectorDialog === AppType.JIRA) {
                const response = await api_client.get(`/internal/connector/jira-projects?access_token=${dialogFormData.access_token}&email=${dialogFormData.email}&base_url=${dialogFormData.base_url}`)
                setConnectorData({ connectorType: AppType.JIRA, data: { projects: response.data, connectorName, ...dialogFormData } })
            } else if (connectorDialog === AppType.SLACK) {
                await api_client.post(`/internal/connector`, {
                    connector_name: connectorName,
                    app_type: AppType.SLACK,
                    connector_data: dialogFormData
                })
                setDialogFormData({})
                setConnectorDialog(null)
                onSuccess()
            } else if (connectorDialog === AppType.CONFLUENCE) {
                const response = await api_client.get(`/internal/connector/confluence-spaces?access_token=${dialogFormData.access_token}&email=${dialogFormData.email}&base_url=${dialogFormData.base_url}`)
                setConnectorData({ connectorType: AppType.CONFLUENCE, data: { spaces: response.data, connectorName, ...dialogFormData } })
            }
        } catch (err) {
            CustomToast({ message: "Some error occurred" })
        }
    }

    const handleClose = () => {
        setConnectorDialog(null)
        setDialogFormData({})
        setConnectorData(null)
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[550px]" onInteractOutside={(e) => {
                e.preventDefault();
            }}>
                {/* {connectorData ? (
                    <SelectionDialog
                        connectorType={connectorData.connectorType}
                        connectorData={connectorData.data}
                        onSuccess={() => {
                            setConnectorData(null);
                            onSuccess();
                        }}
                    />
                ) : !connectorDialog ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>Connect New App</DialogTitle>
                        </DialogHeader>
                        <div className='mt-4 grid grid-cols-2 gap-4'>
                            <div className='border border-gray-300 rounded-lg p-5 flex flex-col justify-center items-center relative cursor-pointer hover:bg-gray-50' onClick={handleGoogleAuth}>
                                <Image src={'/app_logos/google_drive.svg'} alt='Google Drive' width={40} height={40} />
                                <p className='font-medium mt-2'>Google Drive</p>
                            </div>
                            <div className='border border-gray-300 rounded-lg p-5 flex flex-col justify-center items-center relative cursor-pointer hover:bg-gray-50' onClick={() => setConnectorDialog("jira")}>
                                <Image src={'/app_logos/jira.png'} alt='Jira' width={40} height={40} />
                                <p className='font-medium mt-2'>Jira</p>
                            </div>
                            <div className='border border-gray-300 rounded-lg p-5 flex flex-col justify-center items-center relative cursor-pointer hover:bg-gray-50' onClick={() => setConnectorDialog("slack")}>
                                <Image src={'/app_logos/slack.png'} alt='Slack' width={40} height={40} />
                                <p className='font-medium mt-2'>Slack</p>
                            </div>
                            <div className='border border-gray-300 rounded-lg p-5 flex flex-col justify-center items-center relative cursor-pointer hover:bg-gray-50' onClick={handleSalesforceAuth}>
                                <Image src={'/app_logos/salesforce.png'} alt='Salesforce' width={50} height={50} />
                                <p className='font-medium mt-2'>Salesforce</p>
                            </div>
                            <div className='border border-gray-300 rounded-lg p-5 flex flex-col justify-center items-center relative cursor-pointer hover:bg-gray-50' onClick={() => setConnectorDialog("confluence")}>
                                <Image src={'/app_logos/confluence.png'} alt='Jira' width={30} height={30} />
                                <p className='font-medium mt-2'>Confluence</p>
                            </div>
                            <div className='border border-gray-300 rounded-lg p-5 flex flex-col justify-center items-center relative cursor-pointer hover:bg-gray-50' onClick={() => setConnectorDialog("github")}>
                                <Image src={'/app_logos/github.png'} alt='Github' width={40} height={40} className="invert" />
                                <p className='font-medium mt-2'>Github</p>
                            </div>
                        </div>
                    </>
                ) : (
                    <form onSubmit={handleDialogSubmit}>
                        <DialogHeader>
                            <DialogTitle>{CONNECTOR_DIALOGS[connectorDialog].title}</DialogTitle>
                        </DialogHeader>
                        <div className="py-3">
                            <div className="grid grid-cols-4 items-center gap-4 my-5">
                                <Label className="text-right">
                                    Connector Name
                                </Label>
                                <Input
                                    name="connector_name"
                                    type="text"
                                    placeholder="Enter Connector Name"
                                    className="col-span-3"
                                    onChange={(e) => setConnectorName(e.target.value)}
                                    required={false}
                                />
                            </div>
                            {CONNECTOR_DIALOGS[connectorDialog].inputs.map((input) => (
                                <div className="grid grid-cols-4 items-center gap-4 my-5" key={input.name}>
                                    <Label htmlFor={input.name} className="text-right">
                                        {input.label}
                                    </Label>
                                    <Input
                                        id={input.name}
                                        name={input.name}
                                        type={input.type || "text"}
                                        placeholder={input.placeholder}
                                        defaultValue={input.defaultValue}
                                        className="col-span-3"
                                        onChange={(e) => setDialogFormData({ ...dialogFormData, [input.name]: e.target.value })}
                                        required={input.required || false}
                                    />
                                </div>
                            ))}
                        </div>
                        <DialogFooter>
                            <Button type="submit">Save</Button>
                        </DialogFooter>
                    </form>
                )} */}
            </DialogContent>
        </Dialog>
    )
}

export default ConnectorDialog 