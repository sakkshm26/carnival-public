'use client';
import { Textarea } from '@/components/ui/textarea';
import { useApiClient } from '@/utils/axios';
import { SendHorizontal, Globe } from 'lucide-react';
import React, { useState } from 'react';
import Loader from '@/components/loader';
import { useRouter } from 'next/navigation';
import ArrowRightIcon from '@/components/icons/ArrowRightIcon';
import Leaf from '@/components/icons/Leaf';
import BoxesIcon from '@/components/icons/Boxes';
import StepsIcon from '@/components/icons/Steps';

interface Document {
    content: string | null;
    link: string;
    metadata: any;
    app_type: string;
}

interface ApiResponse {
    answer: string;
    documents: Document[];
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
    documents?: Document[];
}

const Chat = () => {
    const api_client = useApiClient();
    const router = useRouter();

    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [webSearch, setWebSearch] = useState(false);

    const handleCreateConversation = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response = await api_client.post('/internal/user/conversation', {
                user_message: input
            })
            router.push(`/dashboard/chat/${response.data.id}?initial_message=${input}&web_search=${webSearch}`)
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen max-h-screen w-full max-w-2xl mx-auto">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 mt-5 w-full">
                <div className="flex flex-col items-center justify-center h-full">
                    <h2 className="text-4xl text-[#363636]">What do you want to know?</h2>
                    <form onSubmit={handleCreateConversation} className="w-full">
                        <div className="relative w-full mt-10">
                            <Textarea
                                value={input}
                                onChange={(e) =>
                                    setInput(e.target.value)
                                }
                                style={{ fontSize: 15 }}
                                className="h-32 rounded-2xl resize-none p-5 pr-10 mb-6 w-full border-[#3D3F404D] text-[#525664] placeholder:text-[#525664] focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:outline-none focus:border-[#0000004d]"
                                placeholder="Ask me anything… (e.g. list high priority open tickets, which salesforce deals have a contract size greater than 100000, summarize the q2 engineering sprint plan)"
                                required
                                disabled={isLoading}
                                onKeyDown={(e) => {
                                    if (
                                        e.key === "Enter" &&
                                        !e.shiftKey
                                    ) {
                                        handleCreateConversation(e);
                                    }
                                }}
                            />
                            <button
                                className={`absolute bottom-3 right-3 p-2 rounded-full transition-colors mb-1 ${input.trim() ? 'bg-[#3334FE] hover:bg-[#2a2bd9] cursor-pointer' : 'bg-[#f2f2f2] cursor-not-allowed'}`}
                                type="submit"
                                disabled={isLoading || !input.trim()}
                            >
                                <ArrowRightIcon className="h-4 w-4" fill={input.trim() ? "white" : "#525664"} />
                            </button>
                            {/* <button
                                className={`absolute bottom-3 right-[60px] p-2 rounded-lg transition-colors mb-1 cursor-pointer ${webSearch ? "bg-[#eef4f7]" : "hover:bg-[#f2f2f2]"}`}
                                type="button"
                                onClick={() => setWebSearch(!webSearch)}
                            >
                                <Globe className={`h-4 w-4 ${webSearch ? "text-[#416da5]" : "text-[#525664]"}`} />
                            </button> */}
                        </div>
                    </form>
                    <div className='flex justify-between space-x-5 mt-5 w-full'>
                        <div className='flex items-center space-x-4 bg-[#F7F7F7] py-3 px-4 rounded-lg w-1/3'>
                            <Leaf width={22} height={22} />
                            <p className='text-sm'>Search any file</p>
                        </div>
                        <div className='flex items-center space-x-4 bg-[#F7F7F7] py-3 px-4 rounded-lg w-1/3'>
                            <BoxesIcon width={22} height={22} />
                            <p className='text-sm'>Know any stats</p>
                        </div>
                        <div className='flex items-center space-x-4 bg-[#F7F7F7] py-3 px-4 rounded-lg w-1/3'>
                            <StepsIcon width={32} height={32} />
                            <p className='text-sm'>Create scalable agents</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Chat;