import "@testing-library/jest-dom";

import { cleanup, render } from "@testing-library/react";

import CallingContainer from "./CallingContainer";
import { ICallingContainerControlProps } from "./interfaces/ICallingContainerControlProps";
import React from "react";
import { defaultCallingContainerProps } from "./common/defaultProps/defaultCallingContainerProps";

const callingConainerStyleProps = defaultCallingContainerProps.styleProps;

const incomingCallCallingContainerControlProps: ICallingContainerControlProps = {
    ...defaultCallingContainerProps.controlProps,
    isIncomingCall: true
};

const currentCallCallingContainerControlProps: ICallingContainerControlProps = {
    ...defaultCallingContainerProps.controlProps,
    isIncomingCall: false
};

describe("Calling Container component", () => {

    afterEach(() => {
        cleanup();
        jest.resetAllMocks();
    });

        it("renders incoming call toast", () => {
            const {container} = render(
                <CallingContainer controlProps={incomingCallCallingContainerControlProps} styleProps={callingConainerStyleProps} />);
            expect(container.childElementCount).toBe(1);
        });

        it("renders current call control", () => {
            const {container} = render(
                <CallingContainer controlProps={currentCallCallingContainerControlProps} styleProps={callingConainerStyleProps} />);
            expect(container.childElementCount).toBe(1);
        });
});