"use client";
import { toast } from "sonner";

const CustomToast = (props: { message: string, type?: any }) => {
    return toast(props.message, { position: "bottom-right" });
};

export default CustomToast;
