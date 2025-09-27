import React, { ChangeEvent } from "react";

const CustomInput = (props: {
    value: string | undefined;
    onChange?: (val: string) => any;
    type?: string;
    onBlur?: (params: any) => any;
    className?: string;
    placeholder?: string;
    extraProps?: any;
}) => {
    return (
        <input
            value={props.value}
            onChange={(e) => {
                if (props.onChange) {
                    props.onChange(e.target.value);
                }
            }}
            className={`px-2 h-10 rounded-lg bg-white hover:bg-gray-100 focus:outline focus:outline-gray-300 focus:outline-[1px] focus:bg-white ${
                props.className ? props.className : ""
            }`}
            onBlur={props.onBlur}
            placeholder={props.placeholder}
            {...props.extraProps}
        />
    );
};

export default CustomInput;
