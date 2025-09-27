import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "../styles/globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { ThemeProvider } from "next-themes";
import { DashboardPanelsProvider } from "@/contexts/dashboard-panel-context";
import { ConfigProvider } from "@/contexts/config-context";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
    weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
    title: "Carnival",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body
                className={`${geistSans.className} antialiased`}
            >
                <ConfigProvider>
                    <AuthProvider>
                        <ThemeProvider attribute="class" defaultTheme="light">
                            <DashboardPanelsProvider>
                                {children}
                            </DashboardPanelsProvider>
                        </ThemeProvider>
                    </AuthProvider>
                </ConfigProvider>
            </body>
        </html>
    );
}
