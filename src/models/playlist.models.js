import mongoose,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const playlistSchema = new Schema({
    owner:{
        type : Schema.Types.ObjectId,
        ref  : "User"
    },
    name:{
        type : String,
        required : true
    },
    videos: [
        {
            type: Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    description : {
        type : String,
        required : true
    }
},{timestamps : true})

playlistSchema.plugin(mongooseAggregatePaginate)

export const Playlist = mongoose.model("Playlist",playlistSchema)