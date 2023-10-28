import { ConversationState } from "./ConversationState";
import { ILiveChatWidgetContext } from "./ILiveChatWidgetContext";
import { ILiveChatWidgetProps } from "../../components/livechatwidget/interfaces/ILiveChatWidgetProps";
import { defaultMiddlewareLocalizedTexts } from "../../components/webchatcontainerstateful/common/defaultProps/defaultMiddlewareLocalizedTexts";
import { getWidgetCacheIdfromProps } from "../../common/utils";
import { defaultClientDataStoreProvider } from "../../common/storage/default/defaultClientDataStoreProvider";
import { ConfirmationState, Constants, ConversationEndEntity, StorageType } from "../../common/Constants";
import { inMemoryDataStore } from "../../common/storage/default/defaultInMemoryDataStore";

export const getLiveChatWidgetContextInitialState = (props: ILiveChatWidgetProps) => {

    console.log("ELOPEZANAYA :: GET CONTEXT :: 3");

    const widgetCacheId = getWidgetCacheIdfromProps(props);
    const cacheTtlInMins = props?.controlProps?.cacheTtlInMins ?? Constants.CacheTtlInMinutes;
    const storageType = props?.useSessionStorage === true ? StorageType.sessionStorage : StorageType.localStorage;
    const alternateStorage = props?.liveChatWidgetExternalStorage;
    let initialState;
    try {
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
    }

    const initialStateFromCache: ILiveChatWidgetContext = JSON.parse(initialState);

    console.log("ELOPEZANAYA :: GET CONTEXT :: initialStateFromCache ::", JSON.stringify(initialStateFromCache));
    /*if (!isNullOrUndefined(initialState)) {
       
        return initialStateFromCache;
    }*/

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
            liveChatContext: initialStateFromCache,
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
            selectedSurveyMode: null,
            postChatParticipantType: undefined
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
