import { createServer } from 'http';
import express from 'express';
import fs, { readFile } from 'fs';
import url, {parse, fileURLToPath} from 'url';
import { Server } from 'socket.io';
import path from 'path'

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
        let audioFiles = fs.readdirSync("audio/mp3/");
        let jsonFiles = fs.readdirSync("audio/json");
        for (let i = 0; i < audioFiles.length; ++i) {
            let targetJSON = audioFiles[i].substring(0, audioFiles[i].lastIndexOf(".")) + ".json";
            // ensure corresponding JSON exists
            if (jsonFiles.includes(targetJSON)) {
                let intervals = JSON.parse(fs.readFileSync("audio/json/" + targetJSON))["intervals_ms"];
                result["audio"].push({ "filename" : audioFiles[i], "intervals_ms" : intervals });
            }
            else {
                console.log("Unable to find JSON corresponding to: " + audioFiles[i]);
            }
        }
        return result;
    }

    handleAttemptResults (data) {
        console.log("server received attempt data");
        let logString = (new Date()).toString() + " -> result=" + data.result + "\n";
        fs.appendFile(this.logFilename, logString, function () {
            console.log("writing attempt data to log: " + logString);
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