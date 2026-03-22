import os
import json
import google.generativeai as genai
from dotenv import load_dotenv
import time

load_dotenv()

# Configure Gemini API
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

# Initialize the model using the explicitly supported 'gemini-2.5-flash' endpoint mapped in this specific API key tier
model = genai.GenerativeModel('gemini-2.5-flash')

def generate_ai_response(prompt: str) -> str:
    """Send prompt to Gemini API and return text response safely."""
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Error generating AI response: {str(e)}"

def explain_alert(alert_data: dict) -> str:
    """
    Generate a simple explanation of why the alert triggered.
    Acts like a SOC analyst mentioning suspicious behavior and possible risks.
    """
    alert_json = json.dumps(alert_data, indent=2)
    prompt = f"""Act like a SOC analyst. Explain the following alert in simple terms.
Mention why it is suspicious and possible risks.
CRITICAL: Keep your explanation EXTREMELY BRIEF (maximum 3 short sentences total). Do not write paragraphs.

Alert Data:
{alert_json}
"""
    return generate_ai_response(prompt)

def generate_investigation_steps(alert_data: dict, playbook: list) -> str:
    """
    Generate a step-by-step investigation guide using a SOC playbook style.
    Expands predefined playbook steps using AI intelligence.
    """
    alert_json = json.dumps(alert_data, indent=2)
    playbook_steps_str = "\n".join([f"- {step}" for step in playbook]) if playbook else "No predefined playbook found."
    
    prompt = f"""You are a professional SOC analyst investigating a specific security alert.
Given the following alert data and playbook steps, generate highly detailed, numbered investigation steps.

CRITICAL INSTRUCTIONS:
- Keep the output EXTREMELY BRIEF (maximum 3 to 4 short bullet points). 
- Reference actual values from the alert data.
- Ensure the output is immediately readable and not verbose.

Playbook Steps:
{playbook_steps_str}

Alert Data:
{alert_json}
"""
    return generate_ai_response(prompt)

def generate_kql_query(alert_data: dict) -> str:
    """
    Generate a valid Kibana KQL query to hunt for the alert behavior.
    """
    alert_json = json.dumps(alert_data, indent=2)
    prompt = f"""Generate ONLY a valid Kibana KQL query for the following alert to assist in log analysis.
Do not include any other text, markdown blocks, or explanation, just the raw KQL query string.
Use standard Elastic Common Schema (ECS) fields like:
host.name, process.name, source.ip, destination.ip, url

Alert Data:
{alert_json}
"""
    # Strip markdown code blocks if the AI model mistakenly wraps the response in them.
    response = generate_ai_response(prompt).strip()
    if response.startswith("```"):
        lines = response.split('\n')
        # Remove the top ```kql / ``` line and the bottom ```
        if len(lines) > 2:
            return '\n'.join(lines[1:-1])
    return response

def generate_incident_report(alert_data: dict) -> str:
    """
    Generate a structured incident response report.
    """
    alert_json = json.dumps(alert_data, indent=2)
    prompt = f"""Generate a structured incident response report for the following alert.
CRITICAL INSTRUCTIONS:
- Keep the ENTIRE report EXTREMELY BRIEF (maximum 1 brief sentence per section).
- Do not write lengthy paragraphs. Get straight to the point.

Include specifically the following sections:
- Summary
- Root Cause
- Impact
- Recommended Actions

Alert Data:
{alert_json}
"""
    return generate_ai_response(prompt)

def generate_user_questions(alert_data: dict) -> str:
    """
    Generate a list of questions the SOC analyst can ask the employee involved.
    """
    alert_json = json.dumps(alert_data, indent=2)
    prompt = f"""Generate a list of questions a SOC analyst should ask the employee or user involved in this alert to determine context.
CRITICAL INSTRUCTIONS:
- Keep the email EXTREMELY BRIEF.
- Provide a MAXIMUM of 2 short questions only.
- Do not include extra greetings or fluff.

Alert Data:
{alert_json}
"""
    return generate_ai_response(prompt)
