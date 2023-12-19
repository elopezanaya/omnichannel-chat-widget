import { ConversationState } from "./ConversationState";
import { ILiveChatWidgetContext } from "./ILiveChatWidgetContext";
import { ILiveChatWidgetProps } from "../../components/livechatwidget/interfaces/ILiveChatWidgetProps";
import { defaultMiddlewareLocalizedTexts } from "../../components/webchatcontainerstateful/common/defaultProps/defaultMiddlewareLocalizedTexts";
import { getWidgetCacheIdfromProps, isNullOrUndefined } from "../../common/utils";
import { defaultClientDataStoreProvider } from "../../common/storage/default/defaultClientDataStoreProvider";
import { ConfirmationState, Constants, ConversationEndEntity, StorageType } from "../../common/Constants";
import { inMemoryDataStore } from "../../common/storage/default/defaultInMemoryDataStore";
import { StartChatFailureType } from "./StartChatFailureType";

export const getLiveChatWidgetContextInitialState = (props: ILiveChatWidgetProps) => {

    const widgetCacheId = getWidgetCacheIdfromProps(props);
    const cacheTtlInMins = props?.controlProps?.cacheTtlInMins ?? Constants.CacheTtlInMinutes;
    const storageType = props?.useSessionStorage === true ? StorageType.sessionStorage : StorageType.localStorage;
    const alternateStorage = props?.liveChatWidgetExternalStorage;
    const cacheton = alternateStorage?.cachedData;
    let initialState = null;


    console.log("ELOPEZANAYA :: 15 :: get_context: alternateStorage.cachedData=> ", JSON.stringify(cacheton));
    cacheton["domainStates"]["liveChatConfig"] = props.chatConfig;
    cacheton["domainStates"]["renderingMiddlewareProps"] = props.webChatContainerProps?.renderingMiddlewareProps;
    cacheton["domainStates"]["middlewareLocalizedTexts"] = defaultMiddlewareLocalizedTexts;

    if (alternateStorage?.useExternalStorage && alternateStorage?.cachedData) {

        //validate components are present before to build the context

        if (
            !isEmptyObject(alternateStorage?.cachedData?.domainStates) &&
            !isEmptyObject(alternateStorage?.cachedData?.appStates) &&
            !isEmptyObject(alternateStorage?.cachedData?.uiStates)) {

            const initialStateFromCache: ILiveChatWidgetContext = {
                "domainStates": alternateStorage?.cachedData?.domainStates,
                "appStates": alternateStorage?.cachedData?.appStates,
                "uiStates": alternateStorage?.cachedData?.uiStates
            };

            inMemoryDataStore().setData(widgetCacheId, initialStateFromCache);
            console.log("ELOPEZANAYA :: get_context: Formed props => ", JSON.stringify(initialStateFromCache));
            return initialStateFromCache;
        }
    }


    try {
        initialState = defaultClientDataStoreProvider(cacheTtlInMins, storageType, false).getData(widgetCacheId);
    } catch (e) {
        initialState = null;
        console.error("Error while getting initial state from cache", e);
    }




    /* try {
        if (alternateStorage?.useExternalStorage && alternateStorage?.cachedData) {
            initialState = alternateStorage.cachedData;
            console.log("ELOPEZANAYA :: get_context: alternateStorage.cachedData=> ", JSON.stringify(initialState));
            // lets save the value in the in-memory cache
            if (initialState){
                inMemoryDataStore().setData(widgetCacheId, initialState);
            }
        } else {
            initialState = defaultClientDataStoreProvider(cacheTtlInMins, storageType, false).getData(widgetCacheId);
        }
    } catch (e) {

    }*/

    if (!isNullOrUndefined(initialState)) {
        const initialStateFromCache: ILiveChatWidgetContext = JSON.parse(initialState);
        return initialStateFromCache;
    }

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
            confirmationState: ConfirmationState.NotSet,
            startChatFailureType: StartChatFailureType.Generic
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
            selectedSurveyMode: null,
            postChatParticipantType: undefined
        },
        uiStates: {
            showConfirmationPane: false,
            showStartChatErrorPane: false,
            showEmailTranscriptPane: false,
            showCallingPopup: false,
            isIncomingCall: true,
            disableVideoCall: true,
            disableRemoteVideo: true,
            disableSelfVideo: true,
            focusChatButton: false
        }
    };

    console.log("ELOPEZANAYA :: get_context: LiveChatWidgetContextInitialState=> ", JSON.stringify(LiveChatWidgetContextInitialState));
    return LiveChatWidgetContextInitialState;
};

// function to check if an object is empty
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isEmptyObject = (obj: any) => {
    try {
        if (obj === undefined || obj === null) {
            return true;
        }
        return Object.keys(obj).length === 0;
    } catch (error) {
        return true;
    }

};