'use client';

import Loader from "@/components/loader";
import CustomToast from "@/components/toast";
import { Org, UserInvitation } from "@/types/schema_types";
import { useApiClient } from "@/utils/axios";
import ProtectedRoute from "@/utils/protectedRoute";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

const Invitations = () => {
    const router = useRouter();
    const api_client = useApiClient();

    const [invitations, setInvitations] = useState<(UserInvitation & { org: Org })[] | null>(null);
    const [isAcceptingInvite, setIsAcceptingInvite] = useState(false);

    const acceptInvite = async (inviteId: string) => {
        setIsAcceptingInvite(true);
        try {
            await api_client.post(`/internal/user/accept-invite`, {
                invitation_id: inviteId
            })
            router.push("/onboarding/info");
        } catch (err) {
            CustomToast({ message: "Failed to accept invite" });
        }
    }

    const getInvites = async () => {
        try {
            const response = await api_client.get('/internal/user/invites');
            if (!response.data.length) {
                router.push('/onboarding/create-org');
            } else {
                setInvitations(response.data);
            }
        } catch (err) {
            CustomToast({ message: "Failed to get invites" })
        }
    }

    useEffect(() => {
        getInvites();
    }, [])

    return (
        invitations ? <div className="flex flex-col items-center justify-center min-h-screen p-4 gap-6">
            <Card className="w-full max-w-xl">
                <CardContent className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Your Invitations</h2>
                    <ScrollArea className="h-[400px] pr-4">
                        {invitations.map((invite) => (
                            <div key={invite.id} className="mb-4 py-2 px-4 border rounded-lg flex justify-between items-center">
                                <p className="text-sm font-medium">
                                    {invite.org.name}
                                </p>
                                <Button onClick={() => acceptInvite(invite.id)} disabled={isAcceptingInvite}>
                                    {isAcceptingInvite ? "Joining..." : "Accept"}
                                </Button>
                            </div>
                        ))}
                    </ScrollArea>
                </CardContent>
            </Card>
            <Button
                onClick={() => router.push('/onboarding/create-org')}
                className="w-full max-w-xl"
            >
                Create New Workspace &nbsp; {"->"}
            </Button>
        </div> : <Loader global={true} />
    )
}

export default ProtectedRoute(Invitations)