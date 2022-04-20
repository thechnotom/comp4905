# Thomas Roller
# Carleton University (Honours Project, COMP 4905)
# Winter 2022

import json
import random
import time
import sys

# Import a JSON file as a dictionary
# filename: name of the file
# return: dictionary
def get_json_file (filename):
    result = None
    with open(filename, "r") as f:
        result = json.loads(f.read())
    return result

# Update a set of attempts with a new user ID
# base_path: name of the directory containing the study data
# org_user_id: original ID of the user
# new_user_id: new ID of the user
# dictionary of attempts
def get_updated_attempt_log (base_path, org_user_id, new_user_id):
    data = {"sessions" : {}}
    attempt_times = []
    for session_num in range(0, 2):
        with open(base_path + f"Attempt Logs/{org_user_id}_{session_num + 1}_attempt_log.txt", "r") as f:
            data["sessions"][session_num] = [json.loads(line) for line in f.readlines()]

        # get the times for the first attempt (okay if we grab is multiple times)
        time_string = data["sessions"][session_num][0]["extra"]["time"]
        attempt_times.append(time.mktime(time.strptime(time_string[:time_string.find(" (")], "%a %b %d %Y %H:%M:%S GMT%z")))

        # change the user ID in each attempt and remove the time attribute
        for log in data["sessions"][session_num]:
            log["extra"]["user"] = new_user_id
            del log["extra"]["time"]

    # get the difference (in seconds) between each session's first logged attempt and record it
    data["timeDiff"] = attempt_times[1] - attempt_times[0]

    return data

# Anonymize all data in a given directory
# base_path: name of the directory containing the study data
# return: dictionary containing the unified anonymized data
def get_anonymized_data (base_path):
    # get a list of user IDs
    user_ids = [list(user_association.keys())[0] for user_association in get_json_file(base_path + "user_key.txt")["user_ids"]]

    # get the questionnaire data
    questionnaires = get_json_file(base_path + "Questionnaires/questionnaires.json")

    # generate and shuffle the new IDs
    new_ids = [f"P{x}" for x in range(0, len(user_ids))]
    random.shuffle(new_ids)

    # copy and change the data for each user
    data = {}
    for user_id in user_ids:
        new_id = new_ids.pop()

        # get an updated version of the attempt log (using the new ID)
        data[new_id] = get_updated_attempt_log(base_path, user_id, new_id)

        # record the questionnaire data
        data[new_id]["questionnaire"] = questionnaires[user_id]

    return data

# Shuffle the order of a dictionary
# While there is no explicit order, there is an implicit order to dictionaries in newer Python standards
# data: data to be shuffled
# return: shuffled data
def shuffle_order (data):
    result = {}
    keys = list(data.keys())
    random.shuffle(keys)
    for key in keys:
        result[key] = data[key]
    return result

# Export a string to a file
# filename: name of the destination file
# data: data to be exported
# return: N/A
def export_json (filename, data):
    with open(filename, "w") as f:
        f.write(data)

# Driver code

base_dir = None
if (len(sys.argv) == 2):
    base_dir = sys.argv[1]
    if (base_dir[-1] not in "/\\"):
        base_dir += "/"
else:
    print("Usage: anonymize.py <base directory>")
    sys.exit(1)

# obtain and export the data
print("Getting and anonymizing data...")
data = get_anonymized_data(base_dir)
print("Shuffling user order...")
data = shuffle_order(data)
print("Preparing data...")
json_data = json.dumps(data, indent=4)
print("Exporting data...")
export_json("anonymized_data.json", json_data)
print("Export complete")