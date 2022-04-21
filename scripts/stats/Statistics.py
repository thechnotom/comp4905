# Thomas Roller
# Carleton University (Honours Project, COMP 4905)
# Winter 2022

from Utilities import Utilities
import statistics

# Provides tools for statistical analysis
class Statistics:

    def __init__ (self):
        pass

    # Calculate the accuracy of a given attempt
    # attempt: an attempt from the input file
    # return: the accuracy of the attempt
    @staticmethod
    def calc_accuracy (attempt):
        possible = attempt["ratios"]["possible"]
        received = attempt["ratios"]["received"]
        if (len(possible) != len(received)):
            return -1
        accuracy = 0
        for i in range(0, len(possible)):
            accuracy += ((received[i] / possible[i]) * 100) / len(possible)
        return accuracy

    # Get a list of users from the input file
    # data: a dictionary containing the data from the input file
    # return: a list of users
    @staticmethod
    def get_users (data):
        results = []
        for key in data:
            results.append(key)
        return results
    
    # Get a user's questionnaire data
    # data: a dictionary containing the data from the input file
    # user: a user's ID
    # return: a list of questionnaire responses
    @staticmethod
    def get_user_questionnaire (data, user):
        return data[user]["questionnaire"]
    
    # Parses data to compare accuracy with user's musical inclination
    # data: a dictionary containing the data from the input file
    # return: dictionary of accuracy values
    @staticmethod
    def get_accuracy_by_inclination (data):
        result = {}
        for user in data:
            result[user] = {
                "inclination" : data[user]["questionnaire"][0],
                "sessions" : {}
            }
            for session in data[user]["sessions"]:
                result[user]["sessions"][session] = {}
                for attempt in data[user]["sessions"][session]:
                    result[user]["sessions"][session][attempt["extra"]["stage"]] = 0
                    if (attempt["accuracy"] > result[user]["sessions"][session][attempt["extra"]["stage"]]):
                        result[user]["sessions"][session][attempt["extra"]["stage"]] = attempt["accuracy"]

        return result
    
    # Group participants by inclination rating
    # data: a dictionary containing the data from get_accuracy_by_inclination
    # return: dictionary of average accuracies grouped by inclination
    @staticmethod
    def merge_accuracy_by_inclination (data):
        results = {}

        for session in Utilities.Data.sessions:
            results[session] = {}
            for rhythm in Utilities.Data.rhythms:
                results[session][rhythm] = {}
                for inclination in range(1, 6):
                    applicable_users = {x for x in data if data[x]["inclination"] == inclination}
                    results[session][rhythm][inclination] = []
                    for user in applicable_users:
                        if (rhythm in data[user]["sessions"][session]):
                            results[session][rhythm][inclination].append(data[user]["sessions"][session][rhythm])
                        else:
                            results[session][rhythm][inclination].append(0)
                    inclination_accuracies = results[session][rhythm][inclination]
                    if (len(inclination_accuracies) == 0):
                        results[session][rhythm][inclination] = 0
                        continue
                    results[session][rhythm][inclination] = statistics.mean(inclination_accuracies)
        return results

    # Get the count for each response for a question on the questionnaire
    # data: a dictionary containing the data from the input file
    # question: the question to get a count for
    # return: dictionary of counts
    @staticmethod
    def questionnaire_count (data, question):
        results = {}
        for user in data:
            response = data[user]["questionnaire"][question]
            if (response not in results):
                results[response] = 0
            results[response] += 1
        return results

    # Get the number of users
    # data: a dictionary containing the data from the input file
    # return: number of users
    @staticmethod
    def user_count (data):
        return len(data)

    # Number of attempts that have an accuracy > 0 (split by rhythm and session)
    # data: a dictionary containing the data from the input file
    # return: dictionary of counts
    @staticmethod
    def attempts_count (data):
        results = {}
        
        for session in Utilities.Data.sessions:
            results[session] = {}
            for rhythm in Utilities.Data.rhythms:
                results[session][rhythm] = 0
                for user in data:
                    for attempt in data[user]["sessions"][session]:
                        if (attempt["accuracy"] > 0 and attempt["extra"]["stage"] == rhythm):
                            results[session][rhythm] += 1
        return results

    # Get the time between sessions and some associated statistics
    # data: a dictionary containing the data from the input file
    # return: dictionary of statistics
    @staticmethod
    def get_session_time_differences_hours (data):
        times = []
        for user in data:
            times.append(data[user]["timeDiff"] / 60 / 60)
        return {
            "times" : times,
            "mean" : statistics.mean(times),
            "std_dev" : statistics.stdev(times),
            "min" : min(times),
            "max" : max(times),
            "range" : max(times) - min(times)
        }

    # Get the average accuracy for each rhythm (split by session)
    # data: a dictionary containing the data from the input file
    # return: dictionary of accuracies
    @staticmethod
    def accuracy_by_rhythm (data):
        results = {}
        
        for session in Utilities.Data.sessions:
            results[session] = {}
            for rhythm in Utilities.Data.rhythms:
                results[session][rhythm] = []
                for user in data:
                    for attempt in data[user]["sessions"][session]:
                        if (attempt["extra"]["stage"] == rhythm):
                            results[session][rhythm].append(attempt["accuracy"])
                accuracies = results[session][rhythm]
                if (len(accuracies) == 0):
                    results[session][rhythm] = 0
                    continue
                results[session][rhythm] = statistics.mean(accuracies)
        return results

    # Get correnation information from the data
    # x: x-axis data
    # y: y-axis data
    # return: dictionary of information
    @staticmethod
    def get_correlation (x, y):
        line = list(statistics.linear_regression(x, y))
        return {
            "slope" : line[0],
            "intercept" : line[1],
            "correlation" : statistics.correlation(x, y)
        }