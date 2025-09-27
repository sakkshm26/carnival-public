"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useApiClient } from "@/utils/axios";
import ProtectedRoute from "@/utils/protectedRoute";
import { useRouter } from "next/navigation";
import React, { ReactEventHandler, useState } from "react";

const CreateOrg = () => {
    const router = useRouter();
    const api_client = useApiClient();

    const [formData, setFormData] = useState({ name: "" });
    const [submitLoading, setSubmitLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitLoading(true);
        try {
            const response = await api_client.post(
                "/internal/org/create",
                formData
            );
            await api_client.post("/internal/user/add-to-org", {
                org_id: response.data.id,
                role: "admin",
            });
            router.push("/onboarding/info");
        } catch (err) { }
    };

    return (
        <section className="bg-gray-50 dark:bg-gray-900">
            <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
                <Card className="w-full bg-white rounded-lg dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700 shadow-xl">
                    <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
                        <h1 className="text-xl font-semibold text-gray-900">
                            Create Workspace
                        </h1>
                        <form
                            className="space-y-4 md:space-y-6"
                            onSubmit={handleSubmit}
                        >
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                    Workspace Name
                                </label>
                                <Input
                                    type="text"
                                    name="name"
                                    id="name"
                                    placeholder="Acme Org"
                                    required={true}
                                    onChange={(e) => {
                                        setFormData({
                                            ...formData,
                                            name: e.target.value,
                                        });
                                    }}
                                    maxLength={40}
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={submitLoading}
                            >
                                Create
                            </Button>
                        </form>
                    </div>
                </Card>
            </div>
        </section>
    );
};

export default ProtectedRoute(CreateOrg);
