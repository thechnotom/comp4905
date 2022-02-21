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
        fs.writeFile(this.logFilename, "", function() {
            console.log("log file created");
        })
    }

    gatherAudioData () {
        let result = {"audio" : []};
        let jsonFiles = fs.readdirSync("audio/json");
        for (let i = 0; i < jsonFiles.length; ++i) {
            let parsedData = JSON.parse(fs.readFileSync("audio/json/" + jsonFiles[i]));
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

    handleAttemptResults (data) {
        console.log("server received attempt data");
        fs.appendFile(this.logFilename, data["log"] + "\n", function () {
            console.log("writing attempt data to log: " + data["log"]);
        });
    }

    registerSocketIO (io) {
        let caller = this;

        io.sockets.on('connection', function (socket) {
            console.log('User connected');
            socket.emit("information", caller.gatherAudioData());

            socket.on("attempt", function (data) {
                caller.handleAttemptResults(data);
            });
        });
    }

    init () {
        let caller = this;
        let __dirname = path.dirname(fileURLToPath(import.meta.url));
        console.log("filepath: " + __dirname)

        this.app.use(express.static(__dirname));

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