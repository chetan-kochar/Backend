import dotenv from "dotenv";
dotenv.config({path : "./.env"});

import express from "express"
const app = express();

const port = process.env.PORT || 3000

// Connecting to dB
import connect_dB from "./db/index.js"
connect_dB()
.then(()=>{
    app.listen(port, ()=>{
        console.log(`Listening on port ${port}/nhttp://localhost:${port}`)
    })
})
.catch(err =>{console.log(err)});

app.get("/",(req,res)=>{
    res.send("Hello")
})