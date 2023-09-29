import React, { Dispatch, useReducer, useState } from "react";

import { ChatAdapterStore } from "../../contexts/ChatAdapterStore";
import { ChatContextStore } from "../../contexts/ChatContextStore";
import { ChatSDKStore } from "../../contexts/ChatSDKStore";
import { ILiveChatWidgetAction } from "../../contexts/common/ILiveChatWidgetAction";
import { ILiveChatWidgetContext } from "../../contexts/common/ILiveChatWidgetContext";
import { ILiveChatWidgetProps } from "./interfaces/ILiveChatWidgetProps";
import LiveChatWidgetStateful from "./livechatwidgetstateful/LiveChatWidgetStateful";
import { createReducer } from "../../contexts/createReducer";
import { getLiveChatWidgetContextInitialState } from "../../contexts/common/LiveChatWidgetContextInitialState";
import { BroadcastService } from "@microsoft/omnichannel-chat-components";
import { inMemoryDataStore } from "../../common/storage/default/defaultInMemoryDataStore";
import { getWidgetCacheIdfromProps } from "../../common/utils";

export const LiveChatWidget = (props: ILiveChatWidgetProps) => {

    const reducer = createReducer();
    const [state, dispatch]: [ILiveChatWidgetContext, Dispatch<ILiveChatWidgetAction>] = useReducer(reducer, getLiveChatWidgetContextInitialState(props));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [adapter, setAdapter]: [any, (adapter: any) => void] = useState(undefined);
    const widgetCacheId = getWidgetCacheIdfromProps(props);


    BroadcastService.getMessageByEventName("internal:dataReceived").subscribe((event) => {
        const initialState = event.payload.data.data;
        console.log("ELOPEZANAYA : initialState : parsed =>"+ Date.now() + ":: " + JSON.stringify(initialState));

        inMemoryDataStore().setData(widgetCacheId, initialState);
    });

    BroadcastService.postMessage({
        eventName: "internal:feedMe",
        payload: { key: widgetCacheId}
    });

    return (
        <ChatSDKStore.Provider value={props.chatSDK}>
            <ChatAdapterStore.Provider value={[adapter, setAdapter]}>
                <ChatContextStore.Provider value={[state, dispatch]}>
                    <LiveChatWidgetStateful {...props} />
                </ChatContextStore.Provider>
            </ChatAdapterStore.Provider>
        </ChatSDKStore.Provider>
    );
};

export default LiveChatWidget;