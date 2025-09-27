import React from "react";
import { TableHead } from "@/components/ui/table";
import { ChevronDownIcon, ChevronUpIcon, ChevronsUpDown } from "lucide-react";

const CustomTableHead = (props: {
    title: string;
    includePipe: boolean;
    className?: string;
    allowSort?: boolean;
    sortActive?: boolean;
    sortType?: "asc" | "desc" | null;
    onClick?: (sortType: "asc" | "desc" | null) => void;
}) => {
    return (
        <TableHead
            className={`text-[13px] font-normal ${props.className ?? ""}`}
            style={{
                cursor: props.allowSort ? "pointer" : "default",
                color: props.sortActive ? "#3334FE" : "#737373",
            }}
            onClick={() => {
                if (props.onClick) {
                    props.onClick(
                        props.sortActive
                            ? props.sortType === "asc"
                                ? "desc"
                                : null
                            : "asc"
                    );
                }
            }}
        >
            <div className="flex items-center">
                {props.includePipe ? (
                    <span className="text-gray-300 text-[8px] font-semibold">
                        | &nbsp; &nbsp;
                    </span>
                ) : null}
                <p className="mr-1">{props.title}</p>
                {props.sortActive ? (
                    props.sortType === "asc" ? (
                        <ChevronUpIcon className="h-4 w-4" />
                    ) : props.sortType === "desc" ? (
                        <ChevronDownIcon className="h-4 w-4" />
                    ) : null
                ) : props.allowSort ? (
                    <ChevronsUpDown className="h-4 w-4" />
                ) : null}
            </div>
        </TableHead>
    );
};

export default CustomTableHead;
