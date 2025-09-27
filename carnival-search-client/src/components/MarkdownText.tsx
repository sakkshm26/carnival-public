import { useMemo } from "react";
import { ConversationMessageDocument } from "@/types/schema_types";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./ui/hover-card";
import CitationPopover from "./CitationPopover";
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import GetAppLogo from "./GetAppLogo";
import { APP_TYPE_NAME_MAP } from "@/constants";

const MarkdownText = ({ text, documents = [] }: { text: string, documents: ConversationMessageDocument[] }) => {
    const processedText = useMemo(() => {
        const citationRegex = /\[([\d,\s]+)\]/g;
        return text.replace(citationRegex, (match, p1) => {
            return `<span class="citation-placeholder" data-doc-ids="${p1}"></span>`;
        });
    }, [text]);

    const components = {
        span: ({ node, className, children, ...props }: { node: any, className: string, children: any, props: any }) => {
            if (className === 'citation-placeholder') {
                const docIds = (props as any)['data-doc-ids'] || '';
                const docNumbers = docIds
                    .split(',')
                    .map((num: string) => parseInt(num.trim(), 10) - 1)
                    .filter((num: number) => !isNaN(num) && num >= 0 && num < documents.length);

                return (
                    <span className="inline-flex items-center gap-1 flex-wrap">
                        {docNumbers.map((docIndex: number, i: number) => {
                            const document = documents[docIndex];
                            if (!document) return null;

                            return (
                                <HoverCard key={i} openDelay={200} closeDelay={100}>
                                    <HoverCardTrigger asChild onClick={() => window.open(document.url, '_blank')}>
                                        <span className="inline-flex items-center space-x-1 bg-[#F3F3F3] px-1.5 py-0.5 rounded-full cursor-pointer hover:bg-[#e8e8e8]">
                                            {document.app_type !== "web" ? <GetAppLogo appType={document.app_type} height={10} width={10} /> : null}
                                            {document.app_type !== "web" ? <p className="text-[10px] text-[#1C1C21] mt-[0px!important]">{APP_TYPE_NAME_MAP[document.app_type]}</p> : <p className="text-[10px] text-[#1C1C21] mt-[0px!important]">lambdatest</p>}
                                        </span>
                                    </HoverCardTrigger>
                                    <HoverCardContent className="w-96 cursor-pointer bg-[#FCFCFC] shadow-[0px_0px_10px_4px_#00000014] rounded-xl p-3" side="top" align="center" onClick={() => window.open(document.url, '_blank')}>
                                        <CitationPopover document={document} />
                                    </HoverCardContent>
                                </HoverCard>
                            );
                        })}
                    </span>
                );
            }
            return <span className={className} {...props}>{children}</span>;
        },
        table: ({ children }: { children: any }) => (
            <div className="overflow-x-auto my-4 border-l border-r border-[#E3E3E8] rounded-lg">
                <table className="min-w-full border-collapse border-t border-b border-[#E3E3E8] rounded-lg">
                    {children}
                </table>
            </div>
        ),
        thead: ({ children }: { children: any }) => (
            <thead className="rounded-lg">
                {children}
            </thead>
        ),
        tbody: ({ children }: { children: any }) => (
            <tbody>
                {children}
            </tbody>
        ),
        tr: ({ children }: { children: any }) => (
            <tr className="hover:bg-gray-50">
                {children}
            </tr>
        ),
        th: ({ children }: { children: any }) => (
            <th className="border-b border-l border-[#E3E3E8] px-4 py-4 text-left text-sm font-medium text-gray-700 min-w-[120px] whitespace-nowrap bg-gray-100">
                {children}
            </th>
        ),
        td: ({ children }: { children: any }) => (
            <td className="border-b border-l border-[#E3E3E8] bg-transparent px-4 py-4 text-sm text-gray-900 min-w-[120px] align-top">
                {children}
            </td>
        ),
    };

    return (
        <div className="markdown-content">
            <ReactMarkdown
                disallowedElements={['div']}
                unwrapDisallowed
                components={components as any}
                rehypePlugins={[rehypeRaw]}
                remarkPlugins={[remarkGfm]}
            >
                {processedText}
            </ReactMarkdown>
        </div>
    );
};

export default MarkdownText;