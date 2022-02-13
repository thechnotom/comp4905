class App {

    constructor () {
        //
    }

    countButton () {
        console.log("emiting 'count'");
        this.socket.emit('count');
    }

    registerClientActions () {
        let caller = this;
        $('#countButton').click(function () {
            caller.countButton();
            console.log("count button pressed on client");
        });
    }

    registerServerActions () {
        this.socket.on('information', function (data) {
            console.log("client receive 'information' from server (port: " + data.port + ")");
        });

        this.socket.on('count', function (data) {
            console.log("client received 'count' from server (new count: " + data.counter + " )");
            $('#countLabel').text(data.counter);
        });
    }

    init () {
        //let socket = io.connect('http://localhost:3000');
        //let socket = io.connect('0.0.0.0:3000');
        //let socket = io.connect('192.168.0.48:3000');
        let socket = io.connect();
        this.socket = socket;
        this.registerClientActions();
        this.registerServerActions();
    }
}

$(document).ready(function () {
    let app = new App();
    app.init();
});