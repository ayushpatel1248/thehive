from fastapi import APIRouter, HTTPException
from typing import Any, Dict

from services.virustotal_service import check_url_reputation, check_file_hash, create_summary

router = APIRouter()

@router.post("/threat-intel")
async def threat_intel(alert: Dict[str, Any]):
    """
    Process an alert JSON payload, analyze its observables (URL, Hash) via VirusTotal,
    and return SOC-friendly threat intelligence strings with dynamic risk scoring.
    """
    if not alert:
        raise HTTPException(
            status_code=400, 
            detail="Invalid alert data. JSON payload is required."
        )
        
    observables = alert.get("observables", [])
    
    # Defaults if observabels are missing
    url_analysis = "No threat intelligence data available"
    hash_analysis = "No threat intelligence data available"
    overall_risk = "Low"
    max_malicious = 0
    
    # Iterate through each observable dynamically checking for urls and hashes
    for obs in observables:
        obs_type = obs.get("type", "").lower()
        obs_value = obs.get("value", "")
        
        if not obs_value:
            continue
            
        if obs_type == "url":
            res = check_url_reputation(obs_value)
            url_analysis = create_summary(res)
            max_malicious = max(max_malicious, res.get("malicious", 0))
            
        elif obs_type == "hash":
            res = check_file_hash(obs_value)
            hash_analysis = create_summary(res)
            max_malicious = max(max_malicious, res.get("malicious", 0))
            
    # Compute the generalized risk logic rule
    if max_malicious > 10:
        overall_risk = "High"
    elif max_malicious >= 1:
        overall_risk = "Medium"
    else:
        overall_risk = "Low"
        
    return {
        "url_analysis": url_analysis,
        "hash_analysis": hash_analysis,
        "overall_risk": overall_risk
    }
