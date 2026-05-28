from pydantic import BaseModel
from enum import Enum
from datetime import datetime
from typing import Optional

class LiveClassStatus(str, Enum):
    SCHEDULED = "scheduled"
    LIVE = "live"
    COMPLETED = "completed"

class LiveClassCreate(BaseModel):
    course_id: str
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    meeting_url: str

class LiveClassResponse(LiveClassCreate):
    id: str
    status: LiveClassStatus
    created_by: str