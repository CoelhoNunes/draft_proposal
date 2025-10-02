from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime

class Run(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    # one-to-many: ChecklistItem, Artifact
    items: List['ChecklistItem'] = Relationship(back_populates='run')
    artifacts: List['Artifact'] = Relationship(back_populates='run')

class ChecklistItem(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    run_id: int = Field(foreign_key='run.id')
    requirement_id: str
    section: str
    text: str
    must: bool = True
    due: Optional[str] = None
    artifact_type: Optional[str] = None
    status: str = "todo"  # todo, in_progress, done
    assignee: Optional[str] = None

    run: Optional[Run] = Relationship(back_populates='items')

class Artifact(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    run_id: int = Field(foreign_key='run.id')
    type: str  # original, normalized_text, draft_html, pdf
    path: str
    hash: Optional[str] = None
    run: Optional[Run] = Relationship(back_populates='artifacts')
