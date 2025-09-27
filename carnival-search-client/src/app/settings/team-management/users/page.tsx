'use client'

import CustomTableHead from "@/components/elements/CustomTableHead";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { OrgUserRole, User } from "@/types/schema_types";
import { useApiClient } from "@/utils/axios";
import dayjs from "dayjs";
import { Plus } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectValue, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import CustomToast from "@/components/toast";
import ProtectedRoute from "@/utils/protectedRoute";
import { convertValueToName } from "@/lib/utils";
import DashboardPanelsContext, { PanelTypes } from "@/contexts/dashboard-panel-context";
import UserView from "@/components/user-view";
import Avatar from "@/components/elements/Avatar";

const Users = () => {
    const { addPanel } = useContext(DashboardPanelsContext);
    const api_client = useApiClient();
    
    const [users, setUsers] = useState<(User & { role: OrgUserRole })[]>([])
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [inviteData, setInviteData] = useState({
        email: "",
        role: OrgUserRole.READ_ONLY
    });

    const getUsers = async () => {
        try {
            const response = await api_client.get(`/internal/user/org-users`)
            setUsers(response.data)
        } catch (error) {
            console.log(error)
        }
    }

    const handleInviteUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api_client.post('/internal/org/user-invites', {
                email: inviteData.email,
                role: inviteData.role
            })
            setIsDialogOpen(false);
            setInviteData({ email: "", role: OrgUserRole.READ_ONLY });
            CustomToast({ message: "User invited successfully" })
        } catch (err: any) {
            CustomToast({ message: err?.response?.data?.message || "Something went wrong" })
        }
    };

    useEffect(() => {
        getUsers()
    }, [])

    return (
        <div className="mx-auto relative h-full">
            <div className="sticky top-0 z-10 bg-white flex justify-between items-center pt-6 pb-3 px-8">
                <h1 className="text-[16px]">
                    <span className="black">Users</span> &nbsp;/&nbsp;
                    <span className="text-gray-500 text-[14px]">
                        {users.length}
                    </span>
                </h1>
                <Button
                    variant="outline"
                    className="rounded-lg bg-[#3334FE] text-white hover:bg-[#2a2bd9] hover:text-white h-9"
                    onClick={() => setIsDialogOpen(true)}
                >
                    <Plus className="h-4 w-4 mr-1" />{" "}
                    <p className="text-[14px] font-[400]">Invite</p>
                </Button>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
                    <DialogHeader>
                        <DialogTitle className="text-base font-medium">Invite User</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleInviteUser} className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="user-email">Email</Label>
                            <Input
                                id="user-email"
                                type="email"
                                value={inviteData.email}
                                onChange={(e) => setInviteData(prev => ({ ...prev, email: e.target.value }))}
                                placeholder="Enter email address"
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="user-role">Role</Label>
                            <Select
                                value={inviteData.role}
                                onValueChange={(val: OrgUserRole) =>
                                    setInviteData((prev) => ({
                                        ...prev,
                                        role: val,
                                    }))
                                }
                                required
                            >
                                <SelectTrigger id="user-role" className="mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={OrgUserRole.ADMIN}>Admin</SelectItem>
                                    <SelectItem value={OrgUserRole.READ_ONLY}>Read Only</SelectItem>
                                </SelectContent>
                            </Select>
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
                                Send Invite
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <div
                className="overflow-x-auto relative overflow-auto pb-12"
                style={{ height: "calc(100vh - 120px)" }}
            >
                <Table className="text-base">
                    <TableHeader className="sticky top-0 bg-white">
                        <TableRow>
                            <CustomTableHead
                                title="Display Name"
                                includePipe={false}
                                className="w-[100px] pl-5"
                                allowSort={false}
                            />
                            <CustomTableHead
                                title="Email"
                                includePipe={true}
                                className="w-[100px]"
                                allowSort={false}
                            />
                            <CustomTableHead
                                title="Role"
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
                        {users.map((user, ind) => (
                            <TableRow
                                key={ind}
                                onClick={() => {
                                    addPanel({
                                        panelId: `user-view-${user.id}`,
                                        fullVisible: true,
                                        component: <UserView userId={user.id} />,
                                        panelType: PanelTypes.USER_VIEW,
                                        closeAll: true
                                    })
                                }}
                                className="text-sm cursor-pointer"
                            >
                                <TableCell className="h-14 pl-5 flex items-center space-x-3">
                                    <Avatar
                                        name={user.display_name!}
                                        color_type={user.color}
                                        className="h-8 w-8 rounded-md text-sm"
                                    />
                                    <p>{
                                        user.display_name
                                    }</p>
                                </TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>{convertValueToName(user.role)}</TableCell>
                                <TableCell>
                                    {dayjs(user.created_at).format(
                                        "h:mm A, MMM D YYYY"
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}

export default ProtectedRoute(Users);