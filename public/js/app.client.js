/* 
 * Thomas Roller
 * COMP 4905 (Winter 2022)
 *
 * Client JavaScript for the web application
 */

class App {

    constructor () {
        this.currentStage = 0;
        this.recording = null;
        this.userID = -1;
        this.completedStage = false;
        this.sessionNum = -1;
        this.logCount = 0;
        this.receivedData = false;
        this.logs = [];
    }

    /*
     * Prompts the user to enter information
     */
    requestInformation () {
        // set up user ID
        let result = null;
        while (result == null || isNaN(result) || result < 0) {
            result = parseInt(prompt("Enter your user ID (provided by researcher)"));
        }
        this.userID = result;
        $("#user-id").text(this.userID);

        // get session number
        result = null;
        while (result !== 1 && result !== 2) {
            result = parseInt(prompt("Enter session number (i.e., 1 or 2)"));
        }
        this.sessionNum = result;
        $("#session-num").text(this.sessionNum);

        // set up session label and instructions
        if (!this.canPlayAudio()) {
            document.getElementById("play-audio").toggleAttribute("disabled", true);
            $("#instruction-1").text("Recall the melody for the stage. Playback is disabled for this session.");
        }
    }

    /*
     * Performs page setup such as adding items to the stage table
     */
    pageSetup () {
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

    /*
     * Creates new object for storing and processing rhythm
     */
    beginRecording () {
        this.recording = new Passcode(this.audioData[this.currentStage]["intervals_ms"]);
    }

    /*
     * Stop accepting rhythm and process data
     * return: statistics on processing (including whether the entered rhythm is a match)
     */
    finishRecording () {
        let results = this.recording.calcResult();

        // add other data
        results["extra"] = {};
        results["extra"]["time"] = (new Date()).toString();
        results["extra"]["user"] = this.userID;
        results["extra"]["session"] = this.sessionNum;
        results["extra"]["type"] = (this.isPracticeStage() ? "practice" : "trial");
        results["extra"]["stage"] = this.audioData[this.currentStage]["stage"];
        results["extra"]["order"] = this.audioData[this.currentStage]["order"];

        console.log("RESULT: " + results["matches"]);
        this.displayResults(results);
        let logLine = this.generateLogString(results);
        document.getElementById("log-textarea").value += logLine + "\n";
        this.sendAttemptResults(logLine);
        ++this.logCount;
        $("#log-count").text(this.logCount);
        return results;
    }

    /*
     * Send log for a single attempt to the server
     * logLine: string being sent
     */
    sendAttemptResults (logLine) {
        this.logs.push(logLine);
        console.log("emiting 'attempt'");
        this.socket.emit("attempt", { "log" : logLine });
    }

    /*
     * Send all logs from the session to the server
     */
    sendAllLogs () {
        console.log("emitting 'all-attempts'");
        this.socket.emit("all-attempts", { "logs" : this.logs });
    }

    /*
     * Create a one-line string representing an attempt
     * data: statistics returned from Passcode.calcResult()
     * return: string representation of the attempt
     */
    generateLogString (data) {
        return JSON.stringify(data);
    }

    /*
     * Display the statistics of the attempt for the client
     * results: statistics returned from Passcode.calcResult()
     */
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

    /*
     * Remove the statistics from the web page
     */
    clearResults () {
        $("#stat-result").text("N/A");
        $("#stat-accuracy").text("N/A");
    }

    /*
     * Highlight the current stage in the stage list (highlight none if finished)
     * finished: whether all stages have been completed
     */
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

    /*
     * Progress to the next stage and updates button states
     */
    nextStage () {
        ++this.currentStage;
        this.highlightStage(this.isFinished());
        this.clearResults();
        this.stopAudio();
        this.completedStage = false;
        if (this.isFinished()) {
            this.completedStage = true;
            console.log("end of audio data");
            return;
        }

        if (this.canPlayAudio()) {
            document.getElementById("play-audio").toggleAttribute("disabled", false);
        }

        document.getElementById("recording-toggle").setAttribute("class", "unselected");
        console.log("advancing to: " + this.audioData[this.currentStage]["filename"]);
    }

    /*
     * Determines if the current stage is for the user to practice
     * return: Boolean
     */
    isPracticeStage () {
        return this.audioData[this.currentStage]["order"] < 0;
    }

    /*
     * Determine if the client can listen to the audio
     */
    canPlayAudio () {
        return this.sessionNum < 2;
    }

    /*
     * Determines if the all stages have been completed
     * return: Boolean
     */
    isFinished () {
        return this.currentStage >= this.audioData.length;
    }

    /*
     * Stops any currently playing audio and resets it to the beginning
     * It is not necessary to go to the beginning since the file is reloaded every time the "#play-audio" button is pressed
     */
    stopAudio () {
        document.getElementById("audio").pause();
    }

    /*
     * Register client actions
     */
    registerClientActions () {
        let caller = this;

        // "Play" button is clicked
        $("#play-audio").click(function () {
            document.getElementById("audio").setAttribute("src", "audio/mp3/" + caller.audioData[caller.currentStage]["filename"]);
            console.log("playing: " + caller.audioData[caller.currentStage]["filename"]);
            document.getElementById("audio").play();
        });

        // "Next" button is clicked
        $("#next-audio").click(function () {
            caller.nextStage();
            document.getElementById("next-audio").toggleAttribute("disabled", true);
            document.getElementById("next-audio").classList.remove("highlighted-button");
        });

        // recording start/stop area is clicked
        $("#recording-toggle").click(function () {
            // if the stage is completed, ignore further clicks until the next stage
            if (caller.completedStage) {
                return;
            }

            let clickElement = document.getElementById("recording-toggle");

            // the button is unselected (the user is trying to start recording)
            if (clickElement.getAttribute("class") === "unselected") {
                clickElement.setAttribute("class", "selected");
                document.getElementById("play-audio").toggleAttribute("disabled", true);
                document.getElementById("next-audio").toggleAttribute("disabled", true);
                caller.stopAudio();
                $("#recording-status").text("Recording Active");
                caller.beginRecording();
            }
            // the button is selected (the user is trying to stop recording)
            else if (clickElement.getAttribute("class") === "selected") {
                if (!caller.isPracticeStage()) {
                    caller.completedStage = true;
                }
                if (caller.isPracticeStage()) {
                    document.getElementById("play-audio").toggleAttribute("disabled", false);
                    clickElement.setAttribute("class", "unselected");
                }
                else {
                    clickElement.setAttribute("class", "unselectable");
                }
                $("#recording-status").text("Not Recording");
                caller.finishRecording();
                document.getElementById("next-audio").toggleAttribute("disabled", false);
                document.getElementById("next-audio").classList.add("highlighted-button");
            }
            // if not in one of the conditionals, the session is done
        });

        // copy all current logs to the client's clipboard
        $("#log-copy").click(function () {
            navigator.clipboard.writeText(document.getElementById("log-textarea").value);
            alert("Logs copied to clipboard");
        });

        // send all current logs to the server (if the server restarts or there is a poor connection, the client can manually send logs)
        $("#log-send").click(function () {
            if (confirm("Are you sure you want to send all current logs to the server?")) {
                caller.sendAllLogs();
            }
        });

        // listen for keypresses (specifically on the spacebar)
        $(document).on("keypress", function (e) {
            if (e.which === 32 && document.getElementById("recording-toggle").getAttribute("class") === "selected") {
                console.log("space bar pressed");
                caller.recording.addTime(Date.now());
            }
        });
    }

    /*
     * Register server actions
     */
    registerServerActions () {
        let caller = this;

        // receive data from JSON files (happens when the server connects to a client)
        this.socket.on("audioData", function (data) {
            console.log("client received 'audioData' from server");
            caller.audioData = data["audio"];
            if (!caller.receivedData) {
                caller.pageSetup();
                caller.requestInformation();
            }
            caller.receivedData = true;
        });
    }

    /*
     * Initial setup
     */
    init () {
        let socket = io.connect();
        this.socket = socket;
        this.registerClientActions();
        this.registerServerActions();
    }
}

/*
 * Driver code
 */
$(document).ready(function () {
    let app = new App();
    app.init();
});