'use client';

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useApiClient } from "@/utils/axios";
import ProtectedRoute from "@/utils/protectedRoute";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

const Info = () => {
    const router = useRouter();
    const api_client = useApiClient();
    
    const [formData, setFormData] = useState({ name: "" });
    const [submitLoading, setSubmitLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitLoading(true);
        try {
            await api_client.put('/internal/user', {
                display_name: formData.name
            })
            router.push("/");
        } catch (err) {

        }
        setSubmitLoading(false);
    };

    return (
        <section className="bg-gray-50 dark:bg-gray-900">
            <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
                <Card className="w-full bg-white rounded-lg dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700 shadow-xl">
                    <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
                        <h1 className="text-xl font-semibold text-gray-900">
                            Welcome! Let's get started
                        </h1>
                        <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit}>
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                    Your Name
                                </label>
                                <Input
                                    type="text"
                                    name="name"
                                    id="name"
                                    placeholder="John Doe"
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
                                Get Started
                            </Button>
                        </form>
                    </div>
                </Card>
            </div>
        </section>
    );
};

export default ProtectedRoute(Info);