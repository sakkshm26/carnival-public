'use client'

import CustomTableHead from "@/components/elements/CustomTableHead";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { OrgUserRole, UserInvitation } from "@/types/schema_types";
import { useApiClient } from "@/utils/axios";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import ProtectedRoute from "@/utils/protectedRoute";
import CustomToast from "@/components/toast";
import { convertValueToName } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const UserInvitations = () => {
    const api_client = useApiClient();
    
    const [invitations, setInvitations] = useState<UserInvitation[]>([])
    const [activeDeleteInvitationId, setActiveDeleteInvitationId] = useState<string | null>(null);
    const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
    const [inviteData, setInviteData] = useState({
        email: "",
        role: OrgUserRole.READ_ONLY
    });

    const getInvitations = async () => {
        try {
            const response = await api_client.get(`/internal/org/user-invites`);
            setInvitations(response.data);
        } catch (error) {
            CustomToast({ message: "Failed to get user invitations" })
        }
    }

    const handleInviteUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api_client.post('/internal/org/user-invites', {
                email: inviteData.email,
                role: inviteData.role
            })
            setIsInviteDialogOpen(false);
            setInviteData({ email: "", role: OrgUserRole.READ_ONLY });
            CustomToast({ message: "User invited successfully" })
            getInvitations()
        } catch (err: any) {
            CustomToast({ message: err?.response?.data?.message || "Something went wrong" })
        }
    };

    const handleDeleteInvitation = async () => {
        try {
            await api_client.delete(`/internal/org/user-invites/${activeDeleteInvitationId}`);
            CustomToast({ message: "Invite deleted successfully" })
            setActiveDeleteInvitationId(null)
            getInvitations()
        } catch (error) {
            CustomToast({ message: "Failed to delete invitation" })
        }
    }

    useEffect(() => {
        getInvitations()
    }, [])

    return (
        <div className="mx-auto relative h-full">
            <div className="sticky top-0 z-10 bg-white flex justify-between items-center pt-6 pb-3 px-8">
                <h1 className="text-[16px]">
                    <span className="text-black">User Invitations</span> &nbsp;/&nbsp;
                    <span className="text-gray-500 text-[14px]">
                        {invitations.length}
                    </span>
                </h1>
                <Button
                    variant="outline"
                    className="rounded-lg bg-[#3334FE] text-white hover:bg-[#2a2bd9] hover:text-white h-9"
                    onClick={() => setIsInviteDialogOpen(true)}
                >
                    <Plus className="h-4 w-4 mr-1" />{" "}
                    <p className="text-[14px] font-[400]">Invite</p>
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
                                title="Email"
                                includePipe={false}
                                className="w-[100px] pl-5"
                                allowSort={false}
                            />
                            <CustomTableHead
                                title="Status"
                                includePipe={true}
                                className="w-[100px]"
                                allowSort={false}
                            />
                            <CustomTableHead
                                title="Role"
                                includePipe={true}
                                className="w-[150px]"
                                allowSort={false}
                            />
                            <CustomTableHead
                                title=""
                                includePipe={true}
                                className="w-[150px]"
                                allowSort={false}
                            />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {invitations.map((invitation, ind) => (
                            <TableRow
                                key={ind}
                                onClick={() => {

                                }}
                                className="text-sm"
                            >
                                <TableCell className="h-14 pl-5">
                                    {
                                        invitation.email
                                    }
                                </TableCell>
                                <TableCell>{convertValueToName(invitation.status)}</TableCell>
                                <TableCell>{convertValueToName(invitation.role)}</TableCell>
                                <TableCell>
                                    <Trash2 className="h-4 w-4 text-[#D11A2A] cursor-pointer" onClick={() => setActiveDeleteInvitationId(invitation.id)} />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {!invitations.length ? (
                    <div className="flex flex-col justify-center items-center mt-10 text-gray-500 text-sm">
                        <p>No invitations created</p>
                    </div>
                ) : null}
            </div>

            <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
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
                                onClick={() => setIsInviteDialogOpen(false)}
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

            <Dialog
                open={!!activeDeleteInvitationId}
                onOpenChange={(val) =>
                    val ? null : setActiveDeleteInvitationId(null)
                }
            >
                <DialogContent className="overflow-y-hidden">
                    <DialogHeader>
                        <DialogTitle className="text-base font-normal">
                            Are you sure you want to delete this invitation?
                        </DialogTitle>
                        <DialogFooter className="flex items-center space-x-4 pt-5">
                            <Button
                                variant="outline"
                                onClick={() => setActiveDeleteInvitationId(null)}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="bg-red-700 text-white hover:bg-red-900"
                                onClick={handleDeleteInvitation}
                            >
                                Delete
                            </Button>
                        </DialogFooter>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default ProtectedRoute(UserInvitations)