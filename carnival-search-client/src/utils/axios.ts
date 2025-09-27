import ConfigContext from "../contexts/config-context"
import { useContext, useMemo } from "react"
import axios from "axios";

export const useApiClient = () => {
    const configContext = useContext(ConfigContext);

    const api_client = axios.create({
        baseURL: configContext!.SERVER_URL,
        headers: {
            'Content-Type': 'application/json',
        },
        withCredentials: true,
        adapter: "fetch"
    });

    return api_client;
}