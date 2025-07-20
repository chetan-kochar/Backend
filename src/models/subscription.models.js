import {Schema , model} from "mongoose" ;

const subscriberSchema = new Schema({
    subscribed : [{
        type : Schema.Types.ObjectId, //channels to whom you subscribed
        ref : "User"
    }],
    subscribers : [{
        type : Schema.Types.ObjectId, //users who have subscribed to you
        ref : "User"
    }]
}
    ,{timestamps : true})

export const Subscription = model("Subscription" , subscriberSchema);