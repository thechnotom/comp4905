class App {

    constructor () {
        this.currentStage = 0;
        this.recording = null;
        this.userID = -1;
        this.completedStage = false;
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
            let name = this.audioData[i]["stage"];
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
        this.recording = new Passcode(this.audioData[this.currentStage]["intervals_ms"]);
    }

    finishRecording () {
        let results = this.recording.calcResult();
        console.log("RESULT: " + results["matches"]);
        this.displayResults(results);
        let logLine = this.generateLogString(results);
        document.getElementById("log-textarea").value += logLine + "\n";
        this.sendAttemptResults(logLine);
        return results;
    }

    sendAttemptResults (logLine) {
        console.log("emiting 'attempt'");
        this.socket.emit("attempt", { "log" : logLine });
    }

    generateLogString (data) {
        let result = (new Date()).toString();
        result += ",user=" + this.userID;
        result += ",type=" + (this.isPracticeStage() ? "practice" : "trial");
        result += ",stage=" + this.audioData[this.currentStage]["stage"];
        result += ",match=" + data["matches"];
        result += ",bLen=" + data["lengths"]["base"];
        result += ",aLen=" + data["lengths"]["attempt"];
        result += ",intSuc_pos=" + data["intervals"]["possible"];
        result += ",intSuc_req=" + data["intervals"]["required"];
        result += ",intSuc_res=" + data["intervals"]["received"];
        return result;
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

    clearResults () {
        $("#stat-result").text("N/A");
        $("#stat-accuracy").text("N/A");
    }

    highlightStage (finished=false) {
        for (let i = 0; i < this.audioData.length; ++i) {
            document.getElementById("stage-table-" + this.audioData[i]["stage"]).classList.remove("highlighted-stage");
        }
        if (finished) {
            return;
        }
        let stage = document.getElementById("stage-table-" + this.audioData[this.currentStage]["stage"]);
        stage.classList.add("highlighted-stage");
    }

    nextStage () {
        //this.currentStage = (this.currentStage + 1) % this.audioData.length;
        ++this.currentStage;
        this.highlightStage(this.isFinished());
        this.clearResults();
        this.completedStage = false;
        if (this.isFinished()) {
            this.completedStage = true;
            document.getElementById("play-audio").toggleAttribute("disabled", true);
            console.log("end of audio data");
            return;
        }
        console.log("advancing to: " + this.audioData[this.currentStage]["filename"]);
    }

    isPracticeStage () {
        return this.audioData[this.currentStage]["order"] < 0;
    }

    isFinished () {
        return this.currentStage >= this.audioData.length;
    }

    registerClientActions () {
        let caller = this;

        $("#play-audio").click(function () {
            document.getElementById("audio").setAttribute("src", "audio/mp3/" + caller.audioData[caller.currentStage]["filename"]);
            console.log("playing: " + caller.audioData[caller.currentStage]["filename"]);
            document.getElementById("audio").play();
        });

        $("#next-audio").click(function () {
            caller.nextStage();
            document.getElementById("next-audio").toggleAttribute("disabled", true);
            document.getElementById("next-audio").classList.remove("highlighted-button");
        });

        $("#recording-toggle").click(function () {
            if (caller.completedStage) {
                return;
            }
            let click_element = document.getElementById("recording-toggle");
            if (click_element.getAttribute("class") === "unselected") {
                click_element.setAttribute("class", "selected");
                document.getElementById("next-audio").toggleAttribute("disabled", true);
                $("#recording-status").text("Recording Active");
                caller.beginRecording();
            }
            else {
                if (!caller.isPracticeStage()) {
                    caller.completedStage = true;
                }
                click_element.setAttribute("class", "unselected");
                $("#recording-status").text("Not Recording");
                caller.finishRecording();
                document.getElementById("next-audio").toggleAttribute("disabled", false);
                document.getElementById("next-audio").classList.add("highlighted-button");
            }
        });

        $("#log-copy").click(function () {
            navigator.clipboard.writeText(document.getElementById("log-textarea").value);
            alert("Logs copied to clipboard");
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
            caller.pageSetup("stage");
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