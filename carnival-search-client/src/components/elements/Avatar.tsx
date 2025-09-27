import { AVATAR_COLORS } from "@/constants";
import React from "react";

const Avatar = (props: {
    name?: string;
    color_type: string;
    className?: string;
}) => {
    return (
        <div
            className={`flex justify-center items-center shrink-0 overflow-hidden text-white ${
                props.className ? props.className : "h-9 w-9 rounded-lg"
            }`}
            style={{ background: AVATAR_COLORS[props.color_type] }}
        >
            <p>
                {props.name
                    ?.split(" ")
                    .slice(0, 2)
                    .map((n) => n[0]?.toUpperCase())}
            </p>
        </div>
    );
};

export default Avatar;
