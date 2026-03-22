from fastapi import APIRouter, HTTPException
from typing import Any, Dict

from services.ai_service import (
    explain_alert,
    generate_investigation_steps,
    generate_user_questions
)
from services.playbook_service import get_playbook

router = APIRouter()

@router.post("/analyze-alert")
async def analyze_alert(alert: Dict[str, Any]):
    """
    Process full alert JSON payload to generate AI-backed explanation,
    investigation steps based on playbooks, and user inquiry questions.
    """
    if not alert or "title" not in alert:
        raise HTTPException(
            status_code=400, 
            detail="Invalid alert data. JSON payload must include a 'title' field."
        )
        
    try:
        playbook = get_playbook(alert.get("title"))
        
        explanation = explain_alert(alert)
        investigation_steps = generate_investigation_steps(alert, playbook)
        user_questions = generate_user_questions(alert)
        
        return {
            "explanation": explanation,
            "investigation_steps": investigation_steps,
            "user_questions": user_questions
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
