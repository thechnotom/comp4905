# Thomas Roller
# Carleton University (Honours Project, COMP 4905)
# Winter 2022

import matplotlib.pyplot as plt
import pandas as pd
from Utilities import Utilities
import os
from Statistics import Statistics
import numpy as np

# Graph generation (and the necessary parsing)
class Graph:

    def __init__ (self):
        pass

    # Graph inclination vs accuracy (takes data from Statistics.merge_accuracy_v_inclination)
    # data: a dictionary containing the data from the input file
    # return: N/A
    @staticmethod
    def accuracy_by_inclination (data, session):
        rhythms = Utilities.Data.rhythms[2:]
        all_averages = []
        for rhythm in rhythms:
            averages = [rhythm]
            for i in range(1, 6):
                averages.append(data[session][rhythm][i])
            all_averages.append(averages)

        data_frame = pd.DataFrame(all_averages, columns=["Rhythm"].append(rhythms), index=rhythms)

        ax = data_frame.plot.bar(stacked=False, title=f"Accuracy vs Musical Inclination (Session {session})")
        ax.set(xlabel="Rhythm", ylabel="Accuracy")
        ax.legend(title="Inclination", loc="upper right", bbox_to_anchor=(1.11, 1))
        ax.grid(axis="y")
        Graph.__save_plot(f"accuracy_vs_musical_inclination_s{session}", 0.25)

    # Graph questionnaire responses (takes data from Statistics.questionnaire_count)
    # data: a dictionary containing the data from the input file
    # title: title of the graph
    # x_label: label for the x-axis
    # return: N/A
    @staticmethod
    def questionnaire_count (data, title, x_label):
        graph_data = []
        labels = []
        for i in range(1, 6):
            labels.append(i)
            if (i not in data):
                graph_data.append(0)
            else:
                graph_data.append(data[i])

        data_frame = pd.DataFrame(graph_data, columns=[x_label].append(labels), index=labels)

        ax = data_frame.plot.bar(title=title)
        ax.set(xlabel=x_label + " (Response)", ylabel="Count")
        ax.grid(axis="y")
        ax.legend().remove()
        Graph.__save_plot(title.lower().replace(" ", "_"))

    # Graph rhythm vs attempt count (takes data from Statistics.attempts_count)
    # data: a dictionary containing the data from the input file
    # return: N/A
    @staticmethod
    def attempts_count (data):
        data_frame = pd.DataFrame.from_dict(data, orient="columns")

        ax = data_frame.plot.bar(title=f"Number of Tries by Rhythm")
        ax.set(xlabel="Rhythm", ylabel="Count")
        ax.grid(axis="y")
        ax.legend(title="Session")
        Graph.__save_plot("number_of_tries_by_rhythm.png", 0.25)

    # Graph rhythm vs accuracy (takes data from Statistics.attempts_count)
    # data: a dictionary containing the data from the input file
    # return: N/A
    @staticmethod
    def accuracy_by_rhythm (data):
        data_frame = pd.DataFrame.from_dict(data, orient="columns")

        ax = data_frame.plot.bar(title=f"Accuracy by Rhythm")
        ax.set(xlabel="Rhythm", ylabel="Average Accuracy")
        ax.grid(axis="y")
        ax.legend(title="Session")
        Graph.__save_plot("accuracy_by_rhythm.png", 0.25)

    # Graph musical inclination against ease of use (takes data from Parser.import_json)
    # data: a dictionary containing the data from the input file
    # return: N/A
    @staticmethod
    def inclination_vs_ease (data):
        x_data = []
        y_data = []
        for user in data:
            q_data = Statistics.get_user_questionnaire(data, user)
            x_data.append(q_data[0])  # inclination
            y_data.append(q_data[1])  # inclination
        x_data = np.array(x_data)
        y_data = np.array(y_data)
        plt.scatter(x_data, y_data)
        correlation = Statistics.get_correlation(x_data, y_data)
        plt.plot(x_data, correlation["slope"] * x_data + correlation["intercept"])
        plt.legend([f"Correlation: {round(correlation['correlation'], 2)}"])
        plt.title("Musical Inclination vs. Ease of Use")
        plt.xlabel("Musical Inclination")
        plt.ylabel("Ease of Use")
        plt.grid(axis="both")
        plt.xticks(Utilities.Data.questionnaire_responses)
        plt.yticks(Utilities.Data.questionnaire_responses)
        Graph.__save_plot("inclination_vs_ease.png", 0.15)

    # Save a graph
    # filename: name of the destination file
    # bottomExpansion: the amount of space to add to the bottom of the graph
    # return: N/A
    @staticmethod
    def __save_plot (filename, bottomExpansion=0):
        if (not os.path.isdir("graphs")):
            os.mkdir("graphs")
        if (bottomExpansion > 0):  # should not be necessary (but causes issues if not checked)
            plt.subplots_adjust(bottom=bottomExpansion)
        plt.savefig("graphs/" + filename)
        plt.subplots_adjust(bottom=0)
        plt.clf()