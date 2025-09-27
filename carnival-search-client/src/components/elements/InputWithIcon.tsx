import * as React from "react";

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    startIcon?: LucideIcon;
    endIcon?: LucideIcon;
    onStartIconClick?: () => void;
    onEndIconClick?: () => void;
}

const InputWithIcon = React.forwardRef<HTMLInputElement, InputProps>(
    (
        {
            className,
            type,
            startIcon,
            endIcon,
            onStartIconClick,
            onEndIconClick,
            ...props
        },
        ref
    ) => {
        const StartIcon = startIcon;
        const EndIcon = endIcon;

        return (
            <div className="relative">
                {StartIcon && (
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                        <StartIcon
                            size={18}
                            className={`text-muted-foreground ${
                                onStartIconClick ? "cursor-pointer" : ""
                            }`}
                            onClick={onStartIconClick}
                        />
                    </div>
                )}
                <input
                    type={type}
                    className={cn(
                        "flex h-10 w-full rounded-md border border-input bg-background py-2 px-3 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50",
                        startIcon ? "pl-10" : "",
                        endIcon ? "pr-8" : "",
                        className
                    )}
                    ref={ref}
                    {...props}
                />
                {EndIcon && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <EndIcon
                            className={`text-muted-foreground ${
                                onEndIconClick ? "cursor-pointer" : ""
                            }`}
                            size={18}
                            onClick={onEndIconClick}
                        />
                    </div>
                )}
            </div>
        );
    }
);
InputWithIcon.displayName = "InputWithIcon";

export { InputWithIcon };
