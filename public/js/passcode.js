class Passcode {

    constructor (baseIntervals=[], intervalSuccessTolerance=0.25, ratioEquivalenceTolerance=0.25, ratioSuccessTolerance=0.25) {
        this.intervalSuccessTolerance = intervalSuccessTolerance;
        this.ratioEquivalenceTolerance = ratioEquivalenceTolerance;
        this.ratioSuccessTolerance = ratioSuccessTolerance;

        this.attemptTimes = [];
        this.attemptIntervals = [];
        this.baseIntervals = baseIntervals;
    }

    addTime (time) {
        this.attemptTimes.push(time);
    }

    reset () {
        this.attemptTimes = [];
        this.attemptIntervals = [];
    }

    convertToIntervals () {
        if (this.attemptTimes.length < 2) {
            return;
        }
        for (let i = 1; i < this.attemptTimes.length; ++i) {
            this.attemptIntervals.push(this.attemptTimes[i] - this.attemptTimes[i - 1])
        }
    }

    static singleIntervalRatios (focusInterval, allIntervals) {
        let ratios = [];
        for (let i = 0; i < allIntervals.length; ++i) {
            ratios.push(focusInterval / allIntervals[i]);
        }
        return ratios;
    }

    static allIntervalRatios (allIntervals) {
        let ratios = [];
        for (let i = 0; i < allIntervals.length; ++i) {
            ratios.push(Passcode.singleIntervalRatios(allIntervals[i], allIntervals));
        }
        return ratios;
    }

    singleIntervalMatch (baseRatios, attempRatios, DEBUG=false) {
        if (baseRatios.length !== attempRatios.length) {
            return false;
        }

        // convert ratio success tolerance from a percentage to an integer
        // +1 to account for matching a beat to itself
        let requiredSuccesses = Math.min(
            Math.ceil(baseRatios.length * (1 - this.ratioSuccessTolerance)) + 1,
            baseRatios.length
        );

        let successes = 0;
        for (let i = 0; i < baseRatios.length; ++i) {
            if (Passcode.withinTolerance(baseRatios[i], attempRatios[i], this.ratioEquivalenceTolerance)) {
                ++successes;
            }
        }

        if (DEBUG) {
            console.log("Ratio successes: possible=" + baseRatios.length + ", required=" + requiredSuccesses + ", received=" + successes);
        }

        return successes >= requiredSuccesses;
    }

    static withinTolerance (v1, v2, tolerance) {
        return (
            (v1 * (1 - tolerance) <= v2 && v1 * (1 + tolerance >= v2)) ||
            (v2 * (1 - tolerance) <= v1 && v2 * (1 + tolerance >= v1))
        );
    }

    isMatch (DEBUG=false) {

        if (this.baseIntervals.length === 0) {
            console.log("Base pattern not configured");
            return false;
        }
        if (this.baseIntervals.length !== this.attemptIntervals.length) {
            console.log("Patterns are not of equal length");
            return false;
        }

        // convert interval success tolerance from a percentage to an integer
        let requiredSuccesses = Math.ceil(this.baseIntervals.length * (1 - this.intervalSuccessTolerance));
        if (DEBUG) {
            console.log("Required interval matches: " + requiredSuccesses + " of " + this.baseIntervals.length);
        }

        let baseRatios = Passcode.allIntervalRatios(this.baseIntervals);
        let attemptRatios = Passcode.allIntervalRatios(this.attemptIntervals);

        let successes = 0;
        for (let i = 0; i < baseRatios.length; ++i) {
            if (this.singleIntervalMatch(baseRatios[i], attemptRatios[i], DEBUG=DEBUG)) {
                ++successes;
            }
        }

        if (DEBUG) {
            console.log("Interval successes: required=" + requiredSuccesses + ", received=" + successes);
        }

        return successes >= requiredSuccesses;
    }

    calcResult () {
        this.convertToIntervals();
        return this.isMatch(true);
    }

}

/*
let recorder = new Passcode();
recorder.addTime(107);
recorder.addTime(109);
recorder.addTime(110);
recorder.addTime(115);
recorder.addTime(121);
recorder.convertToIntervals();
console.log(recorder.intervals);
*/