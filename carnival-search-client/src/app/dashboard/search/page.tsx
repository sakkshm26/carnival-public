"use client";
import { InputWithIcon } from "@/components/elements/InputWithIcon";
import Loader from "@/components/loader";
import { AppType } from "@/constants";
import { Document, DocumentChunk } from "@/types/schema_types";
import { useApiClient } from "@/utils/axios";
import { ArrowRight, ChevronDown, Search } from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";
import GetAppLogo from "@/components/GetAppLogo";

const SearchPage = () => {
    const api_client = useApiClient();
    
    const [keyword, setKeyword] = useState<string>("");
    const [searchResults, setSearchResults] = useState<{
        chunk: DocumentChunk,
        document: Document,
        connector: { app_type: AppType },
        display: { title: string, description: string }
    }[]>([]);
    const [loadingSearchResults, setLoadingSearchResults] = useState(false);
    const [loadingRagResponse, setLoadingRagResponse] = useState(false);
    const [ragResponse, setRagResponse] = useState<string | null>(null);

    const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
        e?.preventDefault();
        // handleRagResponse();
        setLoadingSearchResults(true);
        try {
            const response = await api_client.post("/internal/connector/search", {
                query_text: keyword,
            });
            setSearchResults(response.data)
        } catch (err) {
            console.log(err);
        }
        setLoadingSearchResults(false);
    };

    const handleRagResponse = async () => {
        setLoadingRagResponse(true);
        try {
            const user_response = await api_client.get("/internal/user");
            const response = await api_client.post("/internal/connector/rag", {
                query_text: keyword,
                org_id: user_response.data.fk_user_last_logged_in_org
            });
            setRagResponse(response.data.text);
        } catch (err) { }
        setLoadingRagResponse(false);
    }

    return (
        <div className="flex justify-center items-center min-h-screen">
            {searchResults.length ? (
                <div className="w-[90%] xl:w-[60%] flex flex-col h-screen py-4">
                    <div className="sticky top-4 z-10 bg-white pt-4 pb-2">
                        <form onSubmit={handleSubmit}>
                            <InputWithIcon
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                startIcon={Search}
                                className="rounded-3xl"
                                placeholder="Search for anything"
                            />
                            {loadingSearchResults ? (
                                <div className="flex justify-center items-center mt-4">
                                    <Loader height={20} width={20} />
                                </div>
                            ) : null}
                        </form>
                        <hr className="my-4" />
                    </div>

                    <div className="overflow-y-auto">
                        <div className="flex justify-between items-start space-x-24">
                            <div className="flex flex-col w-[900px] space-y-8 mb-10">
                                {searchResults.map((result, index) => (
                                    <div key={index} className="flex space-x-4 cursor-pointer" onClick={() => window.open(result.document.link ?? "", "_blank")}>
                                        <div className={`h-6 w-6 mt-1.5 ${result.connector.app_type === AppType.GMAIL ? "w-7" : ""}`}>
                                            <GetAppLogo 
                                                appType={result.connector.app_type}
                                                width={20}
                                                height={20}
                                            />
                                        </div>
                                        <div className="flex flex-col">
                                            <p className="text-blue-600">
                                                {result.display.title}
                                            </p>
                                            <p className="mt-3 text-sm">
                                                {result.display.description.slice(0, 400)}
                                                {result.display.description.length > 400 ? "..." : ""}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="w-[90%] lg:w-[60%] mb-32">
                    <div>
                        <p className="text-[#58B367] text-3xl">
                            How can I help you today?
                        </p>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <InputWithIcon
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            startIcon={Search}
                            className="mt-14 rounded-3xl py-6"
                            placeholder="Search for anything"
                            endIcon={ArrowRight}
                            onEndIconClick={keyword ? handleSubmit : undefined}
                        />
                        {loadingSearchResults ? (
                            <div className="flex justify-center items-center my-8">
                                <Loader height={20} width={20} className={"text-center"} />
                            </div>
                        ) : null}
                    </form>
                </div>
            )}
        </div>
    );
};

export default SearchPage;
