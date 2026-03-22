from fastapi import APIRouter, HTTPException
from typing import Any, Dict

from services.ai_service import generate_kql_query

router = APIRouter()

@router.post("/generate-kql")
async def generate_kql(alert: Dict[str, Any]):
    """
    Process full alert JSON payload and return a corresponding Kibana KQL query string.
    """
    if not alert:
        raise HTTPException(
            status_code=400, 
            detail="Invalid alert data. JSON payload is required."
        )
        
    try:
        kql_query = generate_kql_query(alert)
        
        return {
            "kql_query": kql_query
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
