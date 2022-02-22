# Thomas Roller
# COMP 4905 (Winter 2022)
#
# Creates the JSON file necessary for the server
# Requires a single-tracked MIDI file (and the server will need the corresponding MP3 file)
# This must be done manually for each "song" to be used by the server
# The resulting JSON must be placed in puiblic/audio/json

from mido import MidiFile, tick2second
import json
import sys

# Converts MidiFile into intervals (in milliseconds) between the beginnings of note events
# midi_file: MidiFile instance representing a MIDI file
# return: list of intervals (in milliseconds)
def get_midi_intervals (midi_file):
    tempo = 500000  # microseconds per tick (500 milliseconds per tick)

    if (len(midi_file.tracks) != 1):
        print(f"MIDI file must contain exactly 1 track")
        quit()

    track = midi_file.tracks[0]
    print(f"track has {len(track)} messages")

    # get the number of ticks between each note event (both note_on and note_off)
    tick_deltas = [{ "type" : msg.type, "time" : msg.time } for msg in track if "note" in msg.type]
    tick_deltas[0]["time"] = 0
    print(f"track has {len(tick_deltas)} note messages")

    # get the number of ticks between each note_on event
    intervals = []
    delta = 0
    for i in range(0, len(tick_deltas)):
        msg = tick_deltas[i]
        if (msg["type"] == "note_on"):
            if (i != 0):
                intervals.append(delta + msg["time"])
            delta = 0
        else:
            delta += msg["time"]

    print(f"{len(intervals)} intervals calculated")
    print(f"tick intervals: {intervals}")

    # convert MIDI ticks to milliseconds
    intervals = [tick2second(time * 1000, midi_file.ticks_per_beat, tempo) for time in intervals]
    print(f"millisecond intervals: {intervals}")

    return intervals

# Creates a dictionary with the information needed by the application server
# intervals: intervals (in milliseconds)
# stage: the name of the stage as displayed by the web application
# order: determines the order in which different stages will be attempted
# mp3_filename: name of the MP3 file that the intervals correspond to
# return: dictionary
def create_dict (intervals, stage, order, mp3_filename):
    return {
        "intervals_ms" : intervals,
        "stage" : stage,
        "order" : order,
        "mp3" : mp3_filename
    }

# Driver code
def main ():
    if (len(sys.argv) != 4 and len(sys.argv) != 5):
        print("Usage: create_json.py <MIDI path> <stage> <order> [MP3 filename]")
        print("Note: <MP3 filename> is just the file's name (not the path)")
        quit()

    # attempt to convert the "order" argument to an integer
    order = None
    try:
        order = int(sys.argv[3])
    except ValueError:
        print("\"order\" must be an integer")

    # determine if the mp3_filename is provided or if it needs to be generated
    filename_no_extension = sys.argv[1][max(sys.argv[1].rfind("/"), sys.argv[1].rfind("\\")) + 1:sys.argv[1].rfind(".")]
    mp3_filename = None
    if (len(sys.argv) == 4):
        mp3_filename = filename_no_extension + ".mp3"
    else:
        mp3_filename = sys.argv[4]

    # get intervals
    intervals = get_midi_intervals(MidiFile(sys.argv[1], clip=True))

    # create dictionary
    json_data = create_dict(intervals, sys.argv[2], int(order), mp3_filename)

    # convert dictionary to a JSON string
    json_output = json.dumps(json_data)

    # export the JSON string
    with open(filename_no_extension + ".json", "w") as f:
        f.write(json_output)

main()