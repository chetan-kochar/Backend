import mongoose , {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"; 

const postSchema = new Schema({
    owner:{
        type : Schema.Types.ObjectId,
        ref : "User"
    },
    content : {
        type : String,
        required : true
    }
},{timestamps : true})

postSchema.plugin(mongooseAggregatePaginate)

export const Post = mongoose.model("Post" , postSchema)