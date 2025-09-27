import ConfigContext from "@/contexts/config-context";
import { createAuthClient } from "better-auth/react"
import { useContext, useEffect, useMemo, useState } from "react"

let authClientInstance: ReturnType<typeof createAuthClient> | null = null;

export const useAuthClient = () => {
    const configContext = useContext(ConfigContext);
    
    if (!authClientInstance) {
        authClientInstance = createAuthClient({
            baseURL: `${configContext!.SERVER_URL}/internal/auth`
        });
    }

    return authClientInstance;
}