import "@babel/polyfill";
import dotenv from "dotenv";
import "./db";
import app from "./app";

dotenv.config();

import "./models/Video";
import "./models/Comment";
import "./models/User";

const PORT = process.env.PORT || 29000;

const handelListening = () => console.log(`Listening on: http://localhost:${PORT}`);

app.listen(PORT, handelListening);