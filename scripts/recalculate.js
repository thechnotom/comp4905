/*
 * Thomas Roller
 * COMP 4905 (Winter 2022)
 */

import {Passcode} from "../public/js/passcode.js";
import fs from "fs";

/*
 * Tools to recalculate successes and accuracy using more advanced methods
 */
class Recalculate {

    constructor () {
        // do nothing
    }

    /*
     * Import data as a JSON
     * filename: input file name
     * return: object created from file data
     */
    static importJSON (filename) {
        return JSON.parse(fs.readFileSync(filename, "utf8"));
    }

    /*
     * Export data as a JSON
     * filename: output file name
     * data: object being exported
     */
    static exportJSON (filename, data) {
        fs.writeFileSync(filename, JSON.stringify(data, null, 4));
    }

    /*
     * Create Passcode object
     * baseIntervals: intervals of the expected rhythm
     * intervalSuccessTolerance: percentage of intervals groups that need to match
     * ratioEquivalenceTolerance: how close two ratios need to be to be considered equivalent
     * ratioSuccessTolerance: percentage of individual ratios that need to match
     * return: new Passcode object
     */
    static createPasscode (baseIntervals, intervalSuccessTolerance=0.25, ratioEquivalenceTolerance=0.30, ratioSuccessTolerance=0.25) {
        let passcode = new Passcode(baseIntervals, intervalSuccessTolerance, ratioEquivalenceTolerance, ratioSuccessTolerance);
        return passcode;
    }

    /*
     * Calculate results from an attempt
     * This can be expensive if the attempt and base are not of equal length
     * attemptData: a single attempt's data
     * return: object containing an updated attempt (with some new information)
     */
    static expandedCalculation (attemptData) {
        let attempt = attemptData["rawIntervals"]["attempt"];
        let base = attemptData["rawIntervals"]["base"];

        // if one or both of the interval lists are empty, no calculation can be done
        if (base.length == 0 || attempt.length == 0) {
            return null;
        }

        let attempts = [];
        let bases = [];

        let lengthDiff = Math.abs(attempt.length - base.length);

        // if attempt is longer (or they are equal)
        if (attempt.length >= base.length) {
            bases.push(base);
            for (let i = 0; i <= lengthDiff; ++i) {
                attempts.push(attempt.slice(i, base.length + i));
            }
        }
        // if base is longer
        else {
            attempts.push(attempt);
            for (let i = 0; i <= lengthDiff; ++i) {
                bases.push(base.slice(i, attempt.length + i));
            }
        }

        let maxAccuracy = 0;
        let bestStats = {};
        // preform calculations for each combination of attempt and base
        for (const b of bases) {
            let passcode = this.createPasscode(b);
            for (const a of attempts) {
                passcode.setAttemptIntervals(a);
                passcode.isMatch();
                // do not need to consider difference factor since it will be the same for all
                let accuracy = this.calculateAccuracy_noMax(passcode.getStats());
                if (accuracy > maxAccuracy) {
                    maxAccuracy = accuracy;
                    bestStats = passcode.getStats();
                }
            }
        }

        if (lengthDiff != 0) {
            bestStats["equalLength"] = false;
            bestStats["rawIntervals"]["originalBase"] = base;
            bestStats["rawIntervals"]["originalAttempt"] = attempt;
            bestStats["lengths"]["originalBase"] = base.length;
            bestStats["lengths"]["originalAttempt"] = attempt.length;
        }

        return {
            "accuracy" : maxAccuracy * this.calculateAccuracy_max(attemptData),
            "modified" : lengthDiff != 0,
            "stats" : bestStats
        };
    }

    /*
     * Calculate accuracy without considering the difference the base and attempt lengths
     * attemptData: a single attempt's data
     * return: accuracy of attempt (without considering base/attempt lengths)
     */
    static calculateAccuracy_noMax (attemptData) {
        let possible = attemptData["ratios"]["possible"];
        let received = attemptData["ratios"]["received"];
        let accuracy = 0
        for (let i = 0; i < possible.length; ++i) {
            accuracy += (received[i] / possible[i]) / possible.length;
        }
        return accuracy;
    }

    /*
     * Calculate maximum accuracy based on attempt length (compared with base length)
     * attemptData: a single attempt's data
     * return: the maximum accuracy (determined by comparing the lengths of the base and attempt)
     */
    static calculateAccuracy_max (attemptData) {
        let baseLen = attemptData["lengths"]["base"];
        let attemptLen = attemptData["lengths"]["attempt"];
        return Math.max(1 - (Math.abs(baseLen - attemptLen) / baseLen), 0);
    }

    /*
     * Update user data with improved flexibility
     * data: all user data (as returned by anonymize.py), edited in-place
     * return: updated data (technically unneeded as data is edited in-palce, exists for consistency)
     */
    static updateData (data) {
        for (const user of Object.keys(data)) {
            for (const session of Object.keys(data[user]["sessions"])) {
                for (const attempt of Object.keys(data[user]["sessions"][session])) {
                    let results = Recalculate.expandedCalculation(data[user]["sessions"][session][attempt]);
                    if (results !== null) {
                        let extra = data[user]["sessions"][session][attempt]["extra"]
                        data[user]["sessions"][session][attempt] = results["stats"];
                        data[user]["sessions"][session][attempt]["accuracy"] = results["accuracy"];
                        // ensure non-stat data is maintained
                        data[user]["sessions"][session][attempt]["extra"] = extra;
                    }
                    else {
                        data[user]["sessions"][session][attempt]["accuracy"] = 0;
                    }
                }
            }
        }
        return data;
    }

}

// Driver code
if (process.argv.length != 4) {
    console.log("Usage: node recalculate.js <in filename> <out filename>");
    process.exit(1);
}

let data = Recalculate.importJSON(process.argv[2]);
let results = Recalculate.updateData(data);
Recalculate.exportJSON(process.argv[3], results);