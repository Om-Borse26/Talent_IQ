import { useState, useEffect, useRef } from "react";
import { StreamChat } from "stream-chat";
import toast from "react-hot-toast";
import { initializeStreamClient, disconnectStreamClient } from "../lib/stream";
import { sessionApi } from "../api/sessions";

function useStreamClient(session, loadingSession, isHost, isParticipant) {
  const [streamClient, setStreamClient] = useState(null);
  const [call, setCall] = useState(null);
  const [chatClient, setChatClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [isInitializingCall, setIsInitializingCall] = useState(true);

  // Incremental generation id — each effect run gets a unique id so stale
  // async callbacks don't apply their results after cleanup/re-run.
  const generationRef = useRef(0);

  // Use a stable session identifier in the dep array to avoid retriggers
  // every time the polling query returns a fresh object reference.
  const sessionId = session?._id;
  const sessionCallId = session?.callId;
  const sessionStatus = session?.status;

  useEffect(() => {
    // Snapshot the current generation at the start of this run.
    const generation = ++generationRef.current;

    let videoCall = null;
    let chatClientInstance = null;

    const initCall = async () => {
      // Guard: wait for loading to finish and session to exist.
      if (loadingSession || !session) {
        // Don't mark done yet — still loading.
        return;
      }

      // Early exits that mean "we are definitely not going to connect".
      // Call setIsInitializingCall(false) so the UI doesn't spin forever.
      if (!sessionCallId) {
        setIsInitializingCall(false);
        return;
      }
      if (!isHost && !isParticipant) {
        setIsInitializingCall(false);
        return;
      }
      if (sessionStatus === "completed") {
        setIsInitializingCall(false);
        return;
      }

      try {
        const { token, userId, userName, userImage } =
          await sessionApi.getStreamToken();

        // Bail out if the effect was cleaned up or re-ran while we were waiting.
        if (generation !== generationRef.current) return;

        const client = await initializeStreamClient(
          { id: userId, name: userName, image: userImage },
          token,
        );

        if (generation !== generationRef.current) return;
        setStreamClient(client);

        videoCall = client.call("default", sessionCallId);
        await videoCall.join({ create: true });

        if (generation !== generationRef.current) return;
        setCall(videoCall);

        const apiKey = import.meta.env.VITE_STREAM_API_KEY;
        chatClientInstance = StreamChat.getInstance(apiKey);

        await chatClientInstance.connectUser(
          { id: userId, name: userName, image: userImage },
          token,
        );

        if (generation !== generationRef.current) return;
        setChatClient(chatClientInstance);

        const chatChannel = chatClientInstance.channel("messaging", sessionCallId);
        await chatChannel.watch();

        if (generation !== generationRef.current) return;
        setChannel(chatChannel);
      } catch (error) {
        if (generation !== generationRef.current) return;
        toast.error("Failed to join video call");
        console.error("Error init call", error);
      } finally {
        // Only update state if this generation is still current.
        if (generation === generationRef.current) {
          setIsInitializingCall(false);
        }
      }
    };

    initCall();

    return () => {
      // Snapshot the local refs so the async IIFE below uses the correct instances.
      const callToLeave = videoCall;
      const chatToDisconnect = chatClientInstance;

      (async () => {
        try {
          if (callToLeave) await callToLeave.leave();
          if (chatToDisconnect) await chatToDisconnect.disconnectUser();
          await disconnectStreamClient();
        } catch (error) {
          console.error("Cleanup error:", error);
        }
      })();
    };
  // Use stable primitives instead of the whole session object to avoid
  // re-running the effect every time the polling query returns a new reference.
  }, [sessionId, sessionCallId, sessionStatus, loadingSession, isHost, isParticipant]);

  return { streamClient, call, chatClient, channel, isInitializingCall };
}

export default useStreamClient;
