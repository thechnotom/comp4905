import { createServer } from 'http';
import express from 'express';
import fs, { readFile } from 'fs';
import url, {parse, fileURLToPath} from 'url';
import { Server } from 'socket.io';
import path from 'path'

class AppServer {
    
    constructor () {
        this.app = express();
        this.counter = 0;
        this.logFilename = "count_log.txt"
        this.PORT = process.env.PORT || 3000;
        fs.writeFile(this.logFilename, "", function() {
            console.log("log file created");
        })
    }

    count (socket) {
        console.log("server received count button push");
        this.counter += 1;
        fs.appendFile(this.logFilename, (new Date()).toString() + " -> counter=" + this.counter + "\n", function () {
            console.log("writing counter to log");
        });
        socket.emit('count', {"counter": this.counter});
    }

    registerSocketIO (io) {
        let caller = this;

        io.sockets.on('connection', function (socket) {
            console.log('User connected');
            socket.emit('information', {"port" : caller.PORT})

            socket.on('count', function () {
                caller.count(socket);
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