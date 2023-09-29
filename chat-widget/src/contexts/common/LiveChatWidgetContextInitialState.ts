import { ConversationState } from "./ConversationState";
import { ILiveChatWidgetContext } from "./ILiveChatWidgetContext";
import { ILiveChatWidgetProps } from "../../components/livechatwidget/interfaces/ILiveChatWidgetProps";
import { defaultMiddlewareLocalizedTexts } from "../../components/webchatcontainerstateful/common/defaultProps/defaultMiddlewareLocalizedTexts";
import { getWidgetCacheIdfromProps, isNullOrUndefined } from "../../common/utils";
import { defaultClientDataStoreProvider } from "../../common/storage/default/defaultClientDataStoreProvider";
import { ConfirmationState, Constants, ConversationEndEntity, StorageType } from "../../common/Constants";
import { BroadcastService } from "@microsoft/omnichannel-chat-components";

export const getLiveChatWidgetContextInitialState = (props: ILiveChatWidgetProps) => {

    const widgetCacheId = getWidgetCacheIdfromProps(props);
    const cacheTtlInMins = props?.controlProps?.cacheTtlInMins ?? Constants.CacheTtlInMinutes;
    const storageType = props?.useSessionStorage === true ? StorageType.sessionStorage : StorageType.localStorage;
    const alternateStorage = props?.liveChatWidgetExternalStorage;
    let initialState;

    try {
        
        console.log("ELOPEZANAYA :: WITHOUT_PROPS  :: 20");
        BroadcastService.getMessageByEventName("internal:isAliveResponse").subscribe((event) => {
            console.log("ELOPEZANAYA : is alive response", JSON.stringify(event));
        
        });



        BroadcastService.postMessage({
            eventName: "internal:isAlive",
            payload: null
        });



    } catch (error) {
        console.error("ELOPEZANAYA : error", error);
        
    }

    /*try {
        if (alternateStorage?.useExternalStorage && alternateStorage?.cachedData) {
            initialState = alternateStorage.cachedData;
            // lets save the value in the in-memory cache
            if (initialState){
                inMemoryDataStore().setData(widgetCacheId, initialState);
            }
        } else {
            initialState = defaultClientDataStoreProvider(cacheTtlInMins, storageType, false).getData(widgetCacheId);
        }
    } catch (e) {
        initialState = null;
        console.error("Error while getting initial state from cache", e);
    }*/


    if (!initialState) {
        initialState = defaultClientDataStoreProvider(cacheTtlInMins, storageType, alternateStorage?.useExternalStorage || false).getData(widgetCacheId);
    }

    if (!isNullOrUndefined(initialState)) {
        console.log("ELOPEZANAYA : initialState => "+ Date.now() + ":: " +  JSON.stringify(initialState) );

        const initialStateFromCache: ILiveChatWidgetContext = JSON.parse(initialState);
        console.log("ELOPEZANAYA : initialStateFromCache => "+ Date.now() + ":: " +  JSON.stringify(initialStateFromCache) );

        return initialStateFromCache;
    }else{ console.log("ELOPEZANAYA :EMPTY  initialState => "+ Date.now()  );}

    const LiveChatWidgetContextInitialState: ILiveChatWidgetContext = {
        domainStates: {
            liveChatConfig: props.chatConfig,
            widgetElementId: "",
            renderingMiddlewareProps: props.webChatContainerProps?.renderingMiddlewareProps,
            middlewareLocalizedTexts: defaultMiddlewareLocalizedTexts,
            preChatSurveyResponse: "{}",
            chatToken: undefined,
            postChatContext: undefined,
            telemetryInternalData: {},
            globalDir: "ltr",
            liveChatContext: undefined,
            customContext: undefined,
            widgetSize: undefined,
            widgetInstanceId: "",
            initialChatSdkRequestId: "",
            transcriptRequestId: "",
            confirmationPaneConfirmedOptionClicked: false,
            confirmationState: ConfirmationState.NotSet
        },
        appStates: {
            conversationState: ConversationState.Closed,
            isMinimized: undefined,
            previousElementIdOnFocusBeforeModalOpen: null,
            startChatFailed: false,
            outsideOperatingHours: false,
            preChatResponseEmail: "",
            isAudioMuted: null,
            newMessage: false,
            hideStartChatButton: false,
            reconnectId: undefined,
            proactiveChatStates: {
                proactiveChatBodyTitle: "",
                proactiveChatEnablePrechat: false,
                proactiveChatInNewWindow: false
            },
            e2vvEnabled: false,
            unreadMessageCount: 0,
            conversationEndedBy: ConversationEndEntity.NotSet,
            chatDisconnectEventReceived: false,
            selectedSurveyMode: null
        },
        uiStates: {
            showConfirmationPane: false,
            showEmailTranscriptPane: false,
            showCallingPopup: false,
            isIncomingCall: true,
            disableVideoCall: true,
            disableRemoteVideo: true,
            disableSelfVideo: true,
            focusChatButton: false
        }
    };

    return LiveChatWidgetContextInitialState;
};
