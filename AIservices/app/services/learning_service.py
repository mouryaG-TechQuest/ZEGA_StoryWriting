import chromadb
from chromadb.config import Settings
import os
from typing import List, Dict
import uuid

# Initialize ChromaDB (Persistent)
# This acts as our "Long Term Memory" and "Training Data"
CHROMA_DB_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "chroma_db")
os.makedirs(CHROMA_DB_DIR, exist_ok=True)

client = chromadb.PersistentClient(path=CHROMA_DB_DIR)

# Collections
# 1. writing_style: Stores pairs of (Context -> Final Text) to learn user's style
# 2. story_facts: Stores facts about the story/characters extracted from scenes
style_collection = client.get_or_create_collection(name="writing_style")
facts_collection = client.get_or_create_collection(name="story_facts")

def learn_from_interaction(context_str: str, final_text: str, rating: int = 5):
    """
    Saves a user interaction to the vector DB.
    This is the 'Self-Learning' mechanism.
    """
    # Only learn from high-quality interactions (where user kept the text or rated high)
    if rating < 3:
        return

    style_collection.add(
        documents=[final_text],
        metadatas=[{"rating": rating, "type": "scene_completion"}],
        ids=[str(uuid.uuid4())]
    )
    
    # Also store the context as a separate entry to match against future contexts
    # In a real fine-tuning setup, we'd save (Prompt, Completion) pairs.
    # Here, we use RAG: "Given this context, the user wrote X".
    # So we index the CONTEXT, and retrieve the TEXT.
    style_collection.add(
        documents=[context_str],
        metadatas=[{"target_text": final_text, "type": "context_mapping"}],
        ids=[str(uuid.uuid4())]
    )

def get_relevant_examples(query_context: str, n_results: int = 3) -> str:
    """
    Retrieves similar past writing examples to use as 'Few-Shot' examples in the prompt.
    This makes the AI mimic the user's style.
    """
    try:
        results = style_collection.query(
            query_texts=[query_context],
            n_results=n_results,
            where={"type": "context_mapping"} # We want to find similar contexts
        )
        
        examples = ""
        if results['documents'] and len(results['documents'][0]) > 0:
            examples = "Here are examples of the user's writing style in similar contexts:\n"
            for i, doc in enumerate(results['documents'][0]):
                # The 'document' here is the context. The 'metadata' has the target text.
                # Wait, Chroma query returns metadata in a separate list.
                metadata = results['metadatas'][0][i]
                target_text = metadata.get('target_text', '')
                if target_text:
                    examples += f"Example {i+1}:\nContext: {doc}\nResult: {target_text}\n\n"
            
        return examples
    except Exception as e:
        print(f"Error retrieving examples: {e}")
        return ""

def save_story_fact(fact: str, tags: str):
    """
    Saves a fact about the story (e.g., "John hates pizza") for consistency checking.
    """
    facts_collection.add(
        documents=[fact],
        metadatas=[{"tags": tags}],
        ids=[str(uuid.uuid4())]
    )
