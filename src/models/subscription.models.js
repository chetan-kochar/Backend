import {Schema , model} from "mongoose" ;

const subscriberSchema = new Schema({
    channel : {
        type : Schema.Types.ObjectId, //channels to whom user subscribed
        ref : "User"
    },
    subscriber : {
        type : Schema.Types.ObjectId, //users who have subscribed
        ref : "User"
    }
}
    ,{timestamps : true})

export const Subscription = model("Subscription" , subscriberSchema);