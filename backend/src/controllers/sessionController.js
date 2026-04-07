import { chatClient, streamClient } from "../lib/stream.js";
import Session from "../models/Session.js";

export async function createSession(req, res) {
  try {
    const { problem, difficulty } = req.body;
    const userId = req.user._id;
    const clerkId = req.user.clerkId;

    if (!problem || !difficulty) {
      return res
        .status(400)
        .json({ message: "Problem and difficulty are required" });
    }

    //generate a unique call id for stream video call
    const callId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    //create session in db
    const session = await Session.create({
      problem,
      difficulty,
      host: userId,
      callId,
    });

    //create stream video call
    await streamClient.video.call("default", callId).getOrCreate({
      data: {
        created_by_id: clerkId,
        custom: { problem, difficulty, sessionId: session._id.toString() },
      },
    });

    //chat messaging

    const channel = chatClient.channel("messaging", callId, {
      name: `${problem} Session`,
      created_by_id: clerkId,
      members: [clerkId],
    });

    await channel.create();
    res.status(201).json({ message: "Session created successfully", session });
  } catch (error) {
    console.error("Error creating session", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getActiveSessions(_, res) {
  try {
    const sessions = await Session.find({ status: "active" })
      .populate("host", "name profileImage email clerkId")
      .sort({ createdAt: -1 });
    res.status(200).json({ sessions });
  } catch (error) {
    console.error("Error getting active sessions", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getMyRecentSessions(req, res) {
  try {
    const userId = req.user._id;
    //get sessions where user is either host or participant
    const sessions = await Session.find({
      status: "completed",
      $or: [{ host: userId }, { participant: userId }],
    })
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({ sessions });
  } catch (error) {
    console.error("Error getting my recent sessions", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getSessionById(req, res) {
  try {
    const { id } = req.params;
    const session = await Session.findById(id).populate(
      "host",
      "name email profileImage clerkId",
    ).populate("participant", "name email profileImage clerkId");

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }
    res.status(200).json({ session });
  } catch (error) {
    console.error("Error getting session by id", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function joinSession(req, res) {
    try {
        const {id} = req.params;
        const userId = req.user._id;
        const clerkId = req.user.clerkId;

        const session = await Session.findById(id);
        if(!session){
            return res.status(404).json({ message: "Session not found" });
        }
        if(session.status !== "active"){
            return res.status(400).json({ message: "Cannot join a completed session" });
        }

        //if you are the host then you cant be the participant
        if(session.host.toString() === userId.toString()){
            return res.status(400).json({ message: "You are the host of this session, cannot join as participant" });
        }
        if(session.participant){
            return res.status(409).json({ message: "Session is already full" });
        }
        session.participant = userId;
        await session.save();

        const channel = chatClient.channel("messaging", session.callId);
        await channel.addMembers([clerkId]);
        res.status(200).json({ message: "Joined session successfully", session });
    } catch (error) {
        console.error("Error joining session", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export async function endSession(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user._id;

      const session = await Session.findById(id);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      //check if user is the host - beacuse only host can close the session
      if (session.host.toString() !== userId.toString()) {
        return res
          .status(403)
          .json({ message: "You are not authorized to end this session" });
      }

      //check if session is already completed
      if(session.status === "completed"){
          return res.status(400).json({ message: "Session is already completed" });
      }
      
      //end the stream video call
      const call = streamClient.video.call("default", session.callId);
      call.delete({hard: true});
      
      //end the stream chat
      const channel = chatClient.channel("messaging", session.callId);
      await channel.delete();
      
      session.status = "completed";
      await session.save();

      res.status(200).json({ message: "Session ended successfully", session });
    } catch (error) {
        console.error("Error ending session", error);
        res.status(500).json({ message: "Internal server error" });
    }
}
