"use client";
import { useAuthClient } from '@/utils/authClient';
import { createContext, useContext, useEffect, useState, useMemo } from 'react';

type SessionType = {
    user: {
        id: string;
        name: string | null;
        email: string;
        emailVerified: boolean;
        createdAt: Date;
        updatedAt: Date;
        image?: string | null | undefined | undefined;
    };
    session: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        token: string;
        ipAddress?: string | null | undefined | undefined;
        userAgent?: string | null | undefined | undefined;
    };
}

interface UserContextType {
    isLoading: boolean;
    session: SessionType | null
}

const AuthContext = createContext<UserContextType>({ isLoading: true, session: null });

export const AuthProvider = ({ children }: any) => {
    const authClient = useAuthClient();

    const { 
        data: session, 
        isPending,
        error,
        refetch
    } = authClient.useSession();

    const [user, setUser] = useState<UserContextType>({ isLoading: true, session: null });

    useEffect(() => {
        if (!isPending) {
            setUser({ isLoading: false, session })
        }
    }, [isPending, session])

  return <AuthContext.Provider value={user} children={children} />;
};

export default AuthContext;