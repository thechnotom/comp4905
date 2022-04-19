# Thomas Roller
# Carleton University (Honours Project, COMP 4905)
# Winter 2022

import json

# Provides tools for importing and parsing data
class Parser:

    def __init__ (self):
        pass

    # Import JSON file and parse its contents
    # filename: name of the file being imported
    # return: dictionary containing the contents of the imported file
    def import_json (filename):
        data = None
        with open(filename, "r") as f:
            data = json.loads(f.read())
        return data