# comp4905
Winter 2022 Honours Project (Carleton University)\
Thomas Roller

This repository contains the application used in the project. It served to facilitate a study which tested the effectiveness of a passcode scheme.

<h1>Setup and Execution</h1>

Install the necessary npm modules:\
`npm install`

Run the application's server:\
`node server.js`

The application will be avaliable by visiting `localhost:3000` in a browser.

<h1>Scripts</h1>

Scripts are located in the `scripts` directory and serve a variety of purposes.\
Detailed information on how to use scripts is provided in the project's report (Appendix B).

<h2>Create User IDs</h2>

Run `py user_id.py` to create 20 random user IDs.

<h2>Creating Music Files</h2>

Run `py create_json.py <MIDI path> <stage> <order> [MP3 filename]` to get the necessary information from a MIDI file.\
This script requires the `mido` Python module.

<h2>Anonymization</h2>

Run `py anonymize.py` to change the user IDs in the data and remove identifying information.

<h2>Recalculate/Enhance</h2>

Run `node recalculate.js <in filename> <out filename>` to calculate accuracy values using an improved approach.

<h2>Statistics and Graphs</h2>

Move to the `stats` directory.\
Run `py main.py <filename>` to generate some statistics and graphs (which will be placed into a new folder called `graphs`).\
This program requires several Python modules:
- matplotlib
- pandas
- numpy

This program also requires Python 3.10 or later.
