import os
import requests
import base64
from dotenv import load_dotenv

load_dotenv()

VIRUSTOTAL_API_KEY = os.getenv("VIRUSTOTAL_API_KEY")
BASE_URL = "https://www.virustotal.com/api/v3"

def get_headers():
    return {
        "x-apikey": VIRUSTOTAL_API_KEY,
        "accept": "application/json"
    }

def check_url_reputation(url: str) -> dict:
    """Check a URL against the VirusTotal v3 API using base64 encoded URL format."""
    if not VIRUSTOTAL_API_KEY:
        return {"error": "VIRUSTOTAL_API_KEY not configured.", "malicious": 0}
        
    # VT v3 API requires URL safe base64 encoding without '=' padding
    url_id = base64.urlsafe_b64encode(url.encode()).decode().strip("=")
    endpoint = f"{BASE_URL}/urls/{url_id}"
    
    try:
        response = requests.get(endpoint, headers=get_headers())
        if response.status_code == 200:
            data = response.json().get("data", {}).get("attributes", {})
            stats = data.get("last_analysis_stats", {})
            return {
                "malicious": stats.get("malicious", 0),
                "suspicious": stats.get("suspicious", 0),
                "harmless": stats.get("harmless", 0),
                "type": "url"
            }
        else:
            return {"error": f"API Error {response.status_code}: {response.text}", "malicious": 0}
    except Exception as e:
        return {"error": str(e), "malicious": 0}

def check_file_hash(file_hash: str) -> dict:
    """Check a File Hash (MD5, SHA-1, SHA-256) against the VirusTotal v3 API."""
    if not VIRUSTOTAL_API_KEY:
        return {"error": "VIRUSTOTAL_API_KEY not configured.", "malicious": 0}
        
    endpoint = f"{BASE_URL}/files/{file_hash}"
    
    try:
        response = requests.get(endpoint, headers=get_headers())
        if response.status_code == 200:
            data = response.json().get("data", {}).get("attributes", {})
            stats = data.get("last_analysis_stats", {})
            return {
                "malicious": stats.get("malicious", 0),
                "suspicious": stats.get("suspicious", 0),
                "harmless": stats.get("harmless", 0),
                "first_seen": data.get("first_submission_date", "Unknown"),
                "type": "hash"
            }
        else:
            return {"error": f"API Error {response.status_code}: {response.text}", "malicious": 0}
    except Exception as e:
        return {"error": str(e), "malicious": 0}

def create_summary(result: dict) -> str:
    """Convert raw VT API response dictionary into a simple SOC-friendly text summary."""
    if "error" in result:
        return f"Could not analyze observable: {result['error']}"
        
    obs_type = "URL" if result.get("type", "") == "url" else "File Hash"
    malicious = result.get("malicious", 0)
    suspicious = result.get("suspicious", 0)
    
    if malicious > 0:
        return f"{obs_type} flagged by {malicious} security vendors as malicious and {suspicious} as suspicious."
    elif suspicious > 0:
        return f"{obs_type} flagged by {suspicious} security vendors as suspicious."
    else:
        return f"{obs_type} appears to be clean (0 malicious detections)."
