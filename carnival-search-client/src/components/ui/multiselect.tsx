"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronDown, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
    Command,
    CommandGroup,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Command as CommandPrimitive } from "cmdk";

interface MultiSelectProps {
    options: Option[];
    selectedValues: Option[];
    setSelectedValues: (data: any) => void;
    placeholder?: string;
    defaultOpen?: boolean;
}

type Option = { label: string; value: string };

export function MultiSelect({
    options,
    selectedValues,
    setSelectedValues,
    placeholder,
    defaultOpen,
}: MultiSelectProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [open, setOpen] = useState(defaultOpen || false);
    const [inputValue, setInputValue] = useState("");

    const handleUnselect = useCallback(
        (option: Option) => {
            const newValues = selectedValues.filter(
                (s) => s.value !== option.value
            );
            setSelectedValues(newValues);
        },
        [selectedValues]
    );

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLDivElement>) => {
            const input = inputRef.current;
            if (input) {
                if (e.key === "Delete" || e.key === "Backspace") {
                    if (input.value === "") {
                        const newValues = selectedValues.slice(0, -1);
                        setSelectedValues(newValues);
                    }
                }
                if (e.key === "Escape") {
                    input.blur();
                }
            }
        },
        [selectedValues]
    );

    const selectables = options.filter(
        (option) => !selectedValues.find((s) => s.value === option.value)
    );

    return (
        <Command
            onKeyDown={handleKeyDown}
            className="overflow-visible bg-transparent"
        >
            <div className="group rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-within:ring-1 focus-within:ring-ring">
                <div className="flex flex-wrap gap-1">
                    {selectedValues.map((option) => {
                        return (
                            <Badge
                                key={option.value}
                                variant="outline"
                                className="font-normal"
                            >
                                {option.label}
                                <button
                                    className="ml-1 rounded-full outline-none"
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            handleUnselect(option);
                                        }
                                    }}
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                    }}
                                    onClick={() => handleUnselect(option)}
                                >
                                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                </button>
                            </Badge>
                        );
                    })}
                    {/* Avoid having the "Search" Icon */}
                    <CommandPrimitive.Input
                        ref={inputRef}
                        value={inputValue}
                        onValueChange={setInputValue}
                        onBlur={() => setOpen(false)}
                        onFocus={() => setOpen(true)}
                        placeholder={
                            placeholder ? placeholder : "Select options..."
                        }
                        className="ml-2 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
                    />
                </div>
            </div>
            <div className="relative">
                <CommandList>
                    {open && selectables.length > 0 ? (
                        <div className="absolute top-0 z-10 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in mt-2">
                            <CommandGroup className="h-full overflow-auto max-h-[200px]">
                                {selectables.map((option) => {
                                    return (
                                        <CommandItem
                                            key={option.value}
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                            }}
                                            onSelect={(value) => {
                                                setInputValue("");
                                                const newValues = [
                                                    ...selectedValues,
                                                    option,
                                                ];
                                                setSelectedValues(newValues);
                                            }}
                                            className={"cursor-pointer"}
                                        >
                                            {option.label}
                                        </CommandItem>
                                    );
                                })}
                            </CommandGroup>
                        </div>
                    ) : null}
                </CommandList>
            </div>
        </Command>
    );
}
