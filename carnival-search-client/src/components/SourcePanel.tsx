// src/components/SourcesPanel.tsx

"use client";

import { ConversationMessageDocument } from "@/types/schema_types";
import { X } from "lucide-react";
import GetAppLogo from "./GetAppLogo";
import { APP_TYPE_NAME_MAP } from "@/constants";

interface SourcesPanelProps {
    isOpen: boolean;
    onClose: () => void;
    documents: ConversationMessageDocument[];
}

const SourcesPanel = ({ isOpen, onClose, documents }: SourcesPanelProps) => {
    return (
        <aside
            className={`
                flex-shrink-0
                h-full
                border-l
                border-gray-200
                transition-all
                duration-200
                ease-in-out
                overflow-hidden 
                ${isOpen ? "w-[400px]" : "w-0"}
            `}
        >
            <div className="w-[400px] h-full flex flex-col">
                <div className="flex justify-between items-center flex-shrink-0 px-5 border-b py-3">
                    <h2 className="font-medium text-gray-800 text-sm">Citations</h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="overflow-y-auto overflow-x-hidden flex-1">
                    <ul className="px-3 py-2">
                        {documents.map((doc, index) => (
                            <li key={index}>
                                <a
                                    href={doc.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block p-3 rounded-lg hover:bg-gray-50"
                                >
                                    <div>
                                        <div className="flex items-center space-x-1">
                                            {doc.app_type !== "web" ? (
                                                <div className="w-4 h-4">
                                                    <GetAppLogo appType={doc.app_type} type="xs" />
                                                </div>
                                            ) : null}

                                            {doc.app_type !== "web" ? (
                                                <p className="text-xs">
                                                    {APP_TYPE_NAME_MAP[doc.app_type]}
                                                </p>
                                            ) : (
                                                <p className="text-xs">LambdaTest</p>
                                            )}
                                        </div>
                                        <p className="text-sm mt-1 font-medium break-words clamp-1">{doc.title}</p>
                                        <p className="mt-1 text-sm text-gray-500 break-words clamp-2">
                                            {doc.content || "None"}
                                        </p>
                                    </div>
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </aside>
    );
};

export default SourcesPanel;
