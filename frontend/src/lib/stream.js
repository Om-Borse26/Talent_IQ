import { StreamVideoClient } from "@stream-io/video-react-sdk";

const apiKey = import.meta.env.VITE_STREAM_API_KEY;

let client = null;

export const initializeStreamClient = async (user, token) => {
  // If client already exists for the same user, reuse it.
  if (client && client?.user?.id === user.id) return client;

  if (client) {
    await disconnectStreamClient();
  }

  if (!apiKey) throw new Error("Stream API key is not provided.");

  client = new StreamVideoClient({ apiKey, user, token });

  return client;
};

export const disconnectStreamClient = async () => {
  if (!client) return;

  // Capture the reference and null it out BEFORE awaiting, so that if
  // disconnectUser() throws, the module-scoped `client` is already cleared
  // and won't be reused in a broken state.
  const tmp = client;
  client = null;

  try {
    await tmp.disconnectUser();
  } catch (error) {
    console.error("Error disconnecting Stream client:", error);
    // Rethrow so callers (e.g. initializeStreamClient) can observe the failure.
    throw error;
  }
};
