"use client";

import Loader from "@/components/loader";
import { SidebarContext } from "@/contexts/sidebar-context";
import { User } from "@/types/schema_types";
import { useApiClient } from "@/utils/axios";
import ProtectedRoute from "@/utils/protectedRoute";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { ArrowLeft, BookOpen, ChevronLeft, ChevronRight, PlusIcon, Search, Sparkles, Users, Share2 } from "lucide-react";
import SidebarItem from "@/components/sidebarItem";
import { Toaster } from "@/components/ui/sonner";
import SidebarBottom from "@/components/sidebarBottom";
import Panels from "@/components/panels";
import Image from "next/image";
import { ChatIcon } from "@/components/icons/ChatIcon";
import { LibraryIcon } from "@/components/icons/LibraryIcon";

const DashboardLayout = ({ children, params }: any) => {
    const api_client = useApiClient();
    const pathname = usePathname();
    const router = useRouter()

    const [user, setUser] = useState<User | null>(null);
    const [sidebarExpaned, setSidebarExpanded] = useState(false);
    const [activeTab, setActiveTab] = useState(
        pathname.split("/").slice(2).join("/")
    );

    const getUser = async () => {
        try {
            const response = await api_client.get("/internal/user");
            setUser(response.data);
        } catch (err: any) {

        }
    };

    useEffect(() => {
        getUser();
    }, []);

    useEffect(() => {
        setActiveTab(pathname.split("/").slice(2).join("/"));
    }, [pathname]);

    return user && user.fk_user_last_logged_in_org ? (
        <div className="flex h-screen overflow-hidden">
            <aside
                className={`h-full flex-shrink-0 flex flex-col items-center bg-[#F9FAFA] border-r border-[#EFEFEF] shadow-sm transition-all ${sidebarExpaned ? "w-64" : "w-16 z-10"
                    }`}
            >
                <SidebarContext.Provider
                    value={{ expanded: sidebarExpaned }}
                >
                    <SidebarBottom
                        expanded={sidebarExpaned}
                    />
                    <div className="h-8"></div>
                    <div className="flex justify-center bg-[#EAEAEB] p-2.5 rounded-full cursor-pointer" onClick={() => {
                        router.push("/dashboard/chat")
                    }}>
                        <PlusIcon className="w-5 h-5 text-[#16152C]" />
                    </div>
                    <div className="h-8"></div>
                    <ul className="flex-1 mt-1">
                        {/* <SidebarItem
                            icon={<Search size={16} />}
                            text="Search"
                            href={`/dashboard/search`}
                            active={activeTab === "search"}
                            setExpanded={setSidebarExpanded}
                        />
                        <div className="my-2"></div> */}
                        <SidebarItem
                            icon={<ChatIcon width={24} height={24} color={activeTab === "chat" || /^chat\/[a-f0-9-]+$/.test(activeTab) ? "#16152C" : "#6B7280"} />}
                            text="Chat"
                            href={`/dashboard/chat`}
                            active={activeTab === "chat" || /^chat\/[a-f0-9-]+$/.test(activeTab)}
                            setExpanded={setSidebarExpanded}
                        />
                        {/* <div className="my-2"></div>
                        <SidebarItem
                            icon={<BookOpen size={16} />}
                            text="Knowledge Base"
                            href={`/dashboard/knowledge-base`}
                            active={activeTab === "knowledge-base"}
                            setExpanded={setSidebarExpanded}
                        /> */}
                        <div className="my-4"></div>
                        <SidebarItem
                            icon={<LibraryIcon width={21} height={21} color={activeTab === "history" ? "#16152C" : "#6B7280"} />}
                            text="History"
                            href={`/dashboard/history`}
                            active={activeTab === "history"}
                            setExpanded={setSidebarExpanded}
                        />
                    </ul>
                    <div className="mt-auto mb-4">
                        <SidebarItem
                            icon={<Share2 size={20} className="w-10" color={activeTab === "share" ? "#16152C" : "#6B7280"} />}
                            text=""
                            href={`/settings/team-management/invitations`}
                            active={activeTab === "share"}
                            setExpanded={setSidebarExpanded}
                        />
                    </div>
                </SidebarContext.Provider>
                {/* <div
                    className={`flex p-3 ${sidebarExpaned ? "justify-end" : "justify-center"
                        }`}
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
                <div className={`h-full ${activeTab !== "chat" || sidebarExpaned ? "min-w-max" : "w-full"}`}>{children}</div>
                <Panels />
            </main>
        </div>
    ) : (
        <Loader global={true} />
    );
};

export default ProtectedRoute(DashboardLayout);
