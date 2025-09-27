import { useApiClient } from "@/utils/axios";
import React, { useContext, useEffect, useState } from "react";
import { TbLogout } from "react-icons/tb";
import Loader from "../loader";
import { IoLogOutOutline, IoSettingsOutline } from "react-icons/io5";
import { CiSquarePlus } from "react-icons/ci";
import { useRouter } from "next/navigation";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import CustomToast from "../toast";
import { User } from "@/types/schema_types";
import Avatar from "../elements/Avatar";
import { useAuthClient } from "@/utils/authClient";

const SidebarBottom = ({
    expanded,
}: {
    expanded: boolean;
}) => {
    const api_client = useApiClient();
    const authClient = useAuthClient();

    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await authClient.signOut();
        } catch (err) { }
    };

    const getUser = async () => {
        try {
            const response = await api_client.get("/internal/user");
            setUser(response.data);
            setLoading(false);
        } catch (err) {
            CustomToast({
                message: "Failed to fetch user data",
            });
        }
    };

    useEffect(() => {
        getUser();
    }, []);

    return (
        <div
            className={`border-1 flex py-2 transition-all ${expanded ? "border-gray-200" : "border-transparent"
                }`}
        >
            {loading || !user ? (
                <div className="flex justify-center h-10 w-10 bg-gray-50 rounded-lg">
                    
                </div>
            ) : (
                <div
                    className={`flex items-center w-full ${expanded ? "justify-between" : "justify-center"
                        }`}
                >
                    <div className="flex items-center justify-between w-full space-x-2 p-1.5">
                        <DropdownMenu>
                            <DropdownMenuTrigger className="outline-none border-none">
                                <div className="flex justify-center">
                                    <Avatar
                                        name={user.display_name ?? "-"}
                                        color_type={user.color}
                                        className="h-10 w-10 rounded-lg"
                                    />
                                </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-[150px] ml-6">
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-xs font-medium">{user.display_name}</p>
                                        <p className="text-xs text-gray-500">{user.email}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="flex items-center space-x-2 cursor-pointer"
                                    onClick={() => router.push("/settings/general")}
                                >
                                    <IoSettingsOutline size={15} />
                                    <p className="text-xs font-medium">Settings</p>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    className="flex items-center space-x-2 cursor-pointer"
                                    onClick={() => handleLogout()}
                                >
                                    <IoLogOutOutline size={15} />
                                    <p className="text-xs font-medium">Logout</p>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        {/* <IoSettingsOutline size={16} className="cursor-pointer" onClick={() => router.push("/settings/workspace")} /> */}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SidebarBottom;
