import "@testing-library/jest-dom";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { BroadcastServiceInitialize } from "../../services/BroadcastService";
import ConfirmationPane from "./ConfirmationPane";
import { IConfirmationPaneProps } from "./interfaces/IConfirmationPaneProps";
import React from "react";
import { Texts } from "../../common/Constants";
import { defaultConfirmationPaneProps } from "./common/defaultProps/defaultConfirmationPaneProps";

beforeAll(() => {
    BroadcastServiceInitialize("testChannel");
});

describe("Confirmation Pane component", () => {

    afterEach(() => {
        cleanup();
        jest.resetAllMocks();
    });
    
        it("renders confirmation pane", () => {
            const {container} = render(
                <ConfirmationPane {...defaultConfirmationPaneProps}/>);
            
            expect(container.childElementCount).toBe(1);
        });

        it("hide confirmation pane", () => {
            const confirmationPanePropsHide: IConfirmationPaneProps = {
                ...defaultConfirmationPaneProps,
                controlProps: {
                    ...defaultConfirmationPaneProps.controlProps,
                    hideConfirmationPane: true
                }
            };
            const {container} = render(
                <ConfirmationPane {...confirmationPanePropsHide}/>);
            expect(container.childElementCount).toBe(0);
        });
        it("hide title", () => {
            const confirmationPanePropsHide: IConfirmationPaneProps = {
                ...defaultConfirmationPaneProps,
                controlProps: {
                    ...defaultConfirmationPaneProps.controlProps,
                    hideTitle: true
                }
            };
            render(<ConfirmationPane {...confirmationPanePropsHide}/>);

            try {
                screen.getByText(Texts.ConfirmationPaneTitle);
                fail("Title should not be in the document");
            // eslint-disable-next-line no-empty
            } catch (ex) {
            }

            try {
                screen.getByText(Texts.ConfirmationPaneSubtitle);
            } catch (ex) {
                fail("Subtitle should be in the document");
            }
        });

        it("hide subtitle", () => {
            const confirmationPanePropsHide: IConfirmationPaneProps = {
                ...defaultConfirmationPaneProps,
                controlProps: {
                    ...defaultConfirmationPaneProps.controlProps,
                    hideSubtitle: true
                }
            };
            render(<ConfirmationPane {...confirmationPanePropsHide}/>);

            try {
                screen.getByText(Texts.ConfirmationPaneSubtitle);
                fail("Subitle should not be in the document");
            // eslint-disable-next-line no-empty
            } catch (ex) {
            }

            try {
                screen.getByText(Texts.ConfirmationPaneTitle);
            } catch (ex) {
                fail("Title should be in the document");
            }
        });

        it("hide confirm button", () => {
            const confirmationPanePropsHide: IConfirmationPaneProps = {
                ...defaultConfirmationPaneProps,
                controlProps: {
                    ...defaultConfirmationPaneProps.controlProps,
                    hideConfirmButton: true
                }
            };
            render(<ConfirmationPane {...confirmationPanePropsHide}/>);

            try {
                screen.getByText(Texts.ConfirmButtonText);
                fail("Confirm Button should not be in the document");
            // eslint-disable-next-line no-empty
            } catch (ex) {
            }

            try {
                screen.getByText(Texts.CancelButtonText);
            } catch (ex) {
                fail("Cancel button should be in the document");
            }
        });
        it("hide cancel button", () => {
            const confirmationPanePropsHide: IConfirmationPaneProps = {
                ...defaultConfirmationPaneProps,
                controlProps: {
                    ...defaultConfirmationPaneProps.controlProps,
                    hideCancelButton: true
                }
            };
            render(<ConfirmationPane {...confirmationPanePropsHide}/>);

            try {
                screen.getByText(Texts.CancelButtonText);
                fail("Cancel Button should not be in the document");
            // eslint-disable-next-line no-empty
            } catch (ex) {
            }

            try {
                screen.getByText(Texts.ConfirmButtonText);
            } catch (ex) {
                fail("Confirm button should be in the document");
            }
        });

        it("confirmation pane button clicked", () => {
            const handleConfirmClick = jest.fn();
            const handleCancelClick = jest.fn();

            const confirmationPaneProps: IConfirmationPaneProps = {
                ...defaultConfirmationPaneProps,
                controlProps: {
                    ...defaultConfirmationPaneProps.controlProps,
                    onConfirm: handleConfirmClick,
                    onCancel: handleCancelClick
                }
            };

            render(<ConfirmationPane {...confirmationPaneProps}/>);

            const confirmButton = screen.getByText(Texts.ConfirmButtonText);
            fireEvent.click(confirmButton);
            expect(handleConfirmClick).toHaveBeenCalledTimes(1);

            const cancelButton = screen.getByText(Texts.CancelButtonText);
            fireEvent.click(cancelButton);
            expect(handleCancelClick).toHaveBeenCalledTimes(1);
        });
});