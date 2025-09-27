"use client";
import { useState, useContext, useEffect } from "react";
import AuthContext from "@/contexts/auth-context";
import ConfigContext from "@/contexts/config-context";
import { useRouter, usePathname } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import Loader from "./loader";
import CustomToast from "./toast";
import { useAuthClient } from "@/utils/authClient";
import Image from "next/image";

interface AuthProps {
    type: "login" | "signup";
}

export default function Auth({ type }: AuthProps) {
    const user_context = useContext(AuthContext);
    const configContext = useContext(ConfigContext);
    const authClient = useAuthClient();
    const router = useRouter();

    const [formData, setFormData] = useState({ email: "", password: "" });
    const [submitLoading, setSubmitLoading] = useState(false);

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setSubmitLoading(true);
        try {
            if (type === "login") {
                const { data, error } = await (authClient.signIn.email)({
                    email: formData.email,
                    password: formData.password,
                });
                if (error) {
                    throw new Error("Invalid credentials");
                }
            } else {
                const { data, error } = await (authClient.signUp.email as any)({
                    email: formData.email,
                    password: formData.password,
                });
                if (error) {
                    throw new Error();
                }
            }
        } catch (err: any) {
            CustomToast({ message: err?.message || "Something went wrong" })
        }
        setSubmitLoading(false);
    };

    const handleGoogleAuth = async () => {
        await authClient.signIn.social({
            provider: "google",
            callbackURL: `${configContext!.APP_URL}/dashboard/chat` 
        })
    };

    useEffect(() => {
        if (!user_context.isLoading && user_context.session) {
            router.push("/")
        }
    }, [user_context])

    return false ? (
        <Loader global={true} />
    ) : (
        <section className="bg-gray-50 dark:bg-gray-900">
            <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
                <a
                    href="#"
                    className="flex items-center mb-6 text-2xl font-semibold text-gray-900 dark:text-white"
                >
                    Carnival
                </a>
                <Card className="w-full bg-white rounded-lg dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700 shadow-xl">
                    <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
                        <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
                            {type === "login"
                                ? "Login to your account"
                                : "Create your account"}
                        </h1>
                        <form
                            className="space-y-4 md:space-y-6"
                            onSubmit={handleSubmit}
                        >
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                    Email
                                </label>
                                <Input
                                    type="email"
                                    name="email"
                                    id="email"
                                    placeholder="name@company.com"
                                    required={true}
                                    onChange={(e) => {
                                        setFormData({
                                            ...formData,
                                            email: e.target.value,
                                        });
                                    }}
                                    maxLength={40}
                                />
                            </div>
                            <div>
                                <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                    Password
                                </label>
                                <Input
                                    type="password"
                                    name="password"
                                    id="password"
                                    placeholder="********"
                                    required={true}
                                    onChange={(e) => {
                                        setFormData({
                                            ...formData,
                                            password: e.target.value,
                                        });
                                    }}
                                    minLength={8}
                                    maxLength={40}
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={submitLoading}
                            >
                                {type === "login" ? "Login" : "Sign Up"}
                            </Button>
                        </form>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-gray-300 dark:border-gray-600" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">
                                    OR
                                </span>
                            </div>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={handleGoogleAuth}
                        >
                            <Image src={'/app_logos/google.svg'} alt="Google" width={15} height={15} />
                            Continue with Google
                        </Button>

                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                            {type === "login"
                                ? `Don't have an account yet? `
                                : `Already have an account? `}
                            <a
                                href={
                                    type === "login" ? "/onboarding/auth/signup" : "/onboarding/auth/login"
                                }
                                className="font-medium text-primary-600 hover:underline dark:text-primary-500"
                            >
                                {type === "login" ? "Sign Up" : "Login"}
                            </a>
                        </p>
                    </div>
                </Card>
            </div>
        </section>
    );
}
