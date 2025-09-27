import { ReactNode, useContext, useState } from "react";
import Link from "next/link";
import { SidebarContext } from "@/contexts/sidebar-context";
import { IoIosArrowUp, IoIosArrowDown } from "react-icons/io";
import { useRouter } from "next/navigation";

interface SidebarItemProps {
    icon: ReactNode;
    text: string;
    active?: boolean;
    href?: string;
    alert?: boolean;
    items?: { text: string; href: string; active: boolean }[];
    showNestedItemsByDefault?: boolean;
    setExpanded: any;
}

export default function SidebarItem2({
    icon,
    text,
    active,
    href,
    alert,
    items,
    showNestedItemsByDefault,
    setExpanded,
}: SidebarItemProps) {
    const { expanded } = useContext(SidebarContext);
    const [showNestedItems, setShowNestedItems] = useState(true);
    const router = useRouter();

    const toggleNestedItems = () => {
        setShowNestedItems((prevState) => !prevState);
    };

    return (
        <li
            className={`relative flex flex-col items-start transition-colors group ${items || text === "Agent Swarm" ? "" : "cursor-pointer"}`}
            onClick={() => {
                href ? router.push(href) : null;
            }}
        >
            <div
                className={`flex items-center w-full ${expanded ? "px-2" : "px-[8px]"
                    } rounded-md ${active
                        ? "bg-[#F0F3F7]"
                        : "hover:bg-gray-50 text-gray-500"
                    } h-8`}
            // onClick={toggleNestedItems}
            >
                <div className="h-4 w-4 flex justify-center items-center">{icon}</div>
                <div className="flex items-center space-x-3 text-sm">
                    {items ? (
                        <p
                            className={`text-[#292B2F] font-medium overflow-hidden transition-all ${expanded ? " ml-3" : "w-0"
                                }`}
                        >
                            {text}
                        </p>
                    ) : (
                        <p
                            className={`text-[#52566C] overflow-hidden transition-all ${expanded ? "ml-3" : "w-0"
                                } ${text === "Agent Swarm" ? "text-gray-400" : "cursor-pointer"}`}
                        >
                            {text}
                        </p>
                    )}

                    {text === "Agent Swarm" && expanded && (
                        <span className="text-xs font-medium text-purple-500 bg-purple-50 border border-purple-200 rounded-full px-2.5 py-0.5 ml-2">
                            Soon
                        </span>
                    )}
                </div>

                {/* {items &&
                    expanded &&
                    (showNestedItems ? (
                        <IoIosArrowUp size={20} />
                    ) : (
                        <IoIosArrowDown size={20} />
                    ))} */}
            </div>
            {items && expanded && showNestedItems && (
                <ul
                    className={`flex flex-col w-full pl-3.5 text-sm transition-all ${expanded ? "opacity-100" : "opacity-0 h-0"
                        }`}
                >
                    {items.map((item, index) => (
                        <li
                            key={index}
                            className={` rounded-lg text-[#52566C] ${item.active
                                ? "bg-[#F0F3F7]"
                                : ""
                                }`}
                        >
                            <p className="py-1.5 flex items-center">
                                <span
                                    className={`overflow-hidden transition-all ${expanded ? "w-52 ml-3" : "w-0"
                                        } cursor-pointer`}
                                    style={{ marginLeft: 22 }}
                                    onClick={() => router.push(item.href)}
                                >
                                    {item.text}
                                </span>
                            </p>
                        </li>
                    ))}
                </ul>
            )}
        </li>
    );
}
