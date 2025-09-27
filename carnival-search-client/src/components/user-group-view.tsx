import { User, UserGroup } from "@/types/schema_types";
import { useContext, useEffect, useState } from "react";
import CustomToast from "./toast";
import { useApiClient } from "@/utils/axios";
import { X } from "lucide-react";
import DashboardPanelsContext from "@/contexts/dashboard-panel-context";
import dayjs from "dayjs";
import { Button } from "./ui/button";
import { MultiSelect } from "./ui/multiselect";
import Avatar from "./elements/Avatar";
import CustomInput from "./elements/CustomInput";

const UserGroupView = (props: { groupId: string }) => {
    const { closePanel } = useContext(DashboardPanelsContext);
    const api_client = useApiClient();

    const [group, setGroup] = useState<(UserGroup & { users: User[] }) | null>(null);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [isEditing, setIsEditing] = useState(false);

    const [updateGroupData, setUpdateGroupData] = useState<{ name: string, description: string | null } | null>(null);
    const [updatedGroupUsers, setUpdatedGroupUsers] = useState<{ label: string, value: string }[]>([]);

    const getGroupDetails = async () => {
        try {
            const response = await api_client.get(`/internal/user/user-group/${props.groupId}`);
            setGroup(response.data);
            setUpdateGroupData({ name: response.data.name, description: response.data.description });
            setUpdatedGroupUsers(response.data.users.map((user: User) => ({ label: user.display_name, value: user.id })));
        } catch (err) {
            CustomToast({ message: "Error fetching group details" });
        }
    };

    const getAllUsers = async () => {
        try {
            const response = await api_client.get(`/internal/user/org-users`);
            setAllUsers(response.data);
        } catch (err) {
            CustomToast({ message: "Error fetching users" });
        }
    };

    const handleUpdateGroup = async () => {
        try {
            await api_client.put(`/internal/user/user-group/${props.groupId}`, {
                name: updateGroupData!.name,
                description: updateGroupData!.description
            });
            await getGroupDetails();
        } catch (err) {
            CustomToast({ message: "Error updating group" });
        }
    };

    const handleGroupUsersUpdate = async () => {
        try {
            await api_client.put(`/internal/user/user-group/${props.groupId}`, {
                user_ids: updatedGroupUsers.map(user => user.value)
            });
            await getGroupDetails();
            setIsEditing(false);
        } catch (err) {
            CustomToast({ message: "Error updating group users" });
        }
    }

    useEffect(() => {
        getGroupDetails();
        getAllUsers();
    }, []);

    return (
        <div className="overflow-hidden border-l w-screen sm:w-[480px] shadow-[0_2px_12px_0_hsla(228_10%_8%_/0.12),0_0_6px_0_hsla(228_10%_8%_/0.05)]">
            <div className="py-6 px-6 border-b">
                <div className="flex justify-end items-center">
                    <X
                        className="w-5 h-5 cursor-pointer text-gray-500 hover:text-black"
                        onClick={() => closePanel(`group-view-${props.groupId}`)}
                    />
                </div>
                <div className="flex h-full">
                    <div className="w-[480px]">
                        {group ? (
                            <div>
                                <div className="py-4">
                                    <div className="flex items-center space-x-2 mt-3">
                                        <label className="w-[100px] text-sm text-gray-600">
                                            Name
                                        </label>
                                        <CustomInput
                                            value={
                                                updateGroupData?.name || ""
                                            }
                                            onChange={(val) =>
                                                setUpdateGroupData((prev) => ({
                                                    ...prev!,
                                                    name: val,
                                                }))
                                            }
                                            onBlur={handleUpdateGroup}
                                        />
                                    </div>
                                    <div className="flex items-center space-x-2 mt-3">
                                        <label className="w-[100px] text-sm text-gray-600">
                                            Description
                                        </label>
                                        <CustomInput
                                            value={
                                                updateGroupData?.description || ""
                                            }
                                            onChange={(val) =>
                                                setUpdateGroupData((prev) => ({
                                                    ...prev!,
                                                    description: val,
                                                }))
                                            }
                                            onBlur={handleUpdateGroup}
                                        />
                                    </div>
                                    <div className="flex items-center space-x-2 mt-3">
                                        <label className="w-[100px] text-sm text-gray-600">
                                            Created Date
                                        </label>
                                        <CustomInput
                                            value={
                                                dayjs(
                                                    group.created_at
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

            <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg">Group Members</h3>
                    <Button
                        variant="outline"
                        onClick={() => setIsEditing(!isEditing)}
                        className="font-normal"
                    >
                        {isEditing ? "Cancel" : "Edit Members"}
                    </Button>
                </div>

                {isEditing ? (
                    <div className="space-y-4">
                        <MultiSelect
                            options={allUsers.map(user => ({
                                label: user.display_name!,
                                value: user.id
                            }))}
                            selectedValues={updatedGroupUsers || []}
                            setSelectedValues={(selected) => setUpdatedGroupUsers(selected)}
                            placeholder="Select users"
                        />
                        <Button
                            className="w-full"
                            onClick={handleGroupUsersUpdate}
                        >
                            Update users
                        </Button>
                    </div>
                ) : (
                    <div className="h-[calc(100vh-400px)] overflow-y-auto">
                        <div className="space-y-3">
                            {group?.users.map((user) => (
                                <div key={user.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                                    <Avatar
                                        name={user.display_name!}
                                        color_type={user.color}
                                        className="h-8 w-8 rounded-md text-sm"
                                    />
                                    <div>
                                        <p className="">{user.display_name}</p>
                                        <p className="text-xs text-gray-500">{user.email}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserGroupView; 