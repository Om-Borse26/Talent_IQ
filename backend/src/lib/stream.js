import {StreamChat} from "stream-chat";
import { StreamClient } from "@stream-io/node-sdk";
import { ENV } from "./env.js";

const apiKey = ENV.STREAM_API_KEY;
const apiSecret = ENV.STREAM_API_SECRET;

if(!apiKey || !apiSecret){
    console.error("Stream API key or secret is missing");
}

export const chatClient = StreamChat.getInstance(apiKey,apiSecret); // this will be used for chat messaging
export const streamClient = new StreamClient(apiKey,apiSecret); // this will be used for video calls

export const upsertStreamUser = async(userData)=>{
    try {
        await chatClient.upsertUser(userData);
        console.log("Stream User upserted successfully", userData);
    } catch (error) {
        console.error("Error upserting user to stream",error);
    }
}

export const deleteStreamUser = async(userId)=>{
    try {
        await chatClient.deleteUser(userId);
        console.log("Stream User deleted successfully", userId);
    } catch (error) {
        console.error("Error deleting user from stream",error);
    }
};