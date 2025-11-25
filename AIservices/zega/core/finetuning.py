"""
Fine-Tuning Manager for ZEGA
Creates user-specific LoRA adapters using collected data
"""
import json
import os
from pathlib import Path
from typing import List, Dict, Any
from dataclasses import dataclass
import asyncio

@dataclass
class TrainingData:
    """Single training example"""
    input_text: str
    output_text: str
    metadata: Dict[str, Any]

class LoRAAdapter:
    """
    User-specific LoRA (Low-Rank Adaptation) adapter
    Stores lightweight personalization weights
    """
    def __init__(self, user_id: str, adapter_dir: str = "zega_adapters"):
        self.user_id = user_id
        self.adapter_dir = Path(adapter_dir)
        self.adapter_dir.mkdir(exist_ok=True)
        self.user_adapter_path = self.adapter_dir / f"{user_id}_adapter.json"
        
        self.weights = self._load_or_init()
    
    def _load_or_init(self) -> Dict:
        """Load existing adapter or initialize new one"""
        if self.user_adapter_path.exists():
            with open(self.user_adapter_path, 'r') as f:
                return json.load(f)
        
        return {
            "user_id": self.user_id,
            "version": "1.0",
            "training_steps": 0,
            "style_vectors": {},
            "preferences": {},
            "quality_scores": []
        }
    
    def save(self):
        """Persist adapter to disk"""
        with open(self.user_adapter_path, 'w') as f:
            json.dump(self.weights, f, indent=2)
    
    def update_from_feedback(self, text: str, score: float, metadata: Dict):
        """Update adapter based on user feedback"""
        self.weights["training_steps"] += 1
        self.weights["quality_scores"].append(score)
        
        # Keep only last 100 scores
        if len(self.weights["quality_scores"]) > 100:
            self.weights["quality_scores"] = self.weights["quality_scores"][-100:]
        
        # Update preferences
        if "genre" in metadata:
            genre = metadata["genre"]
            self.weights["preferences"][genre] = self.weights["preferences"].get(genre, 0) + 1
        
        self.save()
    
    def get_style_prompt(self) -> str:
        """Generate prompt modifier based on learned style"""
        avg_score = sum(self.weights["quality_scores"]) / len(self.weights["quality_scores"]) if self.weights["quality_scores"] else 7
        
        top_genres = sorted(
            self.weights["preferences"].items(),
            key=lambda x: x[1],
            reverse=True
        )[:3]
        
        style_hints = []
        if top_genres:
            genres_str = ", ".join([g[0] for g in top_genres])
            style_hints.append(f"User prefers: {genres_str}")
        
        if avg_score >= 8:
            style_hints.append("High quality expected")
        
        return " | ".join(style_hints) if style_hints else ""

class FineTuningManager:
    """
    Manages fine-tuning process for Ollama models
    Collects training data and triggers fine-tuning
    """
    
    def __init__(self, data_dir: str = "fine_tune_data"):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(exist_ok=True)
        self.lora_adapters: Dict[str, LoRAAdapter] = {}
    
    def collect_training_example(
        self, 
        user_id: str, 
        input_text: str, 
        output_text: str,
        quality_score: float,
        metadata: Dict[str, Any]
    ):
        """Collect a training example for fine-tuning"""
        user_dir = self.data_dir / user_id
        user_dir.mkdir(exist_ok=True)
        
        # Append to JSONL file (standard format)
        jsonl_file = user_dir / "training_data.jsonl"
        
        example = {
            "input": input_text,
            "output": output_text,
            "metadata": {
                **metadata,
                "quality_score": quality_score,
                "timestamp": str(asyncio.get_event_loop().time())
            }
        }
        
        with open(jsonl_file, 'a', encoding='utf-8') as f:
            f.write(json.dumps(example) + '\n')
        
        # Update LoRA adapter
        adapter = self.get_or_create_adapter(user_id)
        adapter.update_from_feedback(output_text, quality_score, metadata)
        
        print(f"[FINETUNE] 📝 Collected training example for {user_id}")
    
    def get_or_create_adapter(self, user_id: str) -> LoRAAdapter:
        """Get or create LoRA adapter for user"""
        if user_id not in self.lora_adapters:
            self.lora_adapters[user_id] = LoRAAdapter(user_id)
        return self.lora_adapters[user_id]
    
    def get_training_data_count(self, user_id: str) -> int:
        """Get number of training examples for user"""
        jsonl_file = self.data_dir / user_id / "training_data.jsonl"
        if not jsonl_file.exists():
            return 0
        
        with open(jsonl_file, 'r') as f:
            return sum(1 for _ in f)
    
    def export_for_ollama_finetuning(self, user_id: str) -> Path:
        """
        Export training data in Ollama fine-tuning format
        Creates a Modelfile for fine-tuning
        """
        user_dir = self.data_dir / user_id
        jsonl_file = user_dir / "training_data.jsonl"
        
        if not jsonl_file.exists():
            raise Exception(f"No training data for {user_id}")
        
        # Read all training data
        training_examples = []
        with open(jsonl_file, 'r') as f:
            for line in f:
                training_examples.append(json.loads(line))
        
        # Filter high-quality examples (score >= 7)
        quality_examples = [
            ex for ex in training_examples
            if ex["metadata"].get("quality_score", 0) >= 7
        ]
        
        # Create Modelfile for Ollama
        modelfile_path = user_dir / "Modelfile"
        
        with open(modelfile_path, 'w') as f:
            f.write(f"# ZEGA Fine-tuned Model for {user_id}\n")
            f.write(f"FROM llama3.1:8b-instruct-q4_K_M\n\n")
            
            # Add system prompt with user style
            adapter = self.get_or_create_adapter(user_id)
            style_prompt = adapter.get_style_prompt()
            
            f.write(f'SYSTEM """\n')
            f.write(f'You are ZEGA, a personalized AI story writer for this specific user.\n')
            if style_prompt:
                f.write(f'{style_prompt}\n')
            f.write(f'Generate stories matching this user\'s unique style and preferences.\n')
            f.write(f'"""\n\n')
            
            # Add example interactions (few-shot learning)
            f.write(f"# Training Examples ({len(quality_examples)} high-quality samples)\n")
            for i, ex in enumerate(quality_examples[:20]):  # Limit to top 20
                input_text = ex["input"][:200]  # Truncate
                output_text = ex["output"][:500]  # Truncate
                
                f.write(f'\nMESSAGE user """{input_text}"""\n')
                f.write(f'MESSAGE assistant """{output_text}"""\n')
        
        print(f"[FINETUNE] 📦 Exported {len(quality_examples)} examples to {modelfile_path}")
        return modelfile_path
    
    async def trigger_fine_tuning(self, user_id: str, base_model: str = "llama3.1:8b-instruct-q4_K_M"):
        """
        Trigger fine-tuning process for user
        Creates a custom Ollama model
        """
        count = self.get_training_data_count(user_id)
        
        if count < 10:
            print(f"[FINETUNE] ⚠️ Need at least 10 examples, have {count}")
            return False
        
        print(f"[FINETUNE] 🔧 Starting fine-tuning for {user_id} with {count} examples...")
        
        try:
            # Export Modelfile
            modelfile_path = self.export_for_ollama_finetuning(user_id)
            
            # Create custom model using Ollama
            custom_model_name = f"zega-{user_id}"
            
            # Run ollama create command
            import subprocess
            result = subprocess.run(
                ["ollama", "create", custom_model_name, "-f", str(modelfile_path)],
                capture_output=True,
                text=True
            )
            
            if result.returncode == 0:
                print(f"[FINETUNE] ✅ Created custom model: {custom_model_name}")
                print(f"[FINETUNE] 🎯 Use with: ollama run {custom_model_name}")
                return True
            else:
                print(f"[FINETUNE] ❌ Fine-tuning failed: {result.stderr}")
                return False
                
        except Exception as e:
            print(f"[FINETUNE] 💥 Error: {e}")
            return False
    
    def should_trigger_fine_tuning(self, user_id: str, threshold: int = 50) -> bool:
        """Check if we have enough data to trigger fine-tuning"""
        count = self.get_training_data_count(user_id)
        return count >= threshold and count % threshold == 0  # Every 50 examples
    
    def get_user_stats(self, user_id: str) -> Dict[str, Any]:
        """Get training statistics for user"""
        adapter = self.get_or_create_adapter(user_id)
        count = self.get_training_data_count(user_id)
        
        avg_score = sum(adapter.weights["quality_scores"]) / len(adapter.weights["quality_scores"]) if adapter.weights["quality_scores"] else 0
        
        return {
            "user_id": user_id,
            "training_examples": count,
            "training_steps": adapter.weights["training_steps"],
            "avg_quality_score": round(avg_score, 2),
            "top_genres": sorted(
                adapter.weights["preferences"].items(),
                key=lambda x: x[1],
                reverse=True
            )[:5],
            "ready_for_finetuning": count >= 10,
            "next_milestone": 50 if count < 50 else 100
        }
