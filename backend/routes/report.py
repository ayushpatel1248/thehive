from fastapi import APIRouter, HTTPException
from typing import Any, Dict

from services.ai_service import generate_incident_report

router = APIRouter()

@router.post("/generate-report")
async def generate_report(alert: Dict[str, Any]):
    """
    Process the full alert JSON payload and draft a structured incident report.
    """
    if not alert:
        raise HTTPException(
            status_code=400, 
            detail="Invalid alert data. JSON payload is required."
        )
        
    try:
        report = generate_incident_report(alert)
        
        return {
            "report": report
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
