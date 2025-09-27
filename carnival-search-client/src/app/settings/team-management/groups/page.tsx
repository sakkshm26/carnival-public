'use client'

import CustomTableHead from "@/components/elements/CustomTableHead";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { User, UserGroup } from "@/types/schema_types";
import { useApiClient } from "@/utils/axios";
import dayjs from "dayjs";
import { Plus } from "lucide-react";
import { useEffect, useState, useContext } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/multiselect";
import ProtectedRoute from "@/utils/protectedRoute";
import CustomToast from "@/components/toast";
import DashboardPanelsContext, { PanelTypes } from "@/contexts/dashboard-panel-context";
import UserGroupView from "@/components/user-group-view";

const UserGroups = () => {
    const { addPanel } = useContext(DashboardPanelsContext);
    const api_client = useApiClient();
    
    const [userGroups, setUserGroups] = useState<UserGroup[]>([])
    const [users, setUsers] = useState<User[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [addUserData, setAddUserData] = useState({ name: "", description: "", user_ids: [] })
    const [isLoading, setIsLoading] = useState(false)

    const getUserGroups = async () => {
        try {
            const response = await api_client.get(`/internal/user/user-group`)
            setUserGroups(response.data)
        } catch (error) {
            console.log(error)
        }
    }

    const getUsers = async () => {
        setIsLoading(true)
        try {
            const response = await api_client.get(`/internal/user/org-users`);
            setUsers(response.data)
        } catch (err) {
            console.log(err)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        getUserGroups()
        getUsers()
    }, [])

    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api_client.post(`/internal/user/user-group`, {
                name: addUserData.name,
                description: addUserData.description,
                user_ids: addUserData.user_ids.map((item: any) => item.value)
            })
            setIsDialogOpen(false);
            setAddUserData({ name: "", description: "", user_ids: [] })
            getUserGroups()
        } catch (err) {
            CustomToast({ message: "Failed to create group" })
        }
    };

    return (
        <div className="mx-auto relative h-full">
            <div className="sticky top-0 z-10 bg-white flex justify-between items-center pt-6 pb-3 px-8">
                <h1 className="text-[16px]">
                    <span className="text-black">User Groups</span> &nbsp;/&nbsp;
                    <span className="text-gray-500 text-[14px]">
                        {userGroups.length}
                    </span>
                </h1>
                <Button
                    variant="outline"
                    className="rounded-lg bg-[#3334FE] text-white hover:bg-[#2a2bd9] hover:text-white h-9"
                    onClick={() => setIsDialogOpen(true)}
                >
                    <Plus className="h-4 w-4 mr-1" />{" "}
                    <p className="text-[14px] font-[400]">Create</p>
                </Button>
            </div>
            <div
                className="overflow-x-auto relative overflow-auto pb-12"
                style={{ height: "calc(100vh - 120px)" }}
            >
                <Table className="text-base">
                    <TableHeader className="sticky top-0 bg-white">
                        <TableRow>
                            <CustomTableHead
                                title="Name"
                                includePipe={false}
                                className="w-[100px] pl-5"
                                allowSort={false}
                            />
                            <CustomTableHead
                                title="Description"
                                includePipe={true}
                                className="w-[100px]"
                                allowSort={false}
                            />
                            <CustomTableHead
                                title="Created Date"
                                includePipe={true}
                                className="w-[150px]"
                                allowSort={false}
                            />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {!isLoading && userGroups.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-8">
                                    <p className="text-gray-500 text-sm">No groups created</p>
                                </TableCell>
                            </TableRow>
                        ) : (
                            userGroups.map((userGroup, ind) => (
                                <TableRow
                                    key={ind}
                                    onClick={() => {
                                        addPanel({
                                            panelId: `group-view-${userGroup.id}`,
                                            fullVisible: true,
                                            component: <UserGroupView groupId={userGroup.id} />,
                                            panelType: PanelTypes.USER_GROUP_VIEW,
                                            closeAll: true
                                        })
                                    }}
                                    className="text-sm cursor-pointer"
                                >
                                    <TableCell className="h-14 pl-5">
                                        {
                                            userGroup.name
                                        }
                                    </TableCell>
                                    <TableCell>{userGroup.description}</TableCell>
                                    <TableCell>
                                        {dayjs(userGroup.created_at).format(
                                            "h:mm A, MMM D YYYY"
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
                    <DialogHeader>
                        <DialogTitle className="text-base font-medium">Create User Group</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateGroup} className="py-2 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="group-name">Name</Label>
                            <Input
                                id="group-name"
                                value={addUserData.name}
                                onChange={(e) => setAddUserData({ ...addUserData, name: e.target.value })}
                                placeholder="Enter group name"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="group-description">Description</Label>
                            <Input
                                id="group-description"
                                value={addUserData.description}
                                onChange={(e) => setAddUserData({ ...addUserData, description: e.target.value })}
                                placeholder="Enter group description"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Users</Label>
                            <MultiSelect
                                options={
                                    users.map((user) => ({ label: user.display_name!, value: user.id }))
                                }
                                selectedValues={addUserData.user_ids}
                                setSelectedValues={(newData) => {
                                    setAddUserData({ ...addUserData, user_ids: newData })
                                }}
                                placeholder="Search Users"
                                defaultOpen={false}
                            />
                        </div>
                        <div className="h-1"></div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit">
                                Create Group
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default ProtectedRoute(UserGroups);