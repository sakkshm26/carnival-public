"use client"

import Loader from '@/components/loader';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface Config {
    APP_URL: string;
    SERVER_URL: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_REDIRECT_URI: string;
    SLACK_CLIENT_ID: string;
    SLACK_REDIRECT_URI: string;
    SALESFORCE_CLIENT_ID: string;
    SALESFORCE_REDIRECT_URI: string;
    ATLASSIAN_CLIENT_ID: string;
    ATLASSIAN_REDIRECT_URI: string;
}

const ConfigContext = createContext<Config | null>(null);

export function ConfigProvider({ children }: { children: ReactNode }) {
    const [config, setConfig] = useState<Config | null>(null);

    useEffect(() => {
        fetch('/api/config')
            .then(res => res.json())
            .then(setConfig)
            .catch(console.error);
    }, []);

    if (!config) {
        return <Loader global={true} />
    }

    return (
        <ConfigContext.Provider value={config}>
            {children}
        </ConfigContext.Provider>
    );
}

export default ConfigContext;