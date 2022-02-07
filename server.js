import { createServer } from 'http';
import fs, { readFile } from 'fs';
import url, {parse} from 'url';
import { Server } from 'socket.io';

class AppServer {
    
    constructor () {
        this.counter = 0;
        this.logFilename = "count_log.txt"
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

            socket.on('count', function () {
                caller.count(socket);
            });
        });
    }

    init () {
        let httpServer = createServer(function(req, res) {
            let path = parse(req.url).pathname;
            console.log(path);
            let contentType = 'text/html';
            if (path === '/') {
                path = '/index.html';
            } else if (path.indexOf('.css')) {
                contentType = 'text/css';
            }
            let filePath = (new URL(import.meta.url)).pathname.replaceAll("%20", " ");
            readFile(filePath.slice(1, filePath.lastIndexOf("/") + 1) + path, function (error, data) {
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(data, 'utf-8');
            });
        });

        let io = new Server(httpServer);
        this.registerSocketIO(io);
        httpServer.listen(3000)
    }
}

let appServer = new AppServer();
appServer.init();