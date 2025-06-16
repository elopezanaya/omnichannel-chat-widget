import { ConversationState } from "../contexts/common/ConversationState";
import { ILiveChatWidgetContext } from "../contexts/common/ILiveChatWidgetContext";

export const shouldShowChatButton = (state: ILiveChatWidgetContext) => {
    console.log("shouldShowChatButton - Evaluating:", { 
        isMinimized: state.appStates.isMinimized, 
        conversationState: state.appStates.conversationState, 
        hideStartChatButton: state?.appStates?.hideStartChatButton 
    });
    const result = (state.appStates.isMinimized ||
        (state.appStates.conversationState === ConversationState.Closed))
        && state?.appStates?.hideStartChatButton === false;
    console.log("shouldShowChatButton - Result:", result);
    return result;
};

export const shouldShowProactiveChatPane = (state: ILiveChatWidgetContext) => {
    console.log("shouldShowProactiveChatPane - Evaluating:", { 
        isMinimized: state.appStates.isMinimized, 
        conversationState: state.appStates.conversationState 
    });
    const result = !state.appStates.isMinimized &&
        (state.appStates.conversationState === ConversationState.ProactiveChat);
    console.log("shouldShowProactiveChatPane - Result:", result);
    return result;
};

export const shouldShowHeader = (state: ILiveChatWidgetContext) => {
    console.log("shouldShowHeader - Evaluating:", { 
        isMinimized: state.appStates.isMinimized, 
        conversationState: state.appStates.conversationState 
    });
    const result = !state.appStates.isMinimized &&
        (state.appStates.conversationState !== ConversationState.Closed &&
            state.appStates.conversationState !== ConversationState.ProactiveChat);
    console.log("shouldShowHeader - Result:", result);
    return result;
};

export const shouldShowFooter = (state: ILiveChatWidgetContext) => {
    console.log("shouldShowFooter - Evaluating:", { 
        isMinimized: state.appStates.isMinimized, 
        conversationState: state.appStates.conversationState 
    });
    const result = !state.appStates.isMinimized &&
        (state.appStates.conversationState === ConversationState.Active ||
            state.appStates.conversationState === ConversationState.InActive ||
            state.appStates.conversationState === ConversationState.Postchat);
    console.log("shouldShowFooter - Result:", result);
    return result;
};

export const shouldShowEmailTranscriptPane = (state: ILiveChatWidgetContext) => {
    console.log("shouldShowEmailTranscriptPane - Evaluating:", { 
        showEmailTranscriptPane: state.uiStates.showEmailTranscriptPane 
    });
    const result = state.uiStates.showEmailTranscriptPane;
    console.log("shouldShowEmailTranscriptPane - Result:", result);
    return result;
};

export const shouldShowWebChatContainer = (state: ILiveChatWidgetContext) => {
    console.log("shouldShowWebChatContainer - Evaluating:", { 
        isMinimized: state.appStates.isMinimized, 
        conversationState: state.appStates.conversationState 
    });
    const result = ((!state.appStates.isMinimized) && state.appStates.conversationState === ConversationState.Active ||
        state.appStates.conversationState === ConversationState.InActive);
    console.log("shouldShowWebChatContainer - Result:", result);
    return result;
};

export const shouldShowLoadingPane = (state: ILiveChatWidgetContext) => {
    console.log("shouldShowLoadingPane - Evaluating:", { 
        isMinimized: state.appStates.isMinimized, 
        conversationState: state.appStates.conversationState 
    });
    const result = !state.appStates.isMinimized &&
        (state.appStates.conversationState === ConversationState.Loading);
    console.log("shouldShowLoadingPane - Result:", result);
    return result;
};

export const shouldShowStartChatErrorPane = (state: ILiveChatWidgetContext) => {
    console.log("shouldShowStartChatErrorPane - Evaluating:", { 
        isMinimized: state.appStates.isMinimized, 
        conversationState: state.appStates.conversationState 
    });
    const result = !state.appStates.isMinimized &&
        (state.appStates.conversationState === ConversationState.Error);
    console.log("shouldShowStartChatErrorPane - Result:", result);
    return result;
};

export const shouldShowReconnectChatPane = (state: ILiveChatWidgetContext) => {
    console.log("shouldShowReconnectChatPane - Evaluating:", { 
        isMinimized: state.appStates.isMinimized, 
        conversationState: state.appStates.conversationState 
    });
    const result = !state.appStates.isMinimized &&
        (state.appStates.conversationState === ConversationState.ReconnectChat);
    console.log("shouldShowReconnectChatPane - Result:", result);
    return result;
};

export const shouldShowPostChatLoadingPane = (state: ILiveChatWidgetContext) => {
    console.log("shouldShowPostChatLoadingPane - Evaluating:", { 
        isMinimized: state.appStates.isMinimized, 
        conversationState: state.appStates.conversationState 
    });
    const result = !state.appStates.isMinimized &&
        (state.appStates.conversationState === ConversationState.PostchatLoading);
    console.log("shouldShowPostChatLoadingPane - Result:", result);
    return result;
};

export const shouldShowOutOfOfficeHoursPane = (state: ILiveChatWidgetContext) => {
    console.log("shouldShowOutOfOfficeHoursPane - Evaluating:", { 
        isMinimized: state.appStates.isMinimized, 
        outsideOperatingHours: state.appStates.outsideOperatingHours, 
        conversationState: state.appStates.conversationState 
    });
    // Show OOOH pane only when the conversation state is Closed and outside operating hours is true
    const result = !state.appStates.isMinimized &&
        (state.appStates.outsideOperatingHours === true) && (state.appStates.conversationState === ConversationState.OutOfOffice);
    console.log("shouldShowOutOfOfficeHoursPane - Result:", result);
    return result;
};

export const shouldShowPreChatSurveyPane = (state: ILiveChatWidgetContext) => {
    console.log("shouldShowPreChatSurveyPane - Evaluating:", { 
        conversationState: state.appStates.conversationState 
    });
    const result = (state.appStates.conversationState === ConversationState.Prechat);
    console.log("shouldShowPreChatSurveyPane - Result:", result);
    return result;
};

export const shouldShowConfirmationPane = (state: ILiveChatWidgetContext) => {
    console.log("shouldShowConfirmationPane - Evaluating:", { 
        showConfirmationPane: state.uiStates.showConfirmationPane 
    });
    const result = state.uiStates.showConfirmationPane;
    console.log("shouldShowConfirmationPane - Result:", result);
    return result;
};

export const shouldShowPostChatSurveyPane = (state: ILiveChatWidgetContext) => {
    console.log("shouldShowPostChatSurveyPane - Evaluating:", { 
        conversationState: state.appStates.conversationState 
    });
    const result = (state.appStates.conversationState === ConversationState.Postchat);
    console.log("shouldShowPostChatSurveyPane - Result:", result);
    return result;
};

export const shouldShowCallingContainer = (state: ILiveChatWidgetContext) => {
    console.log("shouldShowCallingContainer - Evaluating:", { 
        conversationState: state.appStates.conversationState, 
        e2vvEnabled: state.appStates.e2vvEnabled 
    });
    const result = (state.appStates.conversationState === ConversationState.Active) &&
        state.appStates.e2vvEnabled;
    console.log("shouldShowCallingContainer - Result:", result);
    return result;
};