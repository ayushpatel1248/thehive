import json
import os

PLAYBOOKS_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "playbooks.json")

def get_playbook(alert_title: str) -> list:
    """
    Match alert title to correct playbook and return steps.
    Returns an empty list if no playbook is found.
    """
    try:
        with open(PLAYBOOKS_FILE, "r") as f:
            playbooks = json.load(f)
        
        # Return matched playbook steps based on the alert title
        return playbooks.get(alert_title, [])
    except FileNotFoundError:
        return []
