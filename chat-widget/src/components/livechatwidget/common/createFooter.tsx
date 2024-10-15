//import FooterStateful from "../../footerstateful/FooterStateful";
import { ILiveChatWidgetContext } from "../../../contexts/common/ILiveChatWidgetContext";
import { ILiveChatWidgetProps } from "../interfaces/ILiveChatWidgetProps";
import React, { lazy, Suspense } from "react";
import { decodeComponentString } from "@microsoft/omnichannel-chat-components";
import { shouldShowFooter } from "../../../controller/componentController";

export const createFooter = (props: ILiveChatWidgetProps, state: ILiveChatWidgetContext) => {
    const FooterStateful = lazy(() => import(/* webpackChunkName: "FooterStateful" */ "../../footerstateful/FooterStateful").then(module => ({ default: module.FooterStateful })));
    const hideFooterDisplay = (!props.controlProps?.hideFooter && shouldShowFooter(state)) ? false : true;
    const footer = (decodeComponentString(props.componentOverrides?.footer) || 
    
        <Suspense fallback={<div>Footer</div>}>
            <FooterStateful footerProps={props.footerProps} downloadTranscriptProps={props.downloadTranscriptProps} audioNotificationProps={props.audioNotificationProps} hideFooterDisplay={hideFooterDisplay} />
        </Suspense>
    );

    return footer;
};
