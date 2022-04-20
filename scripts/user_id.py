# Thomas Roller
# Carleton University (Honours Project, COMP 4905)
# Winter 2022

# Create a list of user IDs (with no duplicates)

import random
import json

user_ids = { "user_ids" : [] }
for i in range(0, 20):
    new_id = -1
    while (new_id in user_ids["user_ids"] or new_id == -1):
        new_id = random.randint(10000, 99999)
    user_ids["user_ids"].append({ new_id : f"P{i}" })

result = json.dumps(user_ids, indent=4)
print(result)