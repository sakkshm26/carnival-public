'use client'

import Loader from "@/components/loader"
import CustomTableHead from "@/components/elements/CustomTableHead"
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table"
import { useApiClient } from "@/utils/axios"
import Image from 'next/image'
import React, { useEffect, useState, useContext } from 'react'
import { Button } from "@/components/ui/button"
import { Plus, CheckCircle2, AlertCircle, Loader2, Check, Info } from "lucide-react"
import ConnectorDialog from "../../../components/connector-dialog"
import DashboardPanelsContext, { PanelTypes } from "@/contexts/dashboard-panel-context"
import ConnectorView from "@/components/connector-view"
import { Connector, UserConnector } from "@/types/schema_types"
import CustomToast from "@/components/toast"
import ConfigContext from "@/contexts/config-context"
import { AppType } from "@/constants"
import GetAppLogo from "@/components/GetAppLogo"

const KnowledgeBase = () => {
    const { addPanel } = useContext(DashboardPanelsContext);
    const api_client = useApiClient();
    const configContext = useContext(ConfigContext)

    const [connectorsLoading, setConnectorsLoading] = useState(false)
    const [connectors, setConnectors] = useState<({ org_connector: Connector } & { user_connector: UserConnector | null })[]>([])
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const handleSlackAuth = async (connectorId: string) => {
        const response = await api_client.get('/internal/user')
        window.open(
            `https://slack.com/oauth/v2/authorize?client_id=${configContext!.SLACK_CLIENT_ID}&user_scope=channels:history,channels:read,groups:read,mpim:read,im:read,users:read,team:read,search:read&state=${JSON.stringify({ org_id: response.data.fk_user_last_logged_in_org, user_id: response.data.id, connector_id: connectorId })}&redirect_uri=${configContext!.SLACK_REDIRECT_URI}`,
            'oauth_popup',
            'width=700,height=500'
        );
    }

    const getConnectors = async () => {
        setConnectorsLoading(true)
        try {
            const connectors = await api_client.get(`/internal/connector`)
            setConnectors(connectors.data)
        } catch (err) {
            console.log(err)
        }
        setConnectorsLoading(false)
    }

    /* useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            // if (event.origin !== configContext!.SERVER_URL) return;

            if (event.data.type === 'OAUTH_SUCCESS') {
                getConnectors()
                CustomToast({ message: "Connector connected successfully" })
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []); */

    useEffect(() => {
        getConnectors()
    }, [])

    return (
        <div className="mx-auto relative h-full">
            <div className="sticky top-0 z-10 bg-white flex justify-between items-center pt-6 pb-5 px-8">
                <h1 className="text-[16px]">
                    <span className="text-gray-500">Connected Apps</span> &nbsp;/&nbsp;
                    <span className="text-gray-500 text-[14px]">
                        {connectors.length}
                    </span>
                </h1>
                {/* <Button
                    variant="outline"
                    className="rounded-lg bg-[#3334FE] text-white hover:bg-[#2a2bd9] hover:text-white h-9"
                    onClick={() => setIsDialogOpen(true)}
                >
                    <Plus className="h-4 w-4 mr-1" />
                    <p className="text-[14px] font-[400]">Connect</p>
                </Button> */}
            </div>

            <div
                className="overflow-x-auto relative overflow-auto pb-12"
                style={{ height: "calc(100vh - 120px)" }}
            >
                <Table className="text-base">
                    <TableHeader className="sticky top-0 bg-white">
                        <TableRow>
                            <CustomTableHead
                                title="App"
                                includePipe={false}
                                className="w-[200px] pl-5"
                                allowSort={false}
                            />
                            <CustomTableHead
                                title="Status"
                                includePipe={true}
                                className="w-[200px]"
                                allowSort={false}
                            />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {connectors.map((connector, index: number) => (
                            <TableRow
                                key={index}
                                className="text-base cursor-pointer"
                                onClick={() => {
                                    addPanel({
                                        panelId: `connector-view-${connector.org_connector.id}`,
                                        fullVisible: true,
                                        component: <ConnectorView orgConnectorId={connector.org_connector.id} getConnectors={getConnectors} />,
                                        panelType: PanelTypes.CONNECTOR_VIEW,
                                        closeAll: true
                                    })
                                }}
                            >
                                <TableCell className="h-14 pl-5 flex items-center space-x-3">
                                    <GetAppLogo 
                                        appType={connector.org_connector.app_type} 
                                        width={25} 
                                        height={25} 
                                    />
                                    <p className=''>{connector.org_connector.name}</p>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center space-x-2">
                                        {connector.user_connector?.connected ? (
                                            <>
                                                <Check className="h-5 w-5 text-green-500" />
                                                <p className="">Connected</p>
                                            </>
                                        ) : (
                                            <>
                                                <Info className="h-5 w-5 text-yellow-500" />
                                                <p>Not Connected</p>
                                            </>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* <ConnectorDialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                onSuccess={() => {
                    setIsDialogOpen(false)
                    getConnectors()
                }}
            /> */}
        </div>
    )
}

export default KnowledgeBase