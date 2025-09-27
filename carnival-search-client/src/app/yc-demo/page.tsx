'use client'

import { useAuthClient } from '@/utils/authClient';
import { useRouter } from 'next/navigation';
import React, { use, useEffect } from 'react'

const YCDemo = () => {
    const authClient = useAuthClient();
    const router = useRouter();

    const signIn = async () => {
        await (authClient.signIn.email)({
            email: "test1@gmail.com",
            password: "testpassword",
        });
        router.push("/dashboard/chat");
    }

    useEffect(() => {
        signIn();
    }, [])

    return (
        <div className='p-4 font-medium'>Signing in...</div>
    )
}

export default YCDemo