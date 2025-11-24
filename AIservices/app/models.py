from pydantic import BaseModel
from typing import List, Optional

class Character(BaseModel):
    name: str
    role: str
    description: Optional[str] = None

class SceneContext(BaseModel):
    story_title: str
    story_description: str
    current_scene_text: str
    previous_scene_text: Optional[str] = None
    all_previous_scenes_summary: Optional[List[str]] = [] # List of descriptions of all previous scenes
    characters: List[Character]
    cursor_position: Optional[int] = None
    genre: Optional[str] = None

class GenerationResponse(BaseModel):
    content: str
    new_characters_suggested: Optional[List[Character]] = []
    rationale: Optional[str] = None # Why the AI chose this path (for learning/debugging)

class FeedbackRequest(BaseModel):
    context: SceneContext
    generated_content: str
    user_edited_content: str # What the user actually kept
    rating: Optional[int] = 5 # 1-5
