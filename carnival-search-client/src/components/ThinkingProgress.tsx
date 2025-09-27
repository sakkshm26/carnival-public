import { AppType, ConversationMessageThinkingStep } from '@/types/schema_types';
import React, { useEffect, useRef } from 'react'
import GetAppLogo from './GetAppLogo';

const ThinkingProgress = ({ steps, isLoadingResponse }: { steps: ConversationMessageThinkingStep[] | null, isLoadingResponse: boolean }) => {
    const lastStepRef = useRef<HTMLDivElement>(null);

    if (!steps) return <div className="relative pl-[27px]">
        <div
            className="absolute left-[8px] top-3 bottom-2 w-[1px]"
            style={{
                background: 'linear-gradient(to bottom, #E3E3E8, #E3E3E8, #E3E3E8, #FBFBFB)'
            }}
        ></div>

        <div className="flex flex-col space-y-6">
            <div className="relative">
                <div className={`absolute -left-[22px] top-2.5 flex items-center justify-center w-2 h-2 rounded-full z-10 bg-[#c0c0c0]`}>
                </div>

                <div className="flex flex-col space-y-2 text-sm">
                    <p className="text-[#525664]">Searching</p>
                </div>
            </div>
            <div className="relative">
                <div className={`absolute -left-[22px] top-2.5 flex items-center justify-center w-2 h-2 rounded-full z-10 bg-[#c0c0c0]`}>
                </div>

                <div className="flex flex-col space-y-2 text-sm">
                    <p className="text-[#525664]">Finished</p>
                </div>
            </div>
        </div>
    </div>

    useEffect(() => {
        lastStepRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, [steps.length, steps[steps.length - 1]?.data?.length]);

    if (steps.length === 0) return null;

    return (
        <div className="relative pl-[27px]">
            <div
                className="absolute left-[8px] top-1.5 bottom-2 w-[1px]"
                style={{
                    background: 'linear-gradient(to bottom, #E3E3E8, #E3E3E8, #E3E3E8, #FBFBFB)'
                }}
            ></div>

            <div className="flex flex-col space-y-3">
                {steps.map((step, index) => {
                    const isLastStep = index === steps.length - 1;

                    return (
                        <div key={index} className="relative" ref={isLastStep ? lastStepRef : null}>
                            <div className={`absolute -left-[22px] top-1.5 flex items-center justify-center w-2 h-2 rounded-full z-10 bg-[#c0c0c0]`}>
                            </div>

                            <div className="flex flex-col space-y-2 text-[13px]">
                                {step.type === "text" ? <p className={`text-[#525664] ${isLoadingResponse && index === steps.length - 1 ? "text-shine" : ""}`}>{step.data as string}</p> : <>
                                    <p className="text-[#525664]">Reading sources · {step.data.length}</p>
                                    <div className="border border-gray-200 rounded-lg p-2 space-y-2">
                                        {(step.data as { title: string, app_type: AppType | "web" }[]).map((s, i) => (
                                            <div key={i} className="flex items-center space-x-3 text-sm p-1">
                                                {s.app_type !== "web" ? <GetAppLogo appType={s.app_type} width={16} height={16} /> : null}
                                                <p className="text-gray-800 font-normal text-xs truncate">{s.title}</p>
                                            </div>
                                        ))}
                                    </div>
                                </>}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default ThinkingProgress