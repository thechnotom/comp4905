/* 
 * Thomas Roller
 * COMP 4905 (Winter 2022)
 *
 * Stores rhythm information and performs calculations
 * Based on a previous personal project
 */

class Passcode {

    /*
     * Sets up variables
     * baseIntervals: intervals of the expected rhythm
     * intervalSuccessTolerance: percentage of intervals groups that need to match
     * ratioEquivalenceTolerance: how close two ratios need to be to be considered equivalent
     * ratioSuccessTolerance: percentage of individual ratios that need to match
     */
    constructor (baseIntervals=[], intervalSuccessTolerance=0.25, ratioEquivalenceTolerance=0.25, ratioSuccessTolerance=0.25) {
        this.intervalSuccessTolerance = intervalSuccessTolerance;
        this.ratioEquivalenceTolerance = ratioEquivalenceTolerance;
        this.ratioSuccessTolerance = ratioSuccessTolerance;

        this.attemptTimes = [];
        this.attemptIntervals = [];
        this.baseIntervals = baseIntervals;

        this.finished = false;
        this.stats = this.createStatisticsStorage();
    }

    /*
     * Adds a time to the rhythm
     * time: time (in milliseconds, normally time from the Unix epoch)
     */
    addTime (time) {
        if (!this.finished) {
            this.attemptTimes.push(time);
        }
    }

    /*
     * Converts a list of times to the intervals between entires
     */
    convertToIntervals () {
        if (this.attemptTimes.length < 2) {
            return;
        }
        for (let i = 1; i < this.attemptTimes.length; ++i) {
            this.attemptIntervals.push(this.attemptTimes[i] - this.attemptTimes[i - 1])
        }
    }

    /*
     * Calculates the ratios between a single interval and all other intervals (including itself)
     * focusInterval: one interval from "intervals"
     * intervals: list of intervals
     * return: list of ratios
     */
    static singleIntervalRatios (focusInterval, intervals) {
        let ratios = [];
        for (let i = 0; i < intervals.length; ++i) {
            ratios.push(focusInterval / intervals[i]);
        }
        return ratios;
    }

    /*
     * Calculates the ratio list for each note in a given interval
     * intervals: list of intervals
     * return: list of list of ratios
     */
    static allIntervalRatios (intervals) {
        let ratios = [];
        for (let i = 0; i < intervals.length; ++i) {
            ratios.push(Passcode.singleIntervalRatios(intervals[i], intervals));
        }
        return ratios;
    }

    /*
     * Determine if a single interval's ratios (from the base) match a single interval's ratios (from the attempt)
     * baseRatios: list of ratios for one interval from the base
     * attemptRatios: list of ratios for one interval from the attempt
     * DEBUG: whether to show debug messages
     * return: whether the ratio lists match
     */
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

        this.stats["ratios"]["possible"].push(baseRatios.length);
        this.stats["ratios"]["required"].push(requiredSuccesses);
        this.stats["ratios"]["received"].push(successes);

        return successes >= requiredSuccesses;
    }

    /*
     * Whether two values are within a given tolerance
     * v1: first value
     * v2: second value
     * tolerance: tolerance (0 <= tolerance <= 1)
     * return: Boolean
     */
    static withinTolerance (v1, v2, tolerance) {
        return (
            (v1 * (1 - tolerance) <= v2 && v1 * (1 + tolerance) >= v2) ||
            (v2 * (1 - tolerance) <= v1 && v2 * (1 + tolerance) >= v1)
        );
    }

    /*
     * Determine if the base and attempt match
     * DEBUG: whether to show debug messages
     * return: Boolean
     */
    isMatch (DEBUG=false) {

        if (DEBUG) {
            console.log("base intervals:    " + this.baseIntervals);
            console.log("attempt intervals: " + this.attemptIntervals);
        }

        if (this.baseIntervals.length === 0) {
            console.log("Base pattern not configured");
            return false;
        }

        this.stats["lengths"]["base"] = this.baseIntervals.length;
        this.stats["lengths"]["attempt"] = this.attemptIntervals.length;
        this.stats["rawIntervals"]["base"] = this.baseIntervals;
        this.stats["rawIntervals"]["attempt"] = this.attemptIntervals;

        if (this.baseIntervals.length !== this.attemptIntervals.length) {
            console.log("Patterns are not of equal length");
            this.stats["matches"] = false;
            this.stats["equalLength"] = false;
            return false;
        }
        this.stats["equalLength"] = true;

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

        let matches = successes >= requiredSuccesses

        this.stats["matches"] = matches;
        this.stats["intervals"]["possible"] = this.baseIntervals.length;
        this.stats["intervals"]["required"] = requiredSuccesses;
        this.stats["intervals"]["received"] = successes;
        
        return matches;
    }

    /*
     * Create structure for statistics storage
     * return: nearly empty statistics storage
     */
    createStatisticsStorage () {
        return {
            "matches" : null,
            "equalLength" : null,
            "rawIntervals" : {
                "base" : [],
                "attempt" : []
            },
            "lengths" : {
                "base" : -1,
                "attempt" : -1,
            },
            "tolerances" : {
                "intervalSuccess" : this.intervalSuccessTolerance,
                "ratioSuccess" : this.ratioSuccessTolerance,
                "ratioEquivalence" : this.ratioEquivalenceTolerance
            },
            "ratios" : {
                "possible" : [],
                "required" : [],
                "received" : []
            },
            "intervals" : {
                "possible" : -1,
                "required" : -1,
                "received" : -1
            }
        }
    }

    /*
     * Perform match check and calculate statistics
     * return: partly/completely filled statistics storage
     */
    calcResult () {
        this.finished = true;
        this.convertToIntervals();
        this.isMatch(true);
        return this.stats;
    }

}