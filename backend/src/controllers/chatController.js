import { chatClient } from "../lib/stream.js ";

export async function getStreamToken(req,res){
    try {

        //use clerk id for stream not mongodb id it should match the id we have in the stream dashboard
        const token = chatClient.createToken(req.user.clerkId)

        return res.status(200).json({
            token,
            userId:req.user.clerkId,
            userName:req.user.name,
            userImage:req.user.image
        });
    } catch (error) {
        console.log("Error in getStreamToken controller",error.message);
        return res.status(500).json({msg:"Internal server error"});
    }
}
    