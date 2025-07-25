import mongoose,{Schema, Types} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";


const replySchema = new Schema({
    video : {
        type : Schema.Types.ObjectId,
        ref : "Video"
    },
    replier : {
        type : Schema.Types.ObjectId,
        ref : "User"
    },
    ogComment:{     //Comment to which replier is replying
        type : Schema.Types.ObjectId,
        ref:"Comment"
    },
    content:{
        type : String,
        required : true 
    }
},{timestamps : true})

replySchema.plugin(mongooseAggregatePaginate);

export const Reply = mongoose.model("Reply",replySchema) 