import os
import asyncio
import json
import time
from pathlib import Path
from typing import List, Dict, Any, Optional
import google.generativeai as genai
from .memory import ZegaMemory

class ZegaModel:
    def __init__(self, memory: ZegaMemory, checkpoint_dir: str = "zega_checkpoints"):
        self.memory = memory
        self.teachers = []
        self.checkpoint_dir = Path(checkpoint_dir)
        self.checkpoint_dir.mkdir(exist_ok=True)
        self.training_metrics = {
            "total_predictions": 0,
            "total_learns": 0,
            "user_feedback_scores": [],
            "model_version": "1.0.0"
        }
        self._load_checkpoint()
        self._init_teachers()

    def _load_checkpoint(self):
        """Load training metrics from checkpoint."""
        checkpoint_file = self.checkpoint_dir / "training_metrics.json"
        if checkpoint_file.exists():
            try:
                with open(checkpoint_file, 'r') as f:
                    self.training_metrics = json.load(f)
                print(f"[INFO] Loaded checkpoint: {self.training_metrics['total_predictions']} predictions, {self.training_metrics['total_learns']} learns")
            except Exception as e:
                print(f"[WARN] Failed to load checkpoint: {e}")
    
    def _save_checkpoint(self):
        """Save training metrics to checkpoint."""
        checkpoint_file = self.checkpoint_dir / "training_metrics.json"
        try:
            with open(checkpoint_file, 'w') as f:
                json.dump(self.training_metrics, f, indent=2)
        except Exception as e:
            print(f"[WARN] Failed to save checkpoint: {e}")

    def _init_teachers(self):
        """Initialize available teacher models based on env vars."""
        # Configure Google Gemini (Primary/Judge)
        api_key = os.getenv("GOOGLE_API_KEY")
        if api_key:
            genai.configure(api_key=api_key)
            self.teachers.append({
                "name": "gemini-2.0-flash",
                "model": genai.GenerativeModel('gemini-2.0-flash'),
                "role": "primary"
            })
        else:
            print("[WARN] GOOGLE_API_KEY not found. AI will not function.")

    async def _generate_candidate(self, teacher: Dict, system_prompt: str, user_prompt: str) -> Dict[str, str]:
        """Generates a response from a single teacher."""
        try:
            full_prompt = f"{system_prompt}\n\n{user_prompt}"
            response = await asyncio.to_thread(
                teacher["model"].generate_content,
                full_prompt
            )
            content = response.text if hasattr(response, 'text') else str(response)
            return {"model": teacher["name"], "content": content}
        except Exception as e:
            print(f"Error from {teacher['name']}: {e}")
            return {"model": teacher["name"], "content": None, "error": str(e)}

    async def predict(self, user_id: str, context: str, instruction: str = None, mode: str = "continuation") -> str:
        """
        Predicts text using an Ensemble of Teachers + RAG Style Injection.
        """
        system_prompt = ""
        user_prompt = ""
        try:
            # 1. Retrieve Memory (RAG as Style Adapter)
            style_examples = self.memory.retrieve_context(user_id, context, n_results=3)
            style_context = "\n---\n".join(style_examples)
            
            # Track prediction
            self.training_metrics["total_predictions"] += 1

            # 2. Construct Prompts
            if mode == "continuation":
                system_prompt = (
                    "You are ZEGA, a personalized writing assistant. "
                    "Your goal is to continue the user's text exactly in their style. "
                    "Use the provided examples to understand the user's voice, tone, and pacing. "
                    "Do not repeat the input. Just continue it."
                )
                user_prompt = (
                    f"Style Examples (Learn from these):\n{style_context}\n\n"
                    f"Current Text:\n{context}\n\n"
                    "Continue:"
                )
            elif mode == "scene":
                system_prompt = (
                    "You are ZEGA, a personalized story architect. "
                    "Write a full scene based on the instruction, matching the user's established style."
                )
                user_prompt = (
                    f"Style Examples:\n{style_context}\n\n"
                    f"Context/Summary:\n{context}\n\n"
                    f"Instruction: {instruction}\n\n"
                    "Generate Scene:"
                )
            elif mode == "scene_structured":
                system_prompt = (
                    "You are ZEGA, a personalized story architect. "
                    "Write a full scene based on the instruction and the provided story context (previous scenes, characters). "
                    "You MUST return the result in valid JSON format with the following keys: "
                    "'title' (string), 'content' (string), 'new_characters' (list of objects), and 'existing_characters_used' (list of strings). "
                    "For 'new_characters', each object must have: 'name', 'role', 'description', 'popularity' (1-10). "
                    "For 'existing_characters_used', list the names of any existing characters that appear in this scene. "
                    "If you introduce a new character, you MUST generate a full profile for them, including a name (invent a fitting name if none is provided). "
                    "If no new characters are introduced, 'new_characters' should be an empty list. "
                    "Do not include any markdown formatting (like ```json) in the response, just the raw JSON string."
                )
                user_prompt = (
                    f"Style Examples:\n{style_context}\n\n"
                    f"Context/Summary:\n{context}\n\n"
                    f"Instruction: {instruction}\n\n"
                    "Generate Scene (JSON):"
                )
            elif mode == "genre_selection":
                system_prompt = (
                    "You are ZEGA, an expert literary agent and genre specialist. "
                    "Analyze the provided story title, description, scenes, and characters. "
                    "Select the most appropriate genres from the user's available list (if provided in instruction) or suggest standard genres. "
                    "You MUST return the result as a valid JSON list of strings, e.g., [\"Fantasy\", \"Adventure\"]. "
                    "Do not include any markdown formatting."
                )
                user_prompt = (
                    f"Story Context:\n{context}\n\n"
                    f"Instruction: {instruction}\n\n"
                    "Select Genres (JSON List):"
                )
            elif mode == "title_ideas":
                system_prompt = (
                    "You are ZEGA, a creative writing coach. "
                    "Generate a list of 5 creative, catchy, and relevant titles for the story based on the provided context. "
                    "You MUST return the result as a valid JSON list of strings, e.g., [\"The Last Star\", \"Beyond the Void\", ...]. "
                    "Do not include any markdown formatting."
                )
                user_prompt = (
                    f"Story Context:\n{context}\n\n"
                    f"Instruction: {instruction}\n\n"
                    "Generate Titles (JSON List):"
                )
            elif mode == "description_autocomplete":
                system_prompt = (
                    "You are ZEGA, a collaborative writing partner. "
                    "Your goal is to suggest the next few sentences or a short paragraph to complete the current thought in the story description. "
                    "Use the story title, characters, and any existing scenes as context. "
                    "Do not repeat the input text. Just provide the continuation."
                )
                user_prompt = (
                    f"Story Context:\n{context}\n\n"
                    "Continue the description:"
                )
            else:
                # Default fallback for unknown modes
                system_prompt = "You are a helpful writing assistant."
                user_prompt = f"Context:\n{context}\n\nInstruction: {instruction}"

            # 3. Generate Candidates in Parallel
            if not self.teachers:
                print("[ERROR] No AI models configured. Check GOOGLE_API_KEY.")
                return "AI service is not configured correctly. Please check API keys."

            # Use explicit loop to avoid potential closure/scoping issues with list comprehension
            tasks = []
            for t in self.teachers:
                tasks.append(self._generate_candidate(t, system_prompt, user_prompt))
            
            results = await asyncio.gather(*tasks)
            
            valid_results = [r for r in results if r.get("content")]
            
            if not valid_results:
                print("[WARN] No models generated valid responses")
                # Return the error from the first failed result if available for debugging
                if results and results[0].get("error"):
                     print(f"Last error: {results[0].get('error')}")
                return "I'm having trouble generating content right now. Please try again."

            # 4. Selection / Judging
            # Use first valid result (primary model since we only have one)
            best_result = valid_results[0]["content"]
            
            # Save checkpoint periodically
            if self.training_metrics["total_predictions"] % 10 == 0:
                self._save_checkpoint()
            
            return best_result
        except Exception as e:
            print(f"[ERROR] Prediction error: {e}")
            return f"Error generating content: {str(e)}"

    def learn(self, user_id: str, text: str, feedback_score: float = 1.0):
        """
        Online learning update with persistent storage.
        """
        try:
            if feedback_score > 0.5:  # Only learn from positive examples
                self.memory.add_experience(
                    user_id=user_id, 
                    text=text, 
                    metadata={
                        "timestamp": str(time.time()), 
                        "score": feedback_score,
                        "model_version": self.training_metrics["model_version"]
                    }
                )
                self.training_metrics["total_learns"] += 1
                self.training_metrics["user_feedback_scores"].append(feedback_score)
                
                # Keep only last 1000 feedback scores to avoid memory issues
                if len(self.training_metrics["user_feedback_scores"]) > 1000:
                    self.training_metrics["user_feedback_scores"] = self.training_metrics["user_feedback_scores"][-1000:]
                
                # Save checkpoint after learning
                self._save_checkpoint()
                print(f"[INFO] Learned from user {user_id}, score: {feedback_score}")
        except Exception as e:
            print(f"[ERROR] Learning error: {e}")
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get current training metrics."""
        avg_score = sum(self.training_metrics["user_feedback_scores"]) / len(self.training_metrics["user_feedback_scores"]) if self.training_metrics["user_feedback_scores"] else 0
        return {
            **self.training_metrics,
            "average_feedback_score": round(avg_score, 2),
            "active_teachers": [t["name"] for t in self.teachers]
        }
