import json
import os
from fastapi import APIRouter

router = APIRouter()

# Locate the alerts.json file relative to this file
DATA_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "alerts.json")

@router.get("/alerts")
async def get_alerts():
    """Return sample alerts from alerts.json"""
    try:
        with open(DATA_FILE, "r") as f:
            alerts = json.load(f)
        return alerts
    except FileNotFoundError:
        return {"error": "Alerts data file not found"}
