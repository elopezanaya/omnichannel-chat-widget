import { BroadcastEvent, LogLevel, TelemetryEvent } from "../../../common/telemetry/TelemetryConstants";
import { Constants, LiveWorkItemState, WidgetLoadCustomErrorString, WidgetLoadTelemetryMessage } from "../../../common/Constants";
import { checkContactIdError, createTimer, getConversationDetailsCall, getStateFromCache, getWidgetCacheIdfromProps, isNullOrEmptyString, isUndefinedOrEmpty } from "../../../common/utils";
import { getAuthClientFunction, handleAuthentication } from "./authHelper";
import { handleChatReconnect, isPersistentEnabled, isReconnectEnabled } from "./reconnectChatHelper";
import { handleStartChatError, logWidgetLoadComplete } from "./startChatErrorHandler";

import { ActivityStreamHandler } from "./ActivityStreamHandler";
import { BroadcastService } from "@microsoft/omnichannel-chat-components";
import { ConversationState } from "../../../contexts/common/ConversationState";
import { Dispatch } from "react";
import { ILiveChatWidgetAction } from "../../../contexts/common/ILiveChatWidgetAction";
import { ILiveChatWidgetContext } from "../../../contexts/common/ILiveChatWidgetContext";
import { ILiveChatWidgetProps } from "../interfaces/ILiveChatWidgetProps";
import { LiveChatWidgetActionType } from "../../../contexts/common/LiveChatWidgetActionType";
import StartChatOptionalParams from "@microsoft/omnichannel-chat-sdk/lib/core/StartChatOptionalParams";
import { TelemetryHelper } from "../../../common/telemetry/TelemetryHelper";
import { TelemetryTimers } from "../../../common/telemetry/TelemetryManager";
import { chatSDKStateCleanUp } from "./endChat";
import { createAdapter } from "./createAdapter";
import { createOnNewAdapterActivityHandler } from "../../../plugins/newMessageEventHandler";
import { isPersistentChatEnabled } from "./liveChatConfigUtils";
import { setPostChatContextAndLoadSurvey } from "./setPostChatContextAndLoadSurvey";
import { shouldSetPreChatIfPersistentChat } from "./persistentChatHelper";
import { updateSessionDataForTelemetry } from "./updateSessionDataForTelemetry";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let optionalParams: StartChatOptionalParams = {};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let widgetInstanceId: any | "";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let popoutWidgetInstanceId: any | "";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const setAuthenticationIfApplicable = async (props: ILiveChatWidgetProps | undefined, chatSDK: any) => {
    console.time("setAuthenticationIfApplicable");
    const chatConfig = props?.chatConfig;
    const getAuthToken = props?.getAuthToken;
    const authClientFunction = getAuthClientFunction(chatConfig);
    if (getAuthToken && authClientFunction) {
        // set auth token to chat sdk before start chat
        const authSuccess = await handleAuthentication(chatSDK, chatConfig, getAuthToken);
        if (!authSuccess) {
            throw new Error(WidgetLoadCustomErrorString.AuthenticationFailedErrorString);
        }
    }
    console.timeEnd("setAuthenticationIfApplicable");
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prepareStartChat = async (props: ILiveChatWidgetProps, chatSDK: any, state: ILiveChatWidgetContext, dispatch: Dispatch<ILiveChatWidgetAction>, setAdapter: any) => {
    console.time("prepareStartChat");
    optionalParams = {}; //Resetting to ensure no stale values
    widgetInstanceId = getWidgetCacheIdfromProps(props);

    // reconnect > chat from cache
    if (isReconnectEnabled(props.chatConfig) === true && !isPersistentEnabled(props.chatConfig)) {
        const shouldStartChatNormally = await handleChatReconnect(chatSDK, props, dispatch, setAdapter, initStartChat, state);
        if (!shouldStartChatNormally) {
            return;
        }
    }

    // Check if there is any active popout chats in cache
    if (await canStartPopoutChat(props)) {
        return;
    }

    // Can connect to existing chat session
    if (await canConnectToExistingChat(props, chatSDK, state, dispatch, setAdapter)) {
        return;
    }

    // Setting Proactive chat settings
    const isProactiveChat = state.appStates.conversationState === ConversationState.ProactiveChat;
    const isPreChatEnabledInProactiveChat = state.appStates.proactiveChatStates.proactiveChatEnablePrechat;

    // Setting auth settings to OC API to retrieve existing persistent chat session before start chat if any
    if (isPersistentEnabled(props.chatConfig)) {
        await setAuthenticationIfApplicable(props, chatSDK);
    }

    //Setting PreChat and intiate chat
    await setPreChatAndInitiateChat(chatSDK, dispatch, setAdapter, isProactiveChat, isPreChatEnabledInProactiveChat, state, props);
    console.timeEnd("prepareStartChat");
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const setPreChatAndInitiateChat = async (chatSDK: any, dispatch: Dispatch<ILiveChatWidgetAction>, setAdapter: any, isProactiveChat?: boolean | false, proactiveChatEnablePrechatState?: boolean | false, state?: ILiveChatWidgetContext, props?: ILiveChatWidgetProps) => {
    console.time("setPreChatAndInitiateChat");
    //Handle reconnect scenario

    // Getting prechat Survey Context
    const parseToJson = false;
    const preChatSurveyResponse: string = props?.preChatSurveyPaneProps?.controlProps?.payload ?? await chatSDK.getPreChatSurvey(parseToJson);
    let showPrechat = isProactiveChat ? preChatSurveyResponse && proactiveChatEnablePrechatState : (preChatSurveyResponse && !props?.controlProps?.hidePreChatSurveyPane);
    showPrechat = await shouldSetPreChatIfPersistentChat(chatSDK, state?.domainStates?.liveChatConfig?.LiveWSAndLiveChatEngJoin?.msdyn_conversationmode, showPrechat as boolean);

    if (showPrechat) {
        const isOutOfOperatingHours = state?.domainStates?.liveChatConfig?.LiveWSAndLiveChatEngJoin?.OutOfOperatingHours?.toLowerCase() === "true";
        if (isOutOfOperatingHours) {
            state?.appStates.isMinimized && dispatch({ type: LiveChatWidgetActionType.SET_MINIMIZED, payload: false });
            dispatch({ type: LiveChatWidgetActionType.SET_CONVERSATION_STATE, payload: ConversationState.OutOfOffice });
            return;
        } else {
            dispatch({ type: LiveChatWidgetActionType.SET_PRE_CHAT_SURVEY_RESPONSE, payload: preChatSurveyResponse });
            dispatch({ type: LiveChatWidgetActionType.SET_CONVERSATION_STATE, payload: ConversationState.Prechat });
            
            // If minimized, maximize the chat, if the state is missing, consider it as minimized
            if (state?.appStates.isMinimized == undefined || state?.appStates?.isMinimized === true) {
                dispatch({ type: LiveChatWidgetActionType.SET_MINIMIZED, payload: false });

                // this event will notify the upper layer to maximize the widget, an event missing during multi-tab scenario.
                BroadcastService.postMessage({
                    eventName: BroadcastEvent.MaximizeChat,
                    payload: {
                        height: state?.domainStates?.widgetSize?.height,
                        width: state?.domainStates?.widgetSize?.width
                    }
                });
            }
            return;
        }
    }

    //Initiate start chat
    dispatch({ type: LiveChatWidgetActionType.SET_CONVERSATION_STATE, payload: ConversationState.Loading });
    const optionalParams: StartChatOptionalParams = { isProactiveChat };
    await initStartChat(chatSDK, dispatch, setAdapter, state, props, optionalParams);
    console.timeEnd("setPreChatAndInitiateChat");
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const initStartChat = async (chatSDK: any, dispatch: Dispatch<ILiveChatWidgetAction>, setAdapter: any, state: ILiveChatWidgetContext | undefined, props?: ILiveChatWidgetProps, params?: StartChatOptionalParams, persistedState?: any) => {
    console.time("initStartChat");
    let isStartChatSuccessful = false;
    const persistentChatEnabled = await isPersistentChatEnabled(state?.domainStates?.liveChatConfig?.LiveWSAndLiveChatEngJoin?.msdyn_conversationmode);

    if (state?.appStates.conversationState === ConversationState.Closed) {
        // Preventive reset to avoid starting chat with previous requestId which could potentially cause problems
        chatSDKStateCleanUp(chatSDK);
    }

    try {
        // Clear disconnect state on start chat
        state?.appStates?.chatDisconnectEventReceived && dispatch({ type: LiveChatWidgetActionType.SET_CHAT_DISCONNECT_EVENT_RECEIVED, payload: false });

        //Start widget load timer
        TelemetryTimers.WidgetLoadTimer = createTimer();

        TelemetryHelper.logLoadingEvent(LogLevel.INFO, {
            Event: TelemetryEvent.WidgetLoadStarted,
            Description: "Widget loading started",
        });

        // Auth token retrieval needs to happen during start chat to support pop-out chat
        await setAuthenticationIfApplicable(props, chatSDK);

        //Check if chat retrieved from cache
        if (persistedState || params?.liveChatContext) {
            BroadcastService.postMessage({
                eventName: BroadcastEvent.ChatRetrievedFromCache,
                payload: {
                    chatId: persistedState?.domainStates?.liveChatContext?.chatToken?.chatId,
                    requestId: persistedState?.domainStates?.liveChatContext?.requestId
                }
            });
        }

        try {
            // Set custom context params
            await setCustomContextParams(state, props);
            const defaultOptionalParams: StartChatOptionalParams = {
                sendDefaultInitContext: true,
                isProactiveChat: !!params?.isProactiveChat,
                portalContactId: window.Microsoft?.Dynamic365?.Portal?.User?.contactId
            };
            const startChatOptionalParams: StartChatOptionalParams = Object.assign({}, params, optionalParams, defaultOptionalParams);
            console.time("chatSDK.startChat");
            //await Promise.all([chatSDK.startChat(startChatOptionalParams), createAdapterAndSubscribe(chatSDK, dispatch, setAdapter)]);
            await chatSDK.startChat(startChatOptionalParams);
            console.timeEnd("chatSDK.startChat");
            isStartChatSuccessful = true;
        } catch (error) {
            checkContactIdError(error);
            TelemetryHelper.logSDKEvent(LogLevel.ERROR, {
                Event: TelemetryEvent.StartChatMethodException,
                ExceptionDetails: {
                    exception: `Failed to setup startChat: ${error}`
                }
            });
            isStartChatSuccessful = false;
            throw error;
        }

        // Set app state to Active
        if (isStartChatSuccessful) {
            ActivityStreamHandler.uncork();
            // Update start chat failure app state if chat loads successfully
            dispatch({ type: LiveChatWidgetActionType.SET_START_CHAT_FAILING, payload: false });
            dispatch({ type: LiveChatWidgetActionType.SET_CONVERSATION_STATE, payload: ConversationState.Active });
        }
        if (persistedState) {
            dispatch({ type: LiveChatWidgetActionType.SET_WIDGET_STATE, payload: persistedState });
            logWidgetLoadComplete(WidgetLoadTelemetryMessage.PersistedStateRetrievedMessage);
            setPostChatContextAndLoadSurvey(chatSDK, dispatch, true);
            return;
        }

        await createAdapterAndSubscribe(chatSDK, dispatch, setAdapter);
        
        // Persistent Chat relies on the `reconnectId` retrieved from reconnectablechats API to reconnect upon start chat and not `liveChatContext`
        if (!persistentChatEnabled) {
            console.time("chatSDK.getCurrentLiveChatContext");
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const liveChatContext: any = await chatSDK?.getCurrentLiveChatContext();
            dispatch({ type: LiveChatWidgetActionType.SET_LIVE_CHAT_CONTEXT, payload: liveChatContext });
            console.time("chatSDK.getCurrentLiveChatContext");
        }

        logWidgetLoadComplete();
        // Set post chat context in state
        // Commenting this for now as post chat context is fetched during end chat
        setPostChatContextAndLoadSurvey(chatSDK, dispatch);

        // Updating chat session detail for telemetry
        await updateSessionDataForTelemetry(chatSDK, dispatch);
    } catch (ex) {
        handleStartChatError(dispatch, chatSDK, props, ex, isStartChatSuccessful);
    } finally {
        optionalParams = {};
        widgetInstanceId = "";
    }
    console.timeEnd("initStartChat");
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createAdapterAndSubscribe = async (chatSDK: any, dispatch: Dispatch<ILiveChatWidgetAction>, setAdapter: any) => {
    console.time("createAdapterAndSubscribe");
    // New adapter creation
    const newAdapter = await createAdapter(chatSDK);
    setAdapter(newAdapter);

    console.time("chatSDK.getChatToken");
    const chatToken = await chatSDK.getChatToken(true);
    console.timeEnd("chatSDK.getChatToken");
    dispatch({ type: LiveChatWidgetActionType.SET_CHAT_TOKEN, payload: chatToken });
    console.log("Chat Token: ", chatToken);
    newAdapter?.activity$?.subscribe(createOnNewAdapterActivityHandler(chatToken?.chatId, chatToken?.visitorId));
    console.timeEnd("createAdapterAndSubscribe");
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const canConnectToExistingChat = async (props: ILiveChatWidgetProps, chatSDK: any, state: ILiveChatWidgetContext, dispatch: Dispatch<ILiveChatWidgetAction>, setAdapter: any) => {
    console.time("canConnectToExistingChat");
    // By pass this function in case of popout chat
    if (state?.appStates?.hideStartChatButton === true) {
        return false;
    }

    const persistedState = getStateFromCache(getWidgetCacheIdfromProps(props));

    //Connect to only active chat session
    if (persistedState &&
        !isUndefinedOrEmpty(persistedState?.domainStates?.liveChatContext) &&
        persistedState?.appStates?.conversationState === ConversationState.Active) {
        dispatch({ type: LiveChatWidgetActionType.SET_CONVERSATION_STATE, payload: ConversationState.Loading });
        const optionalParams = { liveChatContext: persistedState?.domainStates?.liveChatContext };
        await initStartChat(chatSDK, dispatch, setAdapter, state, props, optionalParams, persistedState);
        return true;
    }

    console.timeEnd("canConnectToExistingChat");
    return false;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const setCustomContextParams = async (state: ILiveChatWidgetContext | undefined, props?: ILiveChatWidgetProps) => {
    console.time("setCustomContextParams");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isAuthenticatedChat = (props?.chatConfig?.LiveChatConfigAuthSettings as any)?.msdyn_javascriptclientfunction ? true : false;
    //Should not set custom context for auth chat
    if (isAuthenticatedChat) {
        return;
    }

    if (state?.domainStates?.customContext) {
        optionalParams = Object.assign({}, optionalParams, {
            customContext: JSON.parse(JSON.stringify(state?.domainStates?.customContext))
        });
        return;
    }

    if (isNullOrEmptyString(widgetInstanceId)) {
        widgetInstanceId = getWidgetCacheIdfromProps(props);
    }
    // Add custom context only for unauthenticated chat
    const persistedState = getStateFromCache(widgetInstanceId);
    const customContextLocal = persistedState?.domainStates?.customContext ?? props?.initialCustomContext;
    if (customContextLocal) {
        TelemetryHelper.logLoadingEvent(LogLevel.INFO, {
            Event: TelemetryEvent.SettingCustomContext,
            Description: "Setting custom context for unauthenticated chat"
        });

        optionalParams = Object.assign({}, optionalParams, {
            customContext: JSON.parse(JSON.stringify(customContextLocal))
        });
    } else {
        const customContextFromParent = await getInitContextParamsForPopout();
        if (!isUndefinedOrEmpty(customContextFromParent?.contextVariables)) {
            optionalParams = Object.assign({}, optionalParams, {
                customContext: JSON.parse(JSON.stringify(customContextFromParent.contextVariables))
            });
        }
    }
    console.timeEnd("setCustomContextParams");
};

const canStartPopoutChat = async (props: ILiveChatWidgetProps) => {
    console.time("canStartPopoutChat");
    if (props.allowSdkChatSupport === false) {
        return false;
    }

    popoutWidgetInstanceId = getWidgetCacheIdfromProps(props, true);

    if (!isNullOrEmptyString(popoutWidgetInstanceId)) {
        const persistedState = getStateFromCache(popoutWidgetInstanceId);

        if (persistedState &&
            !isUndefinedOrEmpty(persistedState?.domainStates?.liveChatContext) &&
            persistedState?.appStates?.conversationState === ConversationState.Active) {
            // Initiate popout chat
            BroadcastService.postMessage({
                eventName: BroadcastEvent.InitiateStartChatInPopoutMode
            });
            console.timeEnd("canStartPopoutChat");

            return true;
        }
    }
    console.timeEnd("canStartPopoutChat");
    return false;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const checkIfConversationStillValid = async (chatSDK: any, dispatch: Dispatch<ILiveChatWidgetAction>, state: ILiveChatWidgetContext): Promise<boolean> => {
    console.time("checkIfConversationStillValid");
    const requestIdFromCache = state.domainStates?.liveChatContext?.requestId;
    const liveChatContext = state?.domainStates?.liveChatContext;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let conversationDetails: any = undefined;

    // Preserve current requestId
    const currentRequestId = chatSDK.requestId ?? "";
    dispatch({ type: LiveChatWidgetActionType.SET_INITIAL_CHAT_SDK_REQUEST_ID, payload: currentRequestId });

    try {
        chatSDK.requestId = requestIdFromCache;
        conversationDetails = await getConversationDetailsCall(chatSDK, liveChatContext);

        if (Object.keys(conversationDetails).length === 0) {
            return false;
        }

        if (conversationDetails.state === LiveWorkItemState.Closed || conversationDetails.state === LiveWorkItemState.WrapUp) {
            dispatch({ type: LiveChatWidgetActionType.SET_LIVE_CHAT_CONTEXT, payload: undefined });
            return false;
        }
        console.timeEnd("checkIfConversationStillValid");

        return true;
    }
    catch (error) {
        TelemetryHelper.logActionEvent(LogLevel.ERROR, {
            Event: TelemetryEvent.GetConversationDetailsException,
            ExceptionDetails: {
                exception: `Conversation is not valid: ${error}`
            }
        });
        console.timeEnd("checkIfConversationStillValid");

        return false;
    }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getInitContextParamsForPopout = async (): Promise<any> => {
    return window.opener ? await getInitContextParamForPopoutFromOuterScope(window.opener) : null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getInitContextParamForPopoutFromOuterScope = async (scope: any): Promise<any> =>  {
    console.time("getInitContextParamForPopoutFromOuterScope");
    let payload;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let waitPromiseResolve: any;
    const waitPromise = new Promise((res, rej) => {
        waitPromiseResolve = res;
        setTimeout(() => rej("Failed to find method in outer scope"), 5000);
    }).catch((rej) => console.warn(rej));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getInitContextParamsFromParent = (e: any) => {
        if (e.data && e.data.messageName == Constants.InitContextParamsResponse) {
            payload = e.data.payload;
            waitPromiseResolve();
        }
    };

    window.addEventListener("message", getInitContextParamsFromParent, false);
    scope.postMessage({ messageName: Constants.InitContextParamsRequest }, "*");
    await waitPromise;
    window.removeEventListener("message", getInitContextParamsFromParent, false);
    console.timeEnd("getInitContextParamForPopoutFromOuterScope");
    return payload;
};
export { prepareStartChat, initStartChat, setPreChatAndInitiateChat, checkIfConversationStillValid };