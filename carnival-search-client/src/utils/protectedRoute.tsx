"use client";

import AuthContext from "@/contexts/auth-context";
import { useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Loader from "@/components/loader";
import { User } from "@/types/schema_types";
import { useApiClient } from "./axios";

export default function ProtectedRoute(Component: any) {
    return function ProtectedComponent(props: any) {
        const api_client = useApiClient();
        const router = useRouter();
        const pathname = usePathname();

        const userContext = useContext(AuthContext);
        const [user, setUser] = useState<User | null>(null);
        const [noOrgFound, setNoOrgFound] = useState(false);

        const getUser = async () => {
            try {
                const response = await api_client.get(`/internal/user`);
                setUser(response.data);
            } catch (err: any) {
                if (err?.response?.data?.message === "no_org_found") {
                    setNoOrgFound(true);
                }
            }
        }

        useEffect(() => {
            getUser();
        }, [])

        useEffect(() => {
            if (userContext.isLoading) {
                return;
            }

            if (!userContext.session) {
                router.push("/onboarding/auth/login");
                return;
            }

            if (noOrgFound && pathname !== "/onboarding/invitations" && pathname !== "/onboarding/create-org") {
                router.push("/onboarding/invitations");
                return;
            }
            
            if (!user) {
                return;
            }
            
            if (!user.fk_user_last_logged_in_org && pathname !== "/onboarding/invitations" && pathname !== "/onboarding/create-org") {
                router.push("/onboarding/invitations");
                return;
            }

            if (!user.display_name && pathname !== "/onboarding/info") {
                router.push("/onboarding/info");
                return;
            }

            if (pathname === "/") {
                router.push("/dashboard/chat");
                return;
            }

            if (user.fk_user_last_logged_in_org && (pathname === "/onboarding/invitations" || pathname === "/onboarding/create-org")) {
                router.push("/dashboard/chat");
                return;
            }

            if (user.display_name && pathname === "/onboarding/info") {
                router.push("/dashboard/chat");
                return;
            }
        }, [userContext, user, noOrgFound]);

        if (userContext.isLoading) {
            return <Loader global={true} />;
        }

        if (!userContext.session) {
            return <Loader global={true} />;
        }

        return <Component {...props} />;
    };
}
