import { FacadeChatSDKStore } from "../contexts/FacadeChatSDKStore";
import { useContext } from "react";

const useFacadeChatSDKStore = () => {
    //    const facadeChatSDK = useContext(FacadeChatSDKStore);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
    const facadeChatSDK : [any, (facadeChatSDK: any) => void] = useContext(FacadeChatSDKStore);

    if (!facadeChatSDK) {
        throw new Error("This hook is not called on component that is descendants of <FacadeSDKStore.Provider>, or FacadeSDKStore is not passed into LiveChatWidget component.");
    }

    return facadeChatSDK;
};

export default useFacadeChatSDKStore;