// CitationPopover.tsx - FIXED

import { ConversationMessageDocument } from '@/types/schema_types';
import React from 'react';
import GetAppLogo from './GetAppLogo';

const CitationPopover = (props: { document: ConversationMessageDocument }) => {

    return (
        <span className="p-1 w-2xl cursor-pointer block">
            <span className="flex items-center space-x-2">
                {props.document.app_type !== "web" ? <GetAppLogo appType={props.document.app_type} width={12} height={12} /> : null}
                <span className="text-xs font-medium text-gray-900">{props.document.title}</span>
            </span>
            {props.document.content ?
                <span className="block text-xs text-gray-600 mt-2 mb-3">
                    {props.document.content?.slice(0, 100)}
                </span>
                : null}
        </span>
    );
}

export default CitationPopover;