from mido import MidiFile, tick2second
import json
import sys

if (len(sys.argv) != 2):
    print("Usage: parse_midi.py <filename>")
    quit()

midiFile = MidiFile(sys.argv[1], clip=True)
tempo = 500000  # microseconds per tick (500 milliseconds per tick)

if (len(midiFile.tracks) != 1):
    print(f"MIDI file must contain exactly 1 track")
    quit()

track = midiFile.tracks[0]
print(f"track has {len(track)} messages")

tick_deltas = [{ "type" : msg.type, "time" : msg.time } for msg in track if "note" in msg.type]
tick_deltas[0]["time"] = 0
print(f"track has {len(tick_deltas)} note messages")

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
intervals = [tick2second(time * 1000, midiFile.ticks_per_beat, tempo) for time in intervals]
print(f"millisecond intervals: {intervals}")

jsonOutput = json.dumps({"intervals_ms" : intervals})

with open("output.json", "w") as f:
    f.write(jsonOutput)