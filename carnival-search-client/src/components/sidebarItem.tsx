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

export default function SidebarItem({
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
            className={`relative flex flex-col items-center cursor-pointer transition-colors group`}
            onClick={() => {
                href ? router.push(href) : null;
            }}
        >
            <div
                className={`flex items-center justify-center w-full rounded-lg ${
                    active
                        ? "bg-[#F0F3F7]"
                        : "hover:bg-gray-100 text-gray-500"
                } h-10`}
                onClick={toggleNestedItems}
            >
                <div>{icon}</div>
            </div>
            <p className="text-xs mt-0.5 text-[#525664]">{text}</p>
        </li>
    );
}
