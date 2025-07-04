import mongoose from "mongoose"

// setting up dB connect link
import { dBname } from "../constants.js";
const dblink_noname = process.env.MONDODB_URL
const dblink = dblink_noname.replace("<dbname>" , dBname)

const connect_dB = async ()=>{
    try{
        const connectionInstance = await mongoose.connect(dblink);
        console.log("Successfully connected to Database !! \nDB HOst :",connectionInstance.connection.host)
    }
    catch(err){
        console.log("Connection to MongodB Failed\n",err)
        process.end(1)
    }
}

export default connect_dB