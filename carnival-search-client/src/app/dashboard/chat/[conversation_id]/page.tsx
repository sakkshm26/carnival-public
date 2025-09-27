"use client";
import { Textarea } from "@/components/ui/textarea";
import { useApiClient } from "@/utils/axios";
import React, { use, useEffect, useRef, useState } from "react";
import Loader from "@/components/loader";
import {
    AppType,
    ConversationMessage,
    ConversationMessageDocument,
    ConversationMessageThinkingStep,
} from "@/types/schema_types";
import { useSearchParams } from "next/navigation";
import ArrowRightIcon from "@/components/icons/ArrowRightIcon";
import ThinkingProgress from "@/components/ThinkingProgress";
import MarkdownText from "@/components/MarkdownText";
import {
    ChevronDown,
    Ellipsis,
    Check,
    ThumbsUp,
    ThumbsDown,
    Globe,
} from "lucide-react";
import CopyIcon from "@/components/icons/CopyIcon";
import ThumbsUpIcon from "@/components/icons/ThumbsUpIcon";
import ThumbsDownIcon from "@/components/icons/ThumbsDownIcon";
import GetAppLogo from "@/components/GetAppLogo";
import SourcesPanel from "@/components/SourcePanel";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type TempMessage = {
    sent_by_bot: boolean;
    text: string;
    documents: ConversationMessageDocument[];
    thinking_steps: ConversationMessageThinkingStep[] | null;
    liked?: boolean | null;
};

const ChatConversation = ({
    params,
}: {
    params: Promise<{ conversation_id: string }>;
}) => {
    const { conversation_id } = use(params);
    const searchParams = useSearchParams();
    const api_client = useApiClient();

    const abortControllerRef = useRef<AbortController | null>(null);

    const [messages, setMessages] = useState<
        (ConversationMessage | TempMessage)[]
    >([]);
    const [isStepsExpandedMap, setIsStepsExpandedMap] = useState(
        new Map<string, boolean>()
    );
    const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
    const [input, setInput] = useState("");
    const [loadingInitialMessages, setLoadingInitialMessages] = useState(true);
    const [isLoadingResponse, setIsLoadingResponse] = useState(false);
    const [isSourcesPanelOpen, setIsSourcesPanelOpen] = useState(false);
    const [selectedDocuments, setSelectedDocuments] = useState<
        ConversationMessageDocument[]
    >([]);
    const [webSearch, setWebSearch] = useState(
        searchParams.get("web_search") === "true"
    );

    const handleCopyClick = async (messageKey: string, messageText: string) => {
        try {
            await navigator.clipboard.writeText(messageText);
            setCopiedMessageId(messageKey);

            // Reset the copied state after 2 seconds
            setTimeout(() => {
                setCopiedMessageId(null);
            }, 2000);
        } catch (err) {
            console.error("Failed to copy text:", err);
        }
    };

    const handleLikeMessage = async (index: number) => {
        try {
            const message = messages[index];
            // Only allow like if liked status is null
            if (message.liked !== null) return;

            if ("id" in message && message.id) {
                setMessages((prev) => {
                    const newMessages = [...prev];
                    newMessages[index] = { ...message, liked: true };
                    return newMessages;
                });
                await api_client.put(`/internal/user/message/${message.id}`, {
                    liked: true,
                });
            }
        } catch (err) {
            console.error("Failed to like message:", err);
        }
    };

    const handleUnlikeMessage = async (index: number) => {
        try {
            const message = messages[index];
            if (message.liked !== null) return;

            setMessages((prev) => {
                const newMessages = [...prev];
                newMessages[index] = { ...message, liked: false };
                return newMessages;
            });
            if ("id" in message && message.id) {
                await api_client.put(`/internal/user/message/${message.id}`, {
                    liked: false,
                });
            }
        } catch (err) {
            console.error("Failed to unlike message:", err);
        }
    };

    const updateLastBotMessage = async () => {
        try {
            const response = await api_client.get(
                `/internal/user/conversations/${conversation_id}/messages`
            );
            const lastMessage = response.data[0];
            if (lastMessage) {
                setMessages((prev) => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = {
                        ...lastMessage,
                        liked: lastMessage.liked || null,
                    };
                    return newMessages;
                });
            }
        } catch (err) {
            console.error("Failed to update last bot message:", err);
        }
    };

    const handleSendMessage = async (e?: React.FormEvent, text?: string) => {
        e?.preventDefault();
        const messageText = text || input;
        if (!messageText.trim()) return;

        setIsSourcesPanelOpen(false);

        abortControllerRef.current = new AbortController();

        const userMessage: TempMessage = {
            text: messageText,
            sent_by_bot: false,
            documents: [],
            thinking_steps: null,
        };
        const assistantPlaceholder: TempMessage = {
            text: "",
            sent_by_bot: true,
            documents: [],
            thinking_steps: [{ type: "text", data: "Searching" }],
        };

        setMessages((prevMessages) => [
            ...prevMessages,
            userMessage,
            assistantPlaceholder,
        ]);
        setInput("");
        setIsLoadingResponse(true);

        try {
            const response = await api_client.post(
                `/internal/user/generate-reply/${conversation_id}`,
                {
                    text: messageText,
                    web_search: webSearch,
                },
                {
                    responseType: "stream",
                    signal: abortControllerRef.current?.signal,
                }
            );

            const reader = response.data.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() || "";

                for (const line of lines) {
                    if (line.trim() === "" || line === "undefined") continue;
                    try {
                        const parsed = JSON.parse(line);
                        setMessages((prev) => {
                            const newMessages = [...prev];
                            const lastMessage = newMessages[newMessages.length - 1];
                            if (lastMessage && lastMessage.sent_by_bot) {
                                if (parsed.type === "token") {
                                    lastMessage.text += parsed.data;
                                } else if (parsed.type === "documents") {
                                    lastMessage.documents = parsed.data;
                                } else if (parsed.type === "tool_choice") {
                                    if (parsed.data.name === "generate_final_answer_tool") {
                                        lastMessage.thinking_steps = [
                                            ...lastMessage.thinking_steps!,
                                            { type: "text", data: "Finished" },
                                        ];
                                    } else {
                                        const source_step = lastMessage.thinking_steps!.find(
                                            (step) => step.type === "sources"
                                        );
                                        if (source_step) {
                                            source_step.data = [
                                                ...(source_step.data as {
                                                    title: string;
                                                    app_type: AppType;
                                                }[]),
                                                {
                                                    title: parsed.data.name,
                                                    app_type: parsed.data.app_type,
                                                },
                                            ];
                                        } else {
                                            lastMessage.thinking_steps = [
                                                ...lastMessage.thinking_steps!,
                                                {
                                                    type: "sources",
                                                    data: [
                                                        {
                                                            title: parsed.data.name,
                                                            app_type: parsed.data.app_type,
                                                        },
                                                    ],
                                                },
                                            ];
                                        }
                                    }
                                }
                            }
                            return newMessages;
                        });
                    } catch (error) {
                        console.error(
                            "Failed to parse JSON from stream:",
                            error,
                            "Line:",
                            line
                        );
                    }
                }
            }
            updateLastBotMessage();
        } catch (err) {
        } finally {
            setIsLoadingResponse(false);
            abortControllerRef.current = null;
        }
    };

    const getFirst3UniqueAppTypes = (
        documents: ConversationMessageDocument[]
    ) => {
        const appTypes = documents.map((doc) => doc.app_type);
        const uniqueAppTypes = [...new Set(appTypes)];
        return uniqueAppTypes.slice(0, 3);
    };

    const handleStopGeneration = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            setIsLoadingResponse(false);
        }
    };

    const getMessages = async () => {
        setLoadingInitialMessages(true);
        try {
            const response = await api_client.get(
                `/internal/user/conversations/${conversation_id}/messages`
            );
            setMessages(response.data.reverse());
        } catch (err) {
        } finally {
            setLoadingInitialMessages(false);
        }
    };

    const toggleStepsVisibility = (messageKey: string) => {
        setIsStepsExpandedMap((prev) => {
            const newMap = new Map(prev);
            newMap.set(messageKey, !prev.get(messageKey));
            return newMap;
        });
    };

    const toogleSourcePanel = (documents: ConversationMessageDocument[]) => {
        if (isSourcesPanelOpen) {
            setIsSourcesPanelOpen(false);
        } else {
            if (documents && documents.length > 0) {
                setSelectedDocuments(documents);
                setIsSourcesPanelOpen(true);
            }
        }
    };

    const handleCloseSourcesPanel = () => {
        setIsSourcesPanelOpen(false);
    };

    useEffect(() => {
        getMessages();
    }, []);

    useEffect(() => {
        if (
            !loadingInitialMessages &&
            searchParams.get("initial_message") &&
            !messages.length
        ) {
            handleSendMessage(undefined, searchParams.get("initial_message")!);
        }
    }, [loadingInitialMessages]);

    return (
        <div className="flex h-full w-full">
            <div className={`flex flex-col h-screen max-h-screen w-full`}>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 w-full">
                    <div className="max-w-3xl mx-auto">
                        {loadingInitialMessages ? null : messages.length === 0 ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <h2 className="text-3xl font-medium text-gray-500">
                                        How can I help you?
                                    </h2>
                                </div>
                            </div>
                        ) : (
                            messages.map((message, index) => {
                                const messageKey =
                                    (message as ConversationMessage).id || index.toString();
                                const hasAnswerStarted = message.text.length > 0;
                                const isExpanded = isStepsExpandedMap.get(messageKey) || false;

                                return (
                                    <div
                                        key={index}
                                        className={`flex w-full ${!message.sent_by_bot ? "justify-end" : "justify-start"
                                            }`}
                                    >
                                        {message.sent_by_bot ? (
                                            <div
                                                className={`break-words overflow-x-auto p-3 mb-14 w-full`}
                                                style={{
                                                    wordBreak: "break-word",
                                                    overflowWrap: "break-word",
                                                }}
                                            >
                                                <div>
                                                    <div>
                                                        {hasAnswerStarted && (
                                                            <button
                                                                onClick={() =>
                                                                    toggleStepsVisibility(messageKey)
                                                                }
                                                                className="flex items-center justify-between text-left text-base text-gray-600 hover:text-gray-900 focus:outline-none mb-2"
                                                            >
                                                                <span className="text-sm">Steps</span>
                                                                <ChevronDown
                                                                    className={`h-5 w-5 transform transition-transform duration-200 ${isExpanded ? "rotate-180" : "rotate-0"
                                                                        }`}
                                                                />
                                                            </button>
                                                        )}
                                                        <div
                                                            className={`transition-all duration-500 ease-in-out overflow-hidden ${!hasAnswerStarted || isExpanded
                                                                    ? "my-3 max-h-[1000px] opacity-100"
                                                                    : "max-h-0 opacity-0"
                                                                }`}
                                                        >
                                                            <ThinkingProgress
                                                                steps={message.thinking_steps}
                                                                isLoadingResponse={
                                                                    isLoadingResponse &&
                                                                    index === messages.length - 1
                                                                }
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="mt-2">
                                                        <MarkdownText
                                                            text={message.text}
                                                            documents={message.documents}
                                                        />
                                                    </div>

                                                    {isLoadingResponse ? null : (
                                                        <div className="w-full flex items-center justify-between mt-6">
                                                            <div
                                                                onClick={() =>
                                                                    toogleSourcePanel(message.documents)
                                                                }
                                                                className="hover:bg-[#e9e9e980] py-1.5 px-3 rounded-2xl cursor-pointer"
                                                            >
                                                                {message.documents.length ? (
                                                                    <div className="flex items-center space-x-2">
                                                                        <div className="flex space-x-0.5 items-center">
                                                                            {getFirst3UniqueAppTypes(
                                                                                message.documents
                                                                            ).map((appType, index) =>
                                                                                appType !== "web" ? (
                                                                                    <div key={index}>
                                                                                        <GetAppLogo
                                                                                            appType={appType}
                                                                                            type="xs"
                                                                                        />
                                                                                    </div>
                                                                                ) : null
                                                                            )}
                                                                        </div>
                                                                        <p className="text-[13px] text-[#525664]">
                                                                            Sources
                                                                        </p>
                                                                    </div>
                                                                ) : null}
                                                            </div>
                                                            <div className="flex items-center space-x-5">
                                                                <div
                                                                    className="h-[15px] w-[15px] cursor-pointer"
                                                                    onClick={() =>
                                                                        handleCopyClick(messageKey, message.text)
                                                                    }
                                                                >
                                                                    {copiedMessageId === messageKey ? (
                                                                        <Check className="h-[15px] w-[15px]" />
                                                                    ) : (
                                                                        <CopyIcon className="h-[15px] w-[15px] stroke_svg" />
                                                                    )}
                                                                </div>
                                                                {message.liked === true ? (
                                                                    <ThumbsUp
                                                                        className="h-[15px] w-[15px] text-[#525664]"
                                                                        fill="#525664"
                                                                    />
                                                                ) : message.liked === false ? (
                                                                    <ThumbsDown
                                                                        className="h-[15px] w-[15px] text-[#525664]"
                                                                        fill="#525664"
                                                                    />
                                                                ) : (
                                                                    <>
                                                                        <ThumbsUp
                                                                            className="h-[15px] w-[15px] cursor-pointer text-[#525664] hover:text-black"
                                                                            onClick={() => handleLikeMessage(index)}
                                                                        />
                                                                        <ThumbsDown
                                                                            className="h-[15px] w-[15px] cursor-pointer text-[#525664] hover:text-black"
                                                                            onClick={() => handleUnlikeMessage(index)}
                                                                        />
                                                                    </>
                                                                )}
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger className="outline-none border-none">
                                                                        <Ellipsis className="text-[#525664] h-5 w-5" />
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent className="w-[150px] ml-6">
                                                                        <DropdownMenuItem
                                                                            className="flex items-center space-x-2 cursor-pointer"
                                                                            onClick={() =>
                                                                                toogleSourcePanel(message.documents)
                                                                            }
                                                                        >
                                                                            <p className="text-xs font-medium">
                                                                                View Sources
                                                                            </p>
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div
                                                className={`max-w-xl break-words overflow-x-auto p-3 bg-[#e9e9e980] px-4 py-4 rounded-xl mb-6`}
                                                style={{
                                                    wordBreak: "break-word",
                                                    overflowWrap: "break-word",
                                                }}
                                            >
                                                {message.text}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="flex justify-center">
                    <form
                        onSubmit={handleSendMessage}
                        className="rounded-full w-full max-w-3xl "
                    >
                        <div className="relative w-full">
                            <Textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                style={{ fontSize: 15 }}
                                className="h-24 rounded-2xl resize-none p-5 pr-10 mb-6 w-full border-[#3D3F404D] text-[#525664] placeholder:text-[#525664] focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none focus:border-[#0000004d] shadow-[0_0_8px_0_#1214160D]"
                                placeholder="Ask a follow up"
                                required
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        handleSendMessage(e);
                                    }
                                }}
                            />
                            {isLoadingResponse ? (
                                <button
                                    className={`absolute bottom-3 right-3 p-3.5 rounded-full transition-colors mb-1 cursor-pointer bg-[#f2f2f2]`}
                                    onClick={handleStopGeneration}
                                >
                                    <div className="w-3 h-3 rounded-[2px] bg-[#525664]"></div>
                                </button>
                            ) : (
                                <>
                                    <button
                                        className={`absolute bottom-3 right-3 p-2 rounded-full transition-colors mb-1 ${input.trim()
                                                ? "bg-[#3334FE] hover:bg-[#2a2bd9] cursor-pointer"
                                                : "bg-[#f2f2f2] cursor-not-allowed"
                                            }`}
                                        type="submit"
                                    >
                                        <ArrowRightIcon
                                            className="h-4 w-4"
                                            fill={input.trim() ? "white" : "#525664"}
                                        />
                                    </button>
                                    {/* <button
                                        className={`absolute bottom-3 right-[60px] p-2 rounded-lg transition-colors mb-1 cursor-pointer ${webSearch ? "bg-[#eef4f7]" : "hover:bg-[#f2f2f2]"}`}
                                        type="button"
                                        onClick={() => setWebSearch(!webSearch)}
                                    >
                                        <Globe
                                            className={`h-4 w-4 ${webSearch ? "text-[#416da5]" : "text-[#525664]"
                                                }`}
                                        />
                                    </button> */}
                                </>
                            )}
                        </div>
                    </form>
                </div>
            </div>
            <SourcesPanel
                isOpen={isSourcesPanelOpen}
                onClose={handleCloseSourcesPanel}
                documents={selectedDocuments}
            />
        </div>
    );
};

export default ChatConversation;
