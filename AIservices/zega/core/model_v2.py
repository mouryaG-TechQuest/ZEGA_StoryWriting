"""
ZEGA Model v2.0 - Agentic AI with Fine-Tuning
Integrates: Agent, Ensemble, Fine-Tuning, Advanced RAG
"""
import os
import asyncio
import json
import time
from pathlib import Path
from typing import List, Dict, Any, Optional
from .memory import ZegaMemory
from .ensemble import EnsembleController
from .agent import ZegaAgent
from .finetuning import FineTuningManager
from .auto_trainer import AutoTrainer

class ZegaModelV2:
    """
    ZEGA v2.0: Agentic AI with Multi-Model Ensemble and Fine-Tuning
    
    Features:
    - Autonomous agent with planning and reflection
    - Ensemble of ALL models (Gemini, Groq, HF, Ollama)
    - User-specific LoRA adapters
    - Advanced RAG with reranking
    - Continual learning with fine-tuning
    """
    
    def __init__(self, memory: ZegaMemory, checkpoint_dir: str = "zega_checkpoints"):
        self.memory = memory
        self.checkpoint_dir = Path(checkpoint_dir)
        self.checkpoint_dir.mkdir(exist_ok=True)
        
        # Initialize components
        self.ensemble = EnsembleController()
        self.finetuning = FineTuningManager()
        self.auto_trainer = AutoTrainer(self.ensemble, self.memory, self.finetuning)
        
        # Training metrics
        self.training_metrics = {
            "total_predictions": 0,
            "total_learns": 0,
            "user_feedback_scores": [],
            "model_version": "2.0.0-agentic"
        }
        self._load_checkpoint()
        
        print("[ZEGA v2] 🚀 Initialized Agentic AI System")
        print(f"[ZEGA v2] 🎓 Available models: {len(self.ensemble.teachers)}")
    
    def _load_checkpoint(self):
        """Load training metrics from checkpoint"""
        checkpoint_file = self.checkpoint_dir / "training_metrics.json"
        if checkpoint_file.exists():
            try:
                with open(checkpoint_file, 'r') as f:
                    self.training_metrics = json.load(f)
                print(f"[ZEGA v2] 📊 Loaded: {self.training_metrics['total_predictions']} predictions")
            except Exception as e:
                print(f"[ZEGA v2] ⚠️ Checkpoint load failed: {e}")
    
    def _save_checkpoint(self):
        """Save training metrics to checkpoint"""
        checkpoint_file = self.checkpoint_dir / "training_metrics.json"
        try:
            with open(checkpoint_file, 'w') as f:
                json.dump(self.training_metrics, f, indent=2)
        except Exception as e:
            print(f"[ZEGA v2] ⚠️ Checkpoint save failed: {e}")
    
    async def predict_agentic(
        self, 
        user_id: str, 
        context: str, 
        instruction: str = None, 
        mode: str = "continuation"
    ) -> Dict[str, Any]:
        """
        Agentic prediction: Agent plans, executes, reflects
        
        Returns complete agent execution details
        """
        # Check if user has custom fine-tuned model
        custom_model = f"zega-{user_id}"
        
        # Create agent instance
        agent = ZegaAgent(self.ensemble, self.memory, user_id)
        
        # Define goal
        goal = f"Generate {mode} content based on: {context[:100]}..."
        
        # Run agent
        result = await agent.run(goal, {
            "prompt": context,
            "instruction": instruction,
            "mode": mode,
            "user_id": user_id
        })
        
        # Track metrics
        self.training_metrics["total_predictions"] += 1
        if self.training_metrics["total_predictions"] % 10 == 0:
            self._save_checkpoint()
        
        return result
    
    async def predict(
        self, 
        user_id: str, 
        context: str, 
        instruction: str = None, 
        mode: str = "continuation",
        use_agent: bool = False
    ) -> str:
        """
        Standard prediction with ensemble voting
        
        Args:
            user_id: User identifier
            context: Input context
            instruction: Optional instruction
            mode: Generation mode
            use_agent: If True, use agentic workflow
        """
        try:
            # Use agentic mode if requested
            if use_agent:
                result = await self.predict_agentic(user_id, context, instruction, mode)
                return result.get("final_output", "")
            
            # 1. Retrieve Memory (RAG)
            style_examples = self.memory.retrieve_context(user_id, context, n_results=5)
            style_context = "\n---\n".join(style_examples)
            
            # Get user's LoRA adapter for style hints
            adapter = self.finetuning.get_or_create_adapter(user_id)
            style_hints = adapter.get_style_prompt()
            
            if style_hints:
                style_context += f"\n\nStyle Preferences: {style_hints}"
            
            # Track prediction
            self.training_metrics["total_predictions"] += 1
            
            # 2. Build Prompts
            system_prompt = self._build_system_prompt(mode, style_context)
            user_prompt = self._build_user_prompt(context, instruction, mode)
            
            # 3. Generate with Ensemble Voting
            result = await self.ensemble.generate_with_voting(
                prompt=user_prompt,
                instruction=instruction,
                style_context=style_context,
                mode=mode
            )
            
            # Save checkpoint periodically
            if self.training_metrics["total_predictions"] % 10 == 0:
                self._save_checkpoint()
            
            return result
            
        except Exception as e:
            print(f"[ZEGA v2] ❌ Prediction error: {e}")
            return f"Error generating content: {str(e)}"
    
    def learn(
        self, 
        user_id: str, 
        text: str, 
        feedback_score: float = 1.0,
        context: Dict[str, Any] = None
    ):
        """
        Enhanced learning with fine-tuning data collection
        
        Args:
            user_id: User identifier
            text: Generated text that was accepted
            feedback_score: Quality score (0-10)
            context: Additional context (genre, prompt, etc.)
        """
        try:
            # 1. Store in RAG memory (original behavior)
            if feedback_score > 0.5:
                self.memory.add_experience(
                    user_id=user_id,
                    text=text,
                    metadata={
                        "timestamp": str(time.time()),
                        "score": feedback_score,
                        "model_version": self.training_metrics["model_version"],
                        **(context or {})
                    }
                )
                
                # 2. Collect for fine-tuning
                if context and "prompt" in context:
                    self.finetuning.collect_training_example(
                        user_id=user_id,
                        input_text=context["prompt"],
                        output_text=text,
                        quality_score=feedback_score,
                        metadata=context
                    )
                
                # 3. Track metrics
                self.training_metrics["total_learns"] += 1
                self.training_metrics["user_feedback_scores"].append(feedback_score)
                
                # Keep only last 1000 scores
                if len(self.training_metrics["user_feedback_scores"]) > 1000:
                    self.training_metrics["user_feedback_scores"] = \
                        self.training_metrics["user_feedback_scores"][-1000:]
                
                # 4. Check if ready for fine-tuning
                if self.finetuning.should_trigger_fine_tuning(user_id, threshold=50):
                    print(f"[ZEGA v2] 🎯 {user_id} ready for fine-tuning!")
                    # Note: Fine-tuning triggered manually or in background task
                
                self._save_checkpoint()
                print(f"[ZEGA v2] 📚 Learned from {user_id}, score: {feedback_score}")
                
        except Exception as e:
            print(f"[ZEGA v2] ❌ Learning error: {e}")
    
    async def trigger_user_fine_tuning(self, user_id: str) -> bool:
        """Manually trigger fine-tuning for a user"""
        return await self.finetuning.trigger_fine_tuning(user_id)
    
    def get_user_training_stats(self, user_id: str) -> Dict[str, Any]:
        """Get training statistics for user"""
        return self.finetuning.get_user_stats(user_id)
    
    async def auto_train(
        self,
        user_id: str,
        num_examples: int = 50,
        genres: List[str] = None,
        store_in_memory: bool = False,
        save_to_database: bool = False,
        progress_callback = None
    ) -> Dict[str, Any]:
        """
        Automatically generate training data with ensemble voting
        
        The system:
        - Uses all 7 teacher models (Gemini, Groq, HuggingFace, Ollama)
        - Performs ensemble voting to find best outputs
        - Stores best model parameters for fine-tuning
        - Tracks model performance across genres
        - Optionally saves high-quality stories to database
        
        Args:
            user_id: User identifier
            num_examples: Number of examples (1-1000)
            genres: List of specific genres (all 25 genres available) or None for random
            store_in_memory: Whether to also store in RAG memory
            save_to_database: Whether to save high-quality stories to database
            progress_callback: Optional progress callback
            
        Returns:
            Training results summary with model performance metrics
        """
        return await self.auto_trainer.batch_generate_training_data(
            user_id=user_id,
            num_examples=num_examples,
            genres=genres,
            store_in_memory=store_in_memory,
            save_to_database=save_to_database,
            progress_callback=progress_callback
        )
    
    async def auto_train_with_progress(
        self,
        user_id: str,
        num_examples: int = 50,
        genres: List[str] = None,
        store_in_memory: bool = False,
        save_to_database: bool = False,
        progress_callback = None
    ) -> Dict[str, Any]:
        """
        Alias for auto_train with progress callback support for streaming.
        This method is specifically designed for SSE streaming endpoints.
        """
        return await self.auto_train(
            user_id=user_id,
            num_examples=num_examples,
            genres=genres,
            store_in_memory=store_in_memory,
            save_to_database=save_to_database,
            progress_callback=progress_callback
        )
    
    def get_available_training_genres(self) -> List[str]:
        """Get list of available genres for auto-training"""
        return self.auto_trainer.get_available_genres()
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get system metrics"""
        avg_score = (
            sum(self.training_metrics["user_feedback_scores"]) / 
            len(self.training_metrics["user_feedback_scores"])
            if self.training_metrics["user_feedback_scores"] else 0
        )
        
        return {
            **self.training_metrics,
            "average_feedback_score": round(avg_score, 2),
            "active_models": self.ensemble.get_available_models(),
            "total_models": len(self.ensemble.teachers)
        }
    
    def _build_system_prompt(self, mode: str, style_context: str) -> str:
        """Build system prompt based on mode"""
        base = "You are ZEGA, a personalized AI story writer."
        
        if style_context:
            base += f"\n\nUser's writing style:\n{style_context[:800]}"
        
        mode_prompts = {
            "continuation": base + "\n\nContinue the text in the user's exact style.",
            "scene": base + "\n\nWrite engaging, descriptive scenes.",
            "character": base + "\n\nCreate detailed, realistic characters.",
            "scene_structured": base + "\n\nReturn JSON with scene details.",
            "genre_selection": base + "\n\nSelect appropriate genres.",
            "title_ideas": base + "\n\nGenerate creative titles.",
            "description_autocomplete": base + "\n\nComplete the description naturally."
        }
        
        return mode_prompts.get(mode, base)
    
    def _build_user_prompt(
        self, 
        context: str, 
        instruction: str, 
        mode: str
    ) -> str:
        """Build user prompt based on mode"""
        if mode == "continuation":
            return f"Current Text:\n{context}\n\nContinue:"
        elif instruction:
            return f"Context:\n{context}\n\nInstruction: {instruction}\n\nGenerate:"
        else:
            return context
