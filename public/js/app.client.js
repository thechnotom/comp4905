class App {

    constructor () {
        this.currentAudio = 0;
        this.recording = null;
        this.userID = -1;
    }

    pageSetup () {
        // get up user ID
        let result = null;
        while (result == null || isNaN(result) || result < 0) {
            result = parseInt(prompt("Enter your user ID (provided by researcher)"));
        }
        this.userID = result;
        $("#user-id").text(this.userID);

        // set up stages table
        let stageTable = document.getElementById("stage-table");
        for (let i = 0; i < this.audioData.length; ++i) {
            let name = this.audioData[i]["filename"];
            let row = document.createElement("tr");
            row.setAttribute("id", "stage-table-" + name);
            let item = document.createElement("td");
            let text = document.createTextNode(name);
            item.appendChild(text);
            row.appendChild(item);
            stageTable.appendChild(row);
        }
        this.highlightStage();
    }

    beginRecording () {
        this.recording = new Passcode(this.audioData[this.currentAudio]["intervals_ms"]);
    }

    finishRecording () {
        let results = this.recording.calcResult();
        console.log("RESULT: " + results["matches"]);
        this.displayResults(results);
        this.sendAttemptResults(results);
        return results;
    }

    sendAttemptResults (results) {
        console.log("emiting 'attempt'");
        this.socket.emit("attempt", { "userID" : this.userID, "results" : results });
    }

    displayResults (results) {
        $("#stat-result").text(results["matches"] ? "True" : "False");
        let possible = results["ratios"]["possible"];
        let received = results["ratios"]["received"];
        let accuracy = 0
        for (let i = 0; i < possible.length; ++i) {
            accuracy += ((received[i] / possible[i]) * 100) / possible.length;
        }
        $("#stat-accuracy").text(Math.round(accuracy) + "%");
    }

    highlightStage () {
        let stage = document.getElementById("stage-table-" + this.audioData[this.currentAudio]["filename"]);
        for (let i = 0; i < this.audioData.length; ++i) {
            document.getElementById("stage-table-" + this.audioData[i]["filename"]).classList.remove("highlighted");
        }
        stage.classList.add("highlighted");
    }

    nextStage () {
        this.currentAudio = (this.currentAudio + 1) % this.audioData.length;
        this.highlightStage();
        console.log("advancing to: " + this.audioData[this.currentAudio]["filename"]);
    }

    registerClientActions () {
        let caller = this;

        $("#play-audio").click(function () {
            document.getElementById("audio").setAttribute("src", "audio/mp3/" + caller.audioData[caller.currentAudio]["filename"]);
            console.log("playing: " + caller.audioData[caller.currentAudio]["filename"]);
            document.getElementById("audio").play();
        });

        $("#next-audio").click(function () {
            caller.nextStage();
        });

        $("#recording-toggle").click(function () {
            let click_element = document.getElementById("recording-toggle");
            if (click_element.getAttribute("class") === "unselected") {
                click_element.setAttribute("class", "selected");
                $("#recording-status").text("Recording Active");
                caller.beginRecording();
            }
            else {
                click_element.setAttribute("class", "unselected");
                $("#recording-status").text("Not Recording");
                caller.finishRecording();
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
            caller.pageSetup();
        });
    }

    init () {
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