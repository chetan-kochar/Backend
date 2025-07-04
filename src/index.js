import dotenv from "dotenv";
dotenv.config({path : "./.env"});

import express from "express"
const app = express()

// Connecting to dB
import connect_dB from "./db/index.js"
connect_dB()
