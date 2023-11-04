import { Subject } from "rxjs";
import { ICustomEvent } from "../interfaces/ICustomEvent";
import { filter } from "rxjs/operators";
import { BroadcastChannel } from "broadcast-channel";

const newMessage = new Subject<ICustomEvent>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const broadcastServicePubList: Record<string, any> = {};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const broadcastServiceSubList: Record<string, any> = {};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pubChannel: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let subChannel: any;

export const BroadcastServiceInitialize = (channelName: string, isSubOnly?: boolean) => {

    if (!isSubOnly) {
        createPubChannel(channelName);
    }
    createSubChannel(channelName);
};

const createPubChannel = (channelName: string) => {
    if (broadcastServicePubList[channelName]) {
        console.log("ELOPEZNAYA :CMP :channel already exists : " + channelName + "");
        //pubChannel = broadcastServicePubList[channelName];
    } else {
        console.log("ELOPEZNAYA :CMP :channel created : " + channelName + "");
        const newPubChannel = new BroadcastChannel(channelName);
        broadcastServicePubList[channelName] = newPubChannel;
        pubChannel = newPubChannel;
    }
};

const createSubChannel = (channelName: string) => {

    if (broadcastServiceSubList[channelName]) {
        console.log("ELOPEZNAYA :CMP :sub channel already exists : " + channelName + "");
        // subChannel = broadcastServiceSubList[channelName];
    } else {
        console.log("ELOPEZNAYA :CMP :sub channel created : " + channelName + "");
        const newSubChannel = new BroadcastChannel(channelName);
        broadcastServiceSubList[channelName] = newSubChannel;
        subChannel = newSubChannel;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        subChannel.onmessage = (message: any) => {
            newMessage.next(message);
        };

    }

};

export const BroadcastService = {
    //broadcast a message
    postMessage: (message: ICustomEvent) => {

        console.log("ELOPEZNAYA :CMP :BroadcastService :postMessage : " + message.eventName + " ::" + message.eventName.indexOf("out:") );

        if (message.eventName.indexOf("out:")>-1) {
            const ch = broadcastServicePubList["tortas"];
            console.log("ELOPEZNAYA :CMP :: TORTAS :: BroadcastService :postMessage : " + message.eventName + "");

            if (ch !== null || ch !== undefined) {
                console.log("ELOPEZNAYA :CMP :BroadcastService :postMessage : tortas channel:: " + message.eventName + " : " + JSON.stringify(message) + "");
                ch.postMessage(JSON.parse(JSON.stringify(message)));
            } else {
                console.log("ELOPEZANAYA :: no se ... , pub foir tortas channel");
                pubChannel.postMessage(JSON.parse(JSON.stringify(message)));
            }

        } else {
            const ch = broadcastServicePubList["tacos"];
            console.log("ELOPEZNAYA :CMP :: TACOS :: BroadcastService :postMessage : " + message.eventName + "");

            if (ch !== null || ch !== undefined) {
                console.log("ELOPEZNAYA :CMP :BroadcastService :postMessage : tacos channel:: " + message.eventName + " : " + JSON.stringify(message) + "");
                ch.postMessage(JSON.parse(JSON.stringify(message)));
            } else {
                console.log("ELOPEZANAYA :: no se ... , pub foir tacos channel");
                pubChannel.postMessage(JSON.parse(JSON.stringify(message)));
            }
        }
        /**
         * Omit copying methods to prevent 'DataCloneError' in older browsers when passing an object with functions
         * This exception occurs when an object can't be clone with the 'structured clone algorithm' (used by postMessage)
         */

    },

    getMessage: (message: ICustomEvent) => {
        return newMessage.pipe(
            filter(msg => msg.elementId == message.elementId &&
                msg.elementType == message.elementType &&
                msg.eventName == message.eventName)
        );
    },

    getMessageByEventName: (eventName: string) => {

        return newMessage.pipe(
            filter(message => message.eventName === eventName)
        );
    },

    getAnyMessage: () => {
        return newMessage;
    },

    disposeChannel: () => { pubChannel.close(); subChannel.close(); }
};
