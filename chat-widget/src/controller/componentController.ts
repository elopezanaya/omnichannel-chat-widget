import { ConversationState } from "../contexts/common/ConversationState";
import { ILiveChatWidgetContext } from "../contexts/common/ILiveChatWidgetContext";

export const shouldShowChatButton = (state: ILiveChatWidgetContext) => {
    const isMinimized = state?.appStates?.isMinimized;
    const conversationState = state?.appStates?.conversationState;
    const hideStartChatButton = state?.appStates?.hideStartChatButton;
    
    console.log("[CHAT_BUTTON] Values:", { isMinimized, conversationState, hideStartChatButton });
    
    const result = (isMinimized ||
        (conversationState === ConversationState.Closed))
        && hideStartChatButton === false;
    
    console.log("[CHAT_BUTTON] Result:", result);
    return result;
};

export const shouldShowProactiveChatPane = (state: ILiveChatWidgetContext) => {
    const isMinimized = state.appStates.isMinimized;
    const conversationState = state.appStates.conversationState;
    
    console.log("[PROACTIVE_PANE] Values:", { isMinimized, conversationState });
    
    const result = !isMinimized &&
        (conversationState === ConversationState.ProactiveChat);
    
    console.log("[PROACTIVE_PANE] Result:", result);
    return result;
};

export const shouldShowHeader = (state: ILiveChatWidgetContext) => {
    const isMinimized = state.appStates.isMinimized;
    const conversationState = state.appStates.conversationState;
    
    console.log("[HEADER] Values:", { 
        isMinimized, 
        conversationState, 
        notClosed: conversationState !== ConversationState.Closed,
        notProactive: conversationState !== ConversationState.ProactiveChat 
    });
    
    const result = !isMinimized &&
        (conversationState !== ConversationState.Closed &&
            conversationState !== ConversationState.ProactiveChat);
    
    console.log("[HEADER] Result:", result);
    return result;
};

export const shouldShowFooter = (state: ILiveChatWidgetContext) => {
    const isMinimized = state.appStates.isMinimized;
    const conversationState = state.appStates.conversationState;
    
    console.log("[FOOTER] Values:", { 
        isMinimized, 
        conversationState,
        isActive: conversationState === ConversationState.Active,
        isInActive: conversationState === ConversationState.InActive,
        isPostchat: conversationState === ConversationState.Postchat
    });
    
    const result = !isMinimized &&
        (conversationState === ConversationState.Active ||
            conversationState === ConversationState.InActive ||
            conversationState === ConversationState.Postchat);
    
    console.log("[FOOTER] Result:", result);
    return result;
};

export const shouldShowEmailTranscriptPane = (state: ILiveChatWidgetContext) => {
    const showEmailTranscriptPane = state.uiStates.showEmailTranscriptPane;
    
    console.log("[EMAIL_TRANSCRIPT] Values:", { showEmailTranscriptPane });
    console.log("[EMAIL_TRANSCRIPT] Result:", showEmailTranscriptPane);
    
    return showEmailTranscriptPane;
};

export const shouldShowWebChatContainer = (state: ILiveChatWidgetContext) => {
    const isMinimized = state.appStates.isMinimized;
    const conversationState = state.appStates.conversationState;
    
    console.log("[WEBCHAT] Values:", { 
        isMinimized, 
        conversationState,
        isActive: conversationState === ConversationState.Active,
        isInActive: conversationState === ConversationState.InActive
    });
    
    const result = ((!isMinimized) && conversationState === ConversationState.Active ||
        conversationState === ConversationState.InActive);
    
    console.log("[WEBCHAT] Result:", result);
    return result;
};

export const shouldShowLoadingPane = (state: ILiveChatWidgetContext) => {
    const isMinimized = state.appStates.isMinimized;
    const conversationState = state.appStates.conversationState;
    
    console.log("[LOADING_PANE] Values:", { 
        isMinimized, 
        conversationState,
        isLoading: conversationState === ConversationState.Loading
    });
    
    const result = !isMinimized &&
        (conversationState === ConversationState.Loading);
    
    console.log("[LOADING_PANE] Result:", result);
    return result;
};

export const shouldShowStartChatErrorPane = (state: ILiveChatWidgetContext) => {
    const isMinimized = state.appStates.isMinimized;
    const conversationState = state.appStates.conversationState;
    
    console.log("[ERROR_PANE] Values:", { 
        isMinimized, 
        conversationState,
        isError: conversationState === ConversationState.Error
    });
    
    const result = !isMinimized &&
        (conversationState === ConversationState.Error);
    
    console.log("[ERROR_PANE] Result:", result);
    return result;
};

export const shouldShowReconnectChatPane = (state: ILiveChatWidgetContext) => {
    const isMinimized = state.appStates.isMinimized;
    const conversationState = state.appStates.conversationState;
    
    console.log("[RECONNECT_PANE] Values:", { 
        isMinimized, 
        conversationState,
        isReconnect: conversationState === ConversationState.ReconnectChat
    });
    
    const result = !isMinimized &&
        (conversationState === ConversationState.ReconnectChat);
    
    console.log("[RECONNECT_PANE] Result:", result);
    return result;
};

export const shouldShowPostChatLoadingPane = (state: ILiveChatWidgetContext) => {
    const isMinimized = state.appStates.isMinimized;
    const conversationState = state.appStates.conversationState;
    
    console.log("[POSTCHAT_LOADING] Values:", { 
        isMinimized, 
        conversationState,
        isPostchatLoading: conversationState === ConversationState.PostchatLoading
    });
    
    const result = !isMinimized &&
        (conversationState === ConversationState.PostchatLoading);
    
    console.log("[POSTCHAT_LOADING] Result:", result);
    return result;
};

export const shouldShowOutOfOfficeHoursPane = (state: ILiveChatWidgetContext) => {
    const isMinimized = state.appStates.isMinimized;
    const outsideOperatingHours = state.appStates.outsideOperatingHours;
    const conversationState = state.appStates.conversationState;
    
    console.log("[OUT_OF_OFFICE] Values:", { 
        isMinimized, 
        outsideOperatingHours,
        conversationState,
        isOutOfOffice: conversationState === ConversationState.OutOfOffice
    });
    
    const result = !isMinimized &&
        (outsideOperatingHours === true) && 
        (conversationState === ConversationState.OutOfOffice);
    
    console.log("[OUT_OF_OFFICE] Result:", result);
    return result;
};

export const shouldShowPreChatSurveyPane = (state: ILiveChatWidgetContext) => {
    const conversationState = state.appStates.conversationState;
    
    console.log("[PRECHAT_SURVEY] Values:", { 
        conversationState,
        isPrechat: conversationState === ConversationState.Prechat
    });
    
    const result = conversationState === ConversationState.Prechat;
    
    console.log("[PRECHAT_SURVEY] Result:", result);
    return result;
};

export const shouldShowConfirmationPane = (state: ILiveChatWidgetContext) => {
    const showConfirmationPane = state.uiStates.showConfirmationPane;
    
    console.log("[CONFIRMATION_PANE] Values:", { showConfirmationPane });
    console.log("[CONFIRMATION_PANE] Result:", showConfirmationPane);
    
    return showConfirmationPane;
};

export const shouldShowPostChatSurveyPane = (state: ILiveChatWidgetContext) => {
    const conversationState = state.appStates.conversationState;
    
    console.log("[POSTCHAT_SURVEY] Values:", { 
        conversationState,
        isPostchat: conversationState === ConversationState.Postchat
    });
    
    const result = conversationState === ConversationState.Postchat;
    
    console.log("[POSTCHAT_SURVEY] Result:", result);
    return result;
};

export const shouldShowCallingContainer = (state: ILiveChatWidgetContext) => {
    const conversationState = state.appStates.conversationState;
    const e2vvEnabled = state.appStates.e2vvEnabled;
    
    console.log("[CALLING_CONTAINER] Values:", { 
        conversationState,
        isActive: conversationState === ConversationState.Active,
        e2vvEnabled
    });
    
    const result = (conversationState === ConversationState.Active) &&
        e2vvEnabled;
    
    console.log("[CALLING_CONTAINER] Result:", result);
    return result;
};