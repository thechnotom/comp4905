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

        $('#count-button').click(function () {
            caller.countButton();
            console.log("count button pressed on client");
        });

        $('#play-audio').click(function () {
            document.getElementById("test-audio").play();
        });

        $('#click-area').click(function () {
            let click_element = document.getElementById("click-area");
            if (click_element.getAttribute("class") === "unselected") {
                click_element.setAttribute("class", "selected");
                $("#recording-status").text("Recording Active");
            }
            else {
                click_element.setAttribute("class", "unselected");
                $("#recording-status").text("Not Recording");
            }
        });

        $(document).on("keypress", function (e) {
            console.log("key pressed: " + e.which)
            if (e.which === 32) {
                console.log("space bar pressed");
            }
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