import { User } from "@/types/schema_types";
import { useContext, useEffect, useState } from "react";
import CustomToast from "./toast";
import { useApiClient } from "@/utils/axios";
import Loader from "./loader";
import CustomInput from "./elements/CustomInput";
import { X } from "lucide-react";
import DashboardPanelsContext from "@/contexts/dashboard-panel-context";
import dayjs from "dayjs";
import Avatar from "./elements/Avatar";

const UserView = (props: { userId: string }) => {
    const { closePanel } = useContext(DashboardPanelsContext);
    const api_client = useApiClient();

    const [user, setUser] = useState<User | null>(null);

    const getUser = async () => {
        try {
            const response = await api_client.get(`/internal/user/${props.userId}`)
            setUser(response.data);
        } catch (err) {
            CustomToast({ message: "Error fetching user details" })
        }
    }

    useEffect(() => {
        getUser();
    }, [])

    return (
        <div
            className={`overflow-hidden border-l w-screen sm:w-[480px] shadow-[0_2px_12px_0_hsla(228_10%_8%_/0.12),0_0_6px_0_hsla(228_10%_8%_/0.05)]`}
        >
            <div className="py-6 px-6 border-b flex flex-col justify-center">
                <div className="flex justify-end items-center">
                    <X
                        className="w-5 h-5 cursor-pointer text-gray-500 hover:text-black"
                        onClick={() => closePanel(`user-view-${props.userId}`)}
                    />
                </div>
                <div className="flex flex-col space-y-5 items-center justify-center">
                    <Avatar
                        name={user?.display_name!}
                        color_type={user?.color!}
                        className="h-36 w-36 rounded-3xl text-5xl"
                    />
                    <p className="text-lg">{user?.display_name!}</p>
                </div>
            </div>
            <div className="flex h-full">
                <div className="w-[480px]">
                    {user ? (
                        <div>
                            <div className="py-4 px-7">
                                <div className="flex items-center space-x-2 mt-3">
                                    <label className="w-[100px] text-sm text-gray-600">
                                        Display Name
                                    </label>
                                    <CustomInput
                                        value={
                                            user.display_name!
                                        }
                                        extraProps={{ disabled: true }}
                                    />
                                </div>
                                <div className="flex items-center space-x-2 mt-3">
                                    <label className="w-[100px] text-sm text-gray-600">
                                        Email
                                    </label>
                                    <CustomInput
                                        value={
                                            user.email
                                        }
                                        extraProps={{ disabled: true }}
                                    />
                                </div>
                                <div className="flex items-center space-x-2 mt-3">
                                    <label className="w-[100px] text-sm text-gray-600">
                                        Created Date
                                    </label>
                                    <CustomInput
                                        value={
                                            dayjs(
                                                user.created_at
                                            ).format("h:mm A, MMM D YYYY")
                                        }
                                        extraProps={{ disabled: true }}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    )
}

export default UserView