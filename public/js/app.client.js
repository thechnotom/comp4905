class App {

    constructor () {
        this.currentAudio = 0;
        this.recording = null;
    }

    beginRecording () {
        this.recording = new Passcode(this.audioData[this.currentAudio]["intervals_ms"]);
    }

    finishRecording () {
        let result = this.recording.calcResult();
        console.log("RESULT: " + result);
        this.sendAttemptResults({ "result" : result });
        return result;
    }

    sendAttemptResults (results) {
        console.log("emiting 'attempt'");
        this.socket.emit("attempt", results);
    }

    registerClientActions () {
        let caller = this;

        $("#play-audio").click(function () {
            document.getElementById("audio").setAttribute("src", "audio/mp3/" + caller.audioData[caller.currentAudio]["filename"]);
            console.log("playing: " + caller.audioData[caller.currentAudio]["filename"]);
            document.getElementById("audio").play();
        });

        $("#next-audio").click(function () {
            caller.currentAudio = (caller.currentAudio + 1) % caller.audioData.length;
            console.log("advancing to: " + caller.audioData[caller.currentAudio]["filename"]);
        });

        $("#click-area").click(function () {
            let click_element = document.getElementById("click-area");
            if (click_element.getAttribute("class") === "unselected") {
                click_element.setAttribute("class", "selected");
                $("#recording-status").text("Recording Active");
                caller.beginRecording();
            }
            else {
                click_element.setAttribute("class", "unselected");
                $("#recording-status").text("Not Recording");
                let result = caller.finishRecording();
                $("#attempt-result").text(result ? "success" : "failure");
            }
        });

        $(document).on("keypress", function (e) {
            if (e.which === 32) {
                console.log("space bar pressed");
                caller.recording.addTime(Date.now());
            }
        });
    }

    registerServerActions () {
        let caller = this;

        this.socket.on('information', function (data) {
            console.log("client receive 'information' from server");
            caller.audioData = data["audio"];
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