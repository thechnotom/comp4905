# Thomas Roller
# Carleton University (Honours Project, COMP 4905)
# Winter 2022

from Parser import Parser
from Statistics import Statistics
from Graph import Graph
import json

# Driver code

# Import data
data = Parser.import_json("Study Data (Updated).json")

# Print some statistics to the terminal
print(f"Number of participants: {Statistics.user_count(data)}")
time_diff_data = Statistics.get_session_time_differences_hours(data)
print("Session Time Separation")
print(f"| Time differences: {time_diff_data['times']}")
print(f"| Mean: {time_diff_data['mean']}")
print(f"| Std Dev: {time_diff_data['std_dev']}")
print(f"| Min: {time_diff_data['min']}")
print(f"| Max: {time_diff_data['max']}")
print(f"| Range: {time_diff_data['range']}")

# Data preparating and graphs

# Graph accuracy by musical inclination and received
accuracy_by_inclination = Statistics.get_accuracy_by_inclination(data)
merged_accuracy_by_inclination = Statistics.merge_accuracy_by_inclination(accuracy_by_inclination)
Graph.accuracy_by_inclination(merged_accuracy_by_inclination, "0")
Graph.accuracy_by_inclination(merged_accuracy_by_inclination, "1")

# Graph questionnaire responses
Graph.questionnaire_count(Statistics.questionnaire_count(data, 0), "Count of Musical Inclination", "Inclination")
Graph.questionnaire_count(Statistics.questionnaire_count(data, 1), "Ease of Use", "Level of Ease")
Graph.questionnaire_count(Statistics.questionnaire_count(data, 2), "Interest in Real-World Applications", "Interest")
Graph.questionnaire_count(Statistics.questionnaire_count(data, 3), "Perceived Practicality", "Practicality")

# Graph the number of attempts each rhythm received
Graph.attempts_count(Statistics.attempts_count(data))

# Graph the accuracy of each rhythm
Graph.accuracy_by_rhythm(Statistics.accuracy_by_rhythm(data))