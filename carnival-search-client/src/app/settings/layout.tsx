"use client";

import { SidebarContext } from "@/contexts/sidebar-context";
import ProtectedRoute from "@/utils/protectedRoute";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { ArrowLeft, AtSign, Building2, ChevronLeft, ChevronRight, SlidersHorizontal, User, Users } from "lucide-react";
import SidebarItem from "@/components/sidebarItem";
import { Toaster } from "@/components/ui/sonner";
import Panels from "@/components/panels";
import SidebarItem2 from "@/components/sidebarItem2";
import Image from "next/image";
import ConnectorIcon from "@/components/icons/ConnectorIcon";
import AgentsIcon from "@/components/icons/AgentsIcon";
import GeneralIcon from "@/components/icons/GeneralIcon";

const SettingsLayout = ({ children, params }: any) => {
    const router = useRouter();
    const pathname = usePathname();

    const [sidebarExpaned, setSidebarExpanded] = useState(true);
    const [activeTab, setActiveTab] = useState(
        pathname.split("/").slice(2).join("/")
    );

    useEffect(() => {
        setActiveTab(pathname.split("/").slice(2).join("/"));
    }, [pathname]);

    return (
        <div className="flex h-screen overflow-hidden">
            <aside
                className={`h-full flex-shrink-0 flex flex-col bg-[#F9FAFA] border-r border-[#EFEFEF] shadow-sm transition-all relative z-20
                    ${sidebarExpaned ? "w-[240px]" : "w-16"}`}
            >
                <SidebarContext.Provider
                    value={{ expanded: sidebarExpaned }}
                >
                    <div className="flex items-center ml-5 mt-4 cursor-pointer" onClick={() => router.push(`/dashboard/chat`)}>
                        <ChevronLeft
                            className="w-5 h-5 text-[#525664]"
                        />
                        <p className="ml-2 text-[#525664] text-sm">Settings</p>
                    </div>
                    <div className="flex justify-center">
                        <hr className="mt-4 mb-2 w-[90%] border-[#EFEFEF]" />
                    </div>
                    <ul className="flex-1 px-3">
                        <SidebarItem2
                            icon={<GeneralIcon width={16} height={16} color="#292B2F" />}
                            text="General"
                            href={`/settings/general`}
                            active={activeTab === "general"}
                            setExpanded={setSidebarExpanded}
                        />
                        <div className="my-1"></div>
                        <SidebarItem2
                            icon={<User size={16} className="mr-[1.5px]" color="#292B2F" />}
                            text="Account"
                            href={`/settings/account`}
                            active={activeTab === "account"}
                            setExpanded={setSidebarExpanded}
                        />
                        <hr className="my-3 border-[#EFEFEF]" />
                        <div className="my-2"></div>
                        <SidebarItem2
                            icon={<AgentsIcon width={18} height={18} color="#9CA3AF" />}
                            text="Agent Swarm"
                            /* items={[
                                {
                                    text: "Library",
                                    href: "/settings/agent/library",
                                    active: activeTab === "agent/library"
                                },
                                {
                                    text: "My Agents",
                                    href: "/settings/agent/my-agents",
                                    active: activeTab === "agent/my-agents"
                                },
                            ]} */
                            setExpanded={setSidebarExpanded}
                        />
                        <div className="my-4"></div>
                        <SidebarItem2
                            icon={<AtSign size={16} color="#292B2F" />}
                            text="Team Management"
                            items={[
                                {
                                    text: "Groups",
                                    href: "/settings/team-management/groups",
                                    active: activeTab === "team-management/groups"
                                },
                                {
                                    text: "Users",
                                    href: "/settings/team-management/users",
                                    active: activeTab === "team-management/users"
                                },
                                {
                                    text: "Invitations",
                                    href: "/settings/team-management/invitations",
                                    active: activeTab === "team-management/invitations"
                                }
                            ]}
                            setExpanded={setSidebarExpanded}
                        />
                        <div className="my-4"></div>
                        <SidebarItem2
                            icon={<ConnectorIcon width={18} height={18} color="#292B2F" />}
                            text="Integrations"
                            items={[
                                {
                                    text: "Apps",
                                    href: "/settings/integrations/apps",
                                    active: activeTab === "integrations/apps"
                                }
                            ]}
                            setExpanded={setSidebarExpanded}
                        />
                    </ul>
                </SidebarContext.Provider>
                {/* <div
                    className={`flex p-3 ${sidebarExpaned ? "justify-end" : "justify-center"}`}
                >
                    {sidebarExpaned ? (
                        <div
                            className="p-1.5 bg-white rounded-full hover:bg-gray-50 border border-gray-100 shadow-sm cursor-pointer"
                            onClick={() => setSidebarExpanded(!sidebarExpaned)}
                        >
                            <ChevronLeft
                                className={`
            h-5 w-5 transition-all duration-300 ease-in-out
            `}
                            />
                        </div>
                    ) : (
                        <div
                            className="p-1.5 bg-white rounded-full hover:bg-gray-50 border border-gray-100 shadow-sm cursor-pointer"
                            onClick={() => setSidebarExpanded(!sidebarExpaned)}
                        >
                            <ChevronRight
                                className={`h-5 w-5 transition-all duration-300 ease-in-out`}
                            />
                        </div>
                    )}
                </div> */}
            </aside>
            <main className="flex-1 overflow-x-auto overflow-y-auto bg-[#FCFCFC]">
                <Toaster />
                <div className={`min-w-max h-full`}>{children}</div>
                <Panels />
            </main>
        </div>
    );
};

export default ProtectedRoute(SettingsLayout);
