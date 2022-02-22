import { createServer } from "http";
import express from "express";
import fs, { readFile } from "fs";
import url, {parse, fileURLToPath} from "url";
import { Server } from "socket.io";
import path from "path";

class AppServer {
    
    constructor () {
        this.app = express();
        this.logFilename = "attempt_log.txt"
        this.PORT = process.env.PORT || 3000;
        fs.writeFileSync(this.logFilename, "");
        console.log("log file created");
    }

    gatherAudioData () {
        let result = {"audio" : []};
        let jsonFiles = fs.readdirSync("public/audio/json");
        for (let i = 0; i < jsonFiles.length; ++i) {
            let parsedData = JSON.parse(fs.readFileSync("public/audio/json/" + jsonFiles[i]));
            result["audio"].push({
                "filename" : parsedData["mp3"],
                "intervals_ms" : parsedData["intervals_ms"],
                "stage" : parsedData["stage"],
                "order" : parsedData["order"]
            });
        }
        result["audio"].sort(function (a, b) {
            return a["order"] - b["order"];
        });
        return result;
    }

    handleAttemptResults (logLine) {
        console.log("writing attempt data to log: " + logLine);
        fs.appendFileSync(this.logFilename, logLine + "\n");
    }

    registerSocketIO (io) {
        let caller = this;

        io.sockets.on("connection", function (socket) {
            console.log("User connected (" + (new Date()).toString() + ")");
            socket.emit("audioData", caller.gatherAudioData());

            socket.on("attempt", function (data) {
                console.log("server received attempt data");
                caller.handleAttemptResults(data["log"]);
            });

            socket.on("all-attempts", function (data) {
                console.log("receiving all current logs");
                caller.handleAttemptResults("all current logs");
                for (let i = 0; i < data["logs"].length; ++i) {
                    caller.handleAttemptResults("| " + data["logs"][i]);
                }
            });

            socket.on("disconnect", function () {
                console.log("User disconnected (" + (new Date()).toString() + ")");
            });
        });
    }

    init () {
        let caller = this;
        let __dirname = path.dirname(fileURLToPath(import.meta.url));
        console.log("filepath: " + __dirname)

        this.app.use(express.static(__dirname + "/public"));

        this.app.get('/', function (req, res) {
            res.sendFile(__dirname + '/views/index.html');
        });

        let server = createServer(this.app).listen(this.PORT, function () {
            console.log("Listening on port " + caller.PORT);
        });

        let io = new Server(server);
        this.registerSocketIO(io);
    }
}

let appServer = new AppServer();
appServer.init();