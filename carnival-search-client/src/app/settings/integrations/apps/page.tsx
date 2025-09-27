"use client";

import ConnectorView from '@/components/connector-view';
import GetAppLogo from '@/components/GetAppLogo';
import DownloadIcon from '@/components/icons/DownloadIcon';
import LayoutIcon from '@/components/icons/LayoutIcon';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// Import the new AppType enum and updated map
import { APP_DESCRIPTIONS_MAP, AppType } from '@/constants';
import ConfigContext from '@/contexts/config-context';
import DashboardPanelsContext, { PanelTypes } from '@/contexts/dashboard-panel-context';
import { Connector, UserConnector } from '@/types/schema_types';
import { useApiClient } from '@/utils/axios';
import Image from 'next/image';
import React, { useState, useEffect, useCallback, useContext } from 'react';

const Carousel = ({ children, autoSlide = true, autoSlideInterval = 6000 }: { children: React.ReactNode, autoSlide?: boolean, autoSlideInterval?: number }) => {
    const [curr, setCurr] = useState(1);
    const slides = React.Children.toArray(children);

    const next = useCallback(() => {
        setCurr((current) => (current === slides.length - 1 ? 0 : current + 1));
    }, [slides.length]);

    useEffect(() => {
        if (!autoSlide) return;
        const slideInterval = setInterval(next, autoSlideInterval);
        return () => clearInterval(slideInterval);
    }, [autoSlide, autoSlideInterval, next]);

    return (
        <div className="relative overflow-hidden h-full">
            <div
                className="flex transition-transform ease-out duration-500 h-full"
                style={{ transform: `translateX(-${curr * 100}%)` }}
            >
                {slides.map((slide, i) => (
                    <div className="flex-shrink-0 w-full h-full" key={i}>
                        {slide}
                    </div>
                ))}
            </div>

            <div className="absolute bottom-4 right-4">
                <div className="flex items-center justify-center gap-2">
                    {slides.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurr(i)}
                            className={`
                                transition-all w-8 h-1 rounded-full
                                ${curr === i ? "bg-white" : "bg-white/50"}
                            `}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default function App() {
    const { addPanel } = useContext(DashboardPanelsContext);
    const api_client = useApiClient();
    const configContext = useContext(ConfigContext)
    const [connectors, setConnectors] = useState<({ org_connector: Connector } & { user_connector: UserConnector | null })[]>([])
    const [connectorsLoading, setConnectorsLoading] = useState(false)
    const [activeTab, setActiveTab] = useState("all_connectors")

    const getConnectors = async () => {
        setConnectorsLoading(true);
        try {
            const response = await api_client.get(`/internal/connector`);
            const apiConnectors: ({ org_connector: Connector } & { user_connector: UserConnector | null })[] = response.data;

            // --- START: MODIFIED CODE ---

            // Get the app_types of connectors already received from the API
            const existingAppTypes = new Set(apiConnectors.map(c => c.org_connector.app_type));

            // Define the list of additional apps you want to display
            const additionalApps = [
                { name: 'Notion', app_type: AppType.NOTION },
                { name: 'Gmail', app_type: AppType.GMAIL },
                { name: 'GitHub', app_type: AppType.GITHUB },
                { name: 'Google Drive', app_type: AppType.GOOGLE_DRIVE },
                { name: 'HubSpot', app_type: AppType.HUBSPOT },
                { name: 'Microsoft Teams', app_type: AppType.TEAMS },
                { name: 'Zendesk', app_type: AppType.ZENDESK },
                { name: 'Dropbox', app_type: AppType.DROPBOX },
                { name: 'Google Calendar', app_type: AppType.GOOGLE_CALENDAR },
                { name: 'Monday.com', app_type: AppType.MONDAY },
                { name: 'Linear', app_type: AppType.LINEAR },
            ];

            // Filter out the apps that are already in the API response to avoid duplicates
            const newConnectors = additionalApps
                .filter(app => !existingAppTypes.has(app.app_type))
                .map(app => ({
                    // Create a connector object that matches your state's data structure
                    org_connector: {
                        id: `new-app-${app.app_type}`, // A unique, client-side ID
                        name: app.name,
                        app_type: app.app_type,
                        // Add any other required properties from the 'Connector' type with default values
                    } as Connector,
                    user_connector: null, // These are not connected by default
                    isComingSoon: true, // Mark these as coming soon
                }));

            // Combine the connectors from the API with your new, hardcoded list
            setConnectors([...apiConnectors, ...newConnectors]);

            // --- END: MODIFIED CODE ---

        } catch (err) {
            console.log(err);
            // Optional: You could decide to show the hardcoded list even if the API fails
        }
        setConnectorsLoading(false);
    };


    useEffect(() => {
        getConnectors()
    }, [])

    return (
        <div>
            <div
                className="w-[calc(100vw_-_245px)] relative"
                style={{
                    backgroundImage: `
                linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
                `,
                    backgroundSize: '20px 20px',
                }}
            >
                <Carousel>
                    <Image src="/images/JiraBanner.png" alt="Jira" width={1500} height={1500} className="w-full h-full object-cover" />
                    <Image src="/images/SlackBanner.png" alt="Slack" width={1500} height={1500} className="w-full h-full object-cover" />
                    <Image src="/images/SalesforceBanner.png" alt="Salesforce" width={1500} height={1500} className="w-full h-full object-cover" />
                </Carousel>
            </div>
            <Tabs defaultValue="account" className="mt-4">
                <TabsList className="inline-flex h-9 items-center text-muted-foreground w-full justify-start rounded-none border-b bg-transparent p-0">
                    <TabsTrigger value='account' className="inline-flex items-center justify-center space-x-2 whitespace-nowrap py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative h-9 rounded-none border-b border-b-transparent bg-transparent px-4 pb-5 pt-2 text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:bg-transparent" onClick={() => setActiveTab("all_connectors")}>
                        <LayoutIcon strokeColor={activeTab === "all_connectors" ? "#1C1C21" : "#808080"} />
                        <p className='text-sm'>All Connectors</p>
                    </TabsTrigger>
                    <TabsTrigger value='password' className="inline-flex items-center justify-center space-x-2 whitespace-nowrap py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative h-9 rounded-none border-b border-b-transparent bg-transparent px-4 pb-5 pt-2 text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:bg-transparent" onClick={() => setActiveTab("installed")}>
                        <DownloadIcon fillColor={activeTab === "installed" ? "#1C1C21" : "#808080"} />
                        <p className='text-sm'>Installed</p>
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="account">
                    <div className="mt-3 grid gap-6 md:grid-cols-2 mx-5">
                        {connectors.map((connector, i) => (
                            <div key={connector.org_connector.id} className="flex items-center justify-between pt-1 pb-4 px-3 border-b transition-shadow duration-200">
                                <div className="flex items-center space-x-4">
                                    <div className='w-8 h-8 flex items-center justify-center'>
                                        <GetAppLogo appType={connector.org_connector.app_type} />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-gray-800 text-sm">{connector.org_connector.name}</h3>
                                        <p className="text-xs text-[#525664]">{APP_DESCRIPTIONS_MAP[connector.org_connector.app_type]}</p>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        if (!(connector as any).isComingSoon) {
                                            addPanel({
                                                panelId: `connector-view-${connector.org_connector.id}`,
                                                fullVisible: true,
                                                component: <ConnectorView orgConnectorId={connector.org_connector.id} getConnectors={getConnectors} />,
                                                panelType: PanelTypes.CONNECTOR_VIEW,
                                                closeAll: true
                                            })
                                        }
                                    }}
                                    disabled={(connector as any).isComingSoon}
                                    className='text-xs'
                                >
                                    {(connector as any).isComingSoon ? 'Coming Soon' : (connector.user_connector?.connected ? new Date("2025-09-04T08:35:13.058Z") > new Date(connector.user_connector.updated_at) ? 'Update' : 'Connected' : 'Add')}
                                </Button>
                            </div>
                        ))}
                    </div>
                </TabsContent>
                <TabsContent value="password">
                    <div className="mt-3 grid gap-6 md:grid-cols-2 mx-5">
                        {connectors.filter(c => c.user_connector?.connected).map((connector, i) => (
                            <div key={connector.org_connector.id} className="flex items-center justify-between pt-1 pb-4 px-3 border-b transition-shadow duration-200">
                                <div className="flex items-center space-x-4">
                                    <div className='w-8 h-8 flex items-center justify-center'>
                                        <GetAppLogo appType={connector.org_connector.app_type} />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-gray-800 text-sm">{connector.org_connector.name}</h3>
                                        <p className="text-xs text-[#525664]">{APP_DESCRIPTIONS_MAP[connector.org_connector.app_type]}</p>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        if (!(connector as any).isComingSoon) {
                                            addPanel({
                                                panelId: `connector-view-${connector.org_connector.id}`,
                                                fullVisible: true,
                                                component: <ConnectorView orgConnectorId={connector.org_connector.id} getConnectors={getConnectors} />,
                                                panelType: PanelTypes.CONNECTOR_VIEW,
                                                closeAll: true
                                            })
                                        }
                                    }}
                                    disabled={(connector as any).isComingSoon}
                                    className='text-xs'
                                >
                                    {(connector as any).isComingSoon ? 'Coming Soon' : (connector.user_connector?.connected ? new Date("2025-09-04T08:35:13.058Z") > new Date(connector.user_connector.updated_at) ? 'Update' : 'Connected' : 'Add')}
                                </Button>
                            </div>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}