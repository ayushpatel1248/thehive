from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes import alerts, ai, kql, report, threat_intel

app = FastAPI(title="SOC AI Copilot Backend", version="1.0.0")

# Enable CORS for frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(alerts.router, tags=["Alerts"])
app.include_router(ai.router, tags=["AI Analysis"])
app.include_router(kql.router, tags=["KQL"])
app.include_router(report.router, tags=["Reports"])
app.include_router(threat_intel.router, tags=["Threat Intel"])

@app.get("/")
async def root():
    return {"message": "Welcome to SOC AI Copilot API"}
