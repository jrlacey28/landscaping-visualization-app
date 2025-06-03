#!/usr/bin/env python3
import uvicorn
import os
from backend.main import app

if __name__ == "__main__":
    # Run FastAPI with uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=5000,
        reload=True,
        log_level="info"
    )