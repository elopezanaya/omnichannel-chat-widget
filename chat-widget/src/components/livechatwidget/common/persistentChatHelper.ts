import { FacadeChatSDK } from "../../../common/facades/FacadeChatSDK";
import { isPersistentChatEnabled } from "./liveChatConfigUtils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const shouldSetPreChatIfPersistentChat = async (facadeChatSDK: FacadeChatSDK, conversationMode: string, showPreChat: boolean) => {
    const persistentEnabled = await isPersistentChatEnabled(conversationMode);
    let skipPreChat = false;
    if (persistentEnabled) {
        const reconnectableChatsParams = {
            authenticatedUserToken: facadeChatSDK.getChatSDK().authenticatedUserToken as string,
            requestId: facadeChatSDK.getChatSDK().requestId as string,
        };

        try {

            if (reconnectableChatsParams.authenticatedUserToken === undefined || reconnectableChatsParams.authenticatedUserToken.length === 0) {
                console.warn("Authenticated user token is not available. Cannot check for reconnectable chats.");
                return false;
            }

            const reconnectableChatsResponse = await facadeChatSDK.getReconnectableChats(reconnectableChatsParams);
            if (reconnectableChatsResponse && reconnectableChatsResponse.reconnectid) { // Skip rendering prechat on existing persistent chat session
                skipPreChat = true;
            }
        } catch {
            // eslint-disable-line no-empty
        }
    }

    return showPreChat && !skipPreChat;
};