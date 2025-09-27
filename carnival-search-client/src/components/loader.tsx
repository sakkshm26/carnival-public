import { cn } from "@/lib/utils";

interface LoaderProps {
    global?: boolean;
    className?: any;
    height?: number;
    width?: number;
}

export default function Loader(loader_data: LoaderProps) {
    return (
        <div
            role="status"
            style={loader_data.global ? { top: "49%", left: "49%", position: "absolute" } : {}}
            className={loader_data.className}
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width={loader_data.width || 24}
                height={loader_data.height || 24}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={cn("animate-spin")}
            >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
        </div>
    );
}
