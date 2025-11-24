import os
import json
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from app.models import SceneContext, StoryGenerationRequest, Character
from app.services import learning_service

# Initialize the model
# We'll use Gemini Pro for its good balance of performance and free tier availability
# Ensure GOOGLE_API_KEY is set in environment variables
llm = ChatGoogleGenerativeAI(model="gemini-pro", temperature=0.7)

def get_suggestion(context: SceneContext) -> str:
    """
    Generates a short text suggestion based on the current cursor position and context.
    Uses RAG to find similar writing styles from the user's history.
    """
    # 1. Retrieve "Memory" (User's style)
    context_str = f"{context.story_title} {context.genre} {context.current_scene_text[-200:]}"
    style_examples = learning_service.get_relevant_examples(context_str, n_results=2)

    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a creative writing assistant. Your goal is to suggest the next few words or a sentence to complete the user's thought. "
                   "Match the user's style based on the examples provided. Be concise. Do not repeat what is already written. "
                   "Only provide the continuation, no explanations."),
        ("user", "{style_examples}\n"
                 "Story Title: {title}\n"
                 "Genre: {genre}\n"
                 "Characters in scene: {characters}\n"
                 "Previous Scene Context: {previous_scene}\n"
                 "Current Scene Text: {current_text}\n\n"
                 "Complete the text starting from the end of 'Current Scene Text'.")
    ])

    chain = prompt | llm | StrOutputParser()

    # Format characters string
    chars_str = ", ".join([f"{c.name} ({c.role})" for c in context.characters])

    response = chain.invoke({
        "style_examples": style_examples,
        "title": context.story_title,
        "genre": context.genre or "General",
        "characters": chars_str,
        "previous_scene": context.previous_scene_text or "None",
        "current_text": context.current_scene_text
    })

    return response

def generate_scene(context: SceneContext, instruction: str = None) -> tuple[str, list[Character]]:
    """
    Generates a full scene or continues a scene based on context and instructions.
    Uses ALL previous scene summaries for deep context.
    Detects if new characters are introduced.
    """
    # 1. Retrieve "Memory"
    context_str = f"{context.story_title} {context.genre} {instruction}"
    style_examples = learning_service.get_relevant_examples(context_str, n_results=2)

    # 2. Format Full History (Summarized)
    history_str = ""
    if context.all_previous_scenes_summary:
        history_str = "Previous Scenes Summary:\n"
        for i, summary in enumerate(context.all_previous_scenes_summary):
            history_str += f"Scene {i+1}: {summary}\n"

    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a professional screenwriter and novelist. Write a compelling scene based on the provided context. "
                   "Include dialogue, action, and sensory details. Format it for a story. "
                   "You can introduce new characters if the story needs them, but prefer using existing ones. "
                   "If you introduce a NEW character, list them at the very end of your response in a JSON block like: "
                   "```json\n[{\"name\": \"Name\", \"role\": \"Role\", \"description\": \"Desc\"}]\n```"),
        ("user", "{style_examples}\n"
                 "Story Title: {title}\n"
                 "Genre: {genre}\n"
                 "Existing Characters: {characters}\n"
                 "Story Description: {story_desc}\n"
                 "{history_str}\n"
                 "Immediate Previous Scene: {previous_scene}\n"
                 "Current Draft: {current_text}\n"
                 "Instruction: {instruction}\n\n"
                 "Write the scene:")
    ])

    chain = prompt | llm | StrOutputParser()

    chars_str = ", ".join([f"{c.name} ({c.role}): {c.description}" for c in context.characters])

    response_text = chain.invoke({
        "style_examples": style_examples,
        "title": context.story_title,
        "genre": context.genre or "General",
        "characters": chars_str,
        "story_desc": context.story_description,
        "history_str": history_str,
        "previous_scene": context.previous_scene_text or "None",
        "current_text": context.current_scene_text,
        "instruction": instruction or "Continue the scene naturally."
    })

    # Parse response for new characters
    content = response_text
    new_characters = []
    
    if "```json" in response_text:
        try:
            parts = response_text.split("```json")
            content = parts[0].strip()
            json_str = parts[1].split("```")[0].strip()
            char_data = json.loads(json_str)
            for c in char_data:
                new_characters.append(Character(name=c['name'], role=c['role'], description=c.get('description', '')))
        except:
            pass # Fallback if JSON parsing fails

    return content, new_characters

def generate_story_outline(request: StoryGenerationRequest) -> str:
    """
    Generates a story outline with characters and scene breakdown.
    """
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a master storyteller. Create a detailed story outline based on the user's idea."),
        ("user", "Title: {title}\n"
                 "Genre: {genre}\n"
                 "Premise: {description}\n"
                 "Number of Scenes: {num_scenes}\n\n"
                 "Generate a response in JSON format with the following structure:\n"
                 "{{\n"
                 "  \"characters\": [ {{ \"name\": \"...\", \"role\": \"...\", \"description\": \"...\" }} ],\n"
                 "  \"scenes\": [ {{ \"event\": \"Scene Title\", \"description\": \"Detailed plot of the scene\", \"characters\": [\"char1\", \"char2\"] }} ]\n"
                 "}}")
    ])
    
    # We might want to use a JSON output parser here for strict structure, 
    # but for now string is fine, we can parse it in the controller or frontend.
    chain = prompt | llm | StrOutputParser()

    response = chain.invoke({
        "title": request.title,
        "genre": request.genre,
        "description": request.description,
        "num_scenes": request.num_scenes
    })

    return response
