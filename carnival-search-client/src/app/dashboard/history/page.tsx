'use client'
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Conversation, ConversationMessage } from "@/types/schema_types";
import { useApiClient } from "@/utils/axios";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import _ from "lodash";

export default function Library() {
    const api_client = useApiClient()
    const router = useRouter()

    const [conversations, setConversations] = useState<(Conversation & { last_message: ConversationMessage })[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    
    const getConversations = async () => {
        try {
            const response = await api_client.get('/internal/user/conversations')
            setConversations(response.data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false);
        }
    }

    const searchConversations = _.debounce(async (query: string) => {
        if (!query) {
            getConversations();
            return;
        }
        try {
            const response = await api_client.post('/internal/user/search-conversations', {
                search_query: query
            });
            setConversations(response.data);
        } catch (error) {
            console.error(error);
        }
    }, 500);

    useEffect(() => {
        getConversations()
    }, [])

    useEffect(() => {
        searchConversations(search);
        return () => {
            searchConversations.cancel();
        };
    }, [search]);

    return (
        <div className="max-w-4xl mx-auto h-screen flex flex-col py-8 px-10">
            <h2 className="mb-4">Chat History</h2>
            <div className="flex items-center justify-between mb-4">
                <Input
                    placeholder="Search your history..."
                    className="w-full max-w-md mr-4"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <Button variant="outline" className="whitespace-nowrap text-sm font-normal" onClick={() => router.push('/dashboard/chat')}>
                    + New Chat
                </Button>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto pr-2">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                ) : conversations.map((chat, idx) => (
                    <div key={idx} className="cursor-pointer" onClick={() => router.push(`/dashboard/chat/${chat.id}`)}>
                        <div className="py-4">
                            <div className="flex justify-between items-start">
                                <div> 
                                    <div className="text-sm mb-1">{chat.title}</div>
                                    <div className="text-xs text-muted-foreground line-clamp-1">
                                        {chat.last_message.text.length > 100 ? chat.last_message.text.slice(0, 100) + '...' : chat.last_message.text}
                                    </div>
                                </div>
                                <div className="flex items-center text-xs text-muted-foreground ml-4 mt-1">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    {dayjs(chat.last_message.created_at).format('MMMM D, YYYY')}
                                </div>
                            </div>
                        </div>
                        {idx < conversations.length - 1 && <hr className="border-gray-200" />}
                    </div>
                ))}
            </div>
        </div>
    );
}