"""
Ensemble Controller: Coordinates ALL teacher models (Groq, HuggingFace, Gemini, Ollama)
Implements voting, quality scoring, and model selection with rate limiting
"""
import asyncio
import os
import random
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
import httpx
from .ollama_teacher import OllamaTeacher
import google.generativeai as genai

@dataclass
class ModelResponse:
    """Response from a single model"""
    model_name: str
    content: str
    provider: str  # ollama, gemini, groq, huggingface
    latency: float
    error: Optional[str] = None

class GroqTeacher:
    """Groq API teacher (Llama, Mixtral via Groq Cloud)"""
    def __init__(self, model_name: str = "llama-3.1-70b-versatile"):
        self.model_name = model_name
        self.api_key = os.getenv("GROQ_API_KEY")
        self.base_url = "https://api.groq.com/openai/v1/chat/completions"
    
    async def generate(self, prompt: str, system: str = None) -> str:
        if not self.api_key:
            raise Exception("GROQ_API_KEY not set")
        
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                self.base_url,
                json={
                    "model": self.model_name,
                    "messages": messages,
                    "temperature": 0.8,
                    "max_tokens": 2048
                },
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                }
            )
            response.raise_for_status()
            result = response.json()
            return result["choices"][0]["message"]["content"]

class HuggingFaceTeacher:
    """HuggingFace Inference API teacher"""
    def __init__(self, model_name: str = "meta-llama/Meta-Llama-3-8B-Instruct"):
        self.model_name = model_name
        self.api_key = os.getenv("HUGGINGFACEHUB_API_TOKEN")
        self.base_url = f"https://api-inference.huggingface.co/models/{model_name}"
    
    async def generate(self, prompt: str, system: str = None) -> str:
        if not self.api_key:
            raise Exception("HUGGINGFACEHUB_API_TOKEN not set")
        
        full_prompt = f"{system}\n\n{prompt}" if system else prompt
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                self.base_url,
                json={
                    "inputs": full_prompt,
                    "parameters": {
                        "max_new_tokens": 2048,
                        "temperature": 0.8,
                        "top_p": 0.9,
                        "return_full_text": False
                    }
                },
                headers={
                    "Authorization": f"Bearer {self.api_key}"
                }
            )
            response.raise_for_status()
            result = response.json()
            
            if isinstance(result, list) and len(result) > 0:
                return result[0].get("generated_text", "")
            return str(result)

class EnsembleController:
    """
    Coordinates all teacher models and implements ensemble strategies:
    - Parallel generation from all models
    - Voting and selection
    - Quality scoring
    - Model routing based on task
    """
    
    def __init__(self):
        self.teachers: List[Dict[str, Any]] = []
        self._init_all_teachers()
    
    def _init_all_teachers(self):
        """Initialize ALL available teachers"""
        print("[ENSEMBLE] 🎓 Initializing teacher models...")
        
        # 1. Google Gemini (always available if API key present)
        if os.getenv("GOOGLE_API_KEY"):
            genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
            self.teachers.append({
                "name": "gemini-2.0-flash",
                "model": genai.GenerativeModel('gemini-2.0-flash'),
                "provider": "gemini",
                "role": "judge",
                "strength": "quality",
                "speed": "medium"
            })
            print("[ENSEMBLE] ✅ Loaded: Gemini 2.0 Flash")
        
        # 2. Groq (Llama 3.1 70B - very fast)
        if os.getenv("GROQ_API_KEY"):
            try:
                groq_models = [
                    {"name": "llama-3.1-70b-versatile", "role": "creative", "speed": "fast"},
                    {"name": "mixtral-8x7b-32768", "role": "reasoning", "speed": "fast"}
                ]
                for model_config in groq_models:
                    self.teachers.append({
                        "name": model_config["name"],
                        "model": GroqTeacher(model_config["name"]),
                        "provider": "groq",
                        "role": model_config["role"],
                        "strength": "speed",
                        "speed": "ultra_fast"
                    })
                    print(f"[ENSEMBLE] ✅ Loaded: Groq {model_config['name']}")
            except Exception as e:
                print(f"[ENSEMBLE] ⚠️ Groq init failed: {e}")
        
        # 3. HuggingFace (Free inference)
        if os.getenv("HUGGINGFACEHUB_API_TOKEN"):
            try:
                hf_models = [
                    {"name": "meta-llama/Meta-Llama-3-8B-Instruct", "role": "creative"},
                    {"name": "mistralai/Mistral-7B-Instruct-v0.3", "role": "structured"}
                ]
                for model_config in hf_models:
                    self.teachers.append({
                        "name": model_config["name"],
                        "model": HuggingFaceTeacher(model_config["name"]),
                        "provider": "huggingface",
                        "role": model_config["role"],
                        "strength": "free",
                        "speed": "slow"
                    })
                    print(f"[ENSEMBLE] ✅ Loaded: HF {model_config['name'].split('/')[-1]}")
            except Exception as e:
                print(f"[ENSEMBLE] ⚠️ HuggingFace init failed: {e}")
        
        # 4. Ollama (Local models)
        self._init_ollama_teachers()
        
        print(f"[ENSEMBLE] 🎓 Total teachers loaded: {len(self.teachers)}")
    
    def _init_ollama_teachers(self):
        """Initialize Ollama local models"""
        ollama_models = [
            {"name": "llama3.1:8b-instruct-q4_K_M", "role": "primary_creative"},
            {"name": "mistral:7b-instruct-v0.3-q4_K_M", "role": "structured"},
            {"name": "phi3.5:3.8b-mini-instruct-q4_K_M", "role": "fast"},
        ]
        
        for model_config in ollama_models:
            try:
                teacher = OllamaTeacher(model_config["name"])
                # Quick availability check
                import httpx
                try:
                    response = httpx.get("http://localhost:11434/api/tags", timeout=2.0)
                    if response.status_code == 200:
                        models = response.json().get("models", [])
                        if any(m.get("name", "").startswith(model_config["name"]) for m in models):
                            self.teachers.append({
                                "name": model_config["name"],
                                "model": teacher,
                                "provider": "ollama",
                                "role": model_config["role"],
                                "strength": "local",
                                "speed": "fast"
                            })
                            print(f"[ENSEMBLE] ✅ Loaded: Ollama {model_config['name']}")
                except:
                    pass
            except:
                pass
    
    async def generate_with_voting(
        self, 
        prompt: str, 
        instruction: str = None,
        style_context: str = "",
        mode: str = "scene",
        min_votes: int = 1  # Reduced from 3 to 1 for better success rate
    ) -> str:
        """
        Generate from models with smart fallback strategy:
        1. Try Ollama first (local, no rate limits)
        2. Then Groq (fast, generous rate limits)
        3. Finally Gemini/HF as backup
        """
        import time
        
        # Build system prompt - SIMPLIFIED for single element training
        system_prompt = self._build_system_prompt(mode, style_context)
        user_prompt = f"{prompt}\n\nInstruction: {instruction}" if instruction else prompt
        
        # Priority order: Local → Fast API → Free API
        priority_groups = [
            [t for t in self.teachers if t["provider"] == "ollama"],  # Local first
            [t for t in self.teachers if t["provider"] == "groq"],    # Fast API second
            [t for t in self.teachers if t["provider"] == "gemini"],  # Google third
            [t for t in self.teachers if t["provider"] == "huggingface"]  # Free last
        ]
        
        valid_responses = []
        
        # Try each priority group with rate limiting
        for group_idx, group in enumerate(priority_groups):
            if not group or valid_responses:  # Skip if group empty or we have responses
                continue
                
            print(f"[ENSEMBLE] 🎯 Trying priority group {group_idx + 1} ({group[0]['provider']})...")
            
            # Try models in group sequentially with delays
            for teacher in group:
                try:
                    response = await self._generate_from_teacher_with_retry(
                        teacher, system_prompt, user_prompt, max_retries=2
                    )
                    
                    if response and response.content and not response.error:
                        valid_responses.append(response)
                        print(f"[ENSEMBLE] ✅ Success from {teacher['name']}")
                        break  # Stop at first success in group
                    
                    # Small delay between attempts in same group
                    await asyncio.sleep(0.5)
                    
                except Exception as e:
                    print(f"[ENSEMBLE] ⚠️ {teacher['name']} failed: {str(e)[:100]}")
                    await asyncio.sleep(1)  # Longer delay after error
            
            # Delay between priority groups
            if not valid_responses and group_idx < len(priority_groups) - 1:
                await asyncio.sleep(2)
        
        print(f"[ENSEMBLE] ✅ Got {len(valid_responses)} valid response(s)")
        
        if not valid_responses:
            raise Exception("No valid responses from any model")
        
        # Voting: Use Gemini as judge
        if len(valid_responses) > 1:
            best_response = await self._vote_best_response(valid_responses, prompt)
            print(f"[ENSEMBLE] 🏆 Winner: {best_response.model_name} ({best_response.provider})")
            return best_response.content
        else:
            return valid_responses[0].content
    
    async def _generate_from_teacher_with_retry(
        self,
        teacher: Dict,
        system_prompt: str,
        user_prompt: str,
        max_retries: int = 2
    ) -> ModelResponse:
        """Generate with exponential backoff retry"""
        for attempt in range(max_retries):
            try:
                return await self._generate_from_teacher(teacher, system_prompt, user_prompt)
            except Exception as e:
                if attempt < max_retries - 1:
                    wait_time = (2 ** attempt) + random.uniform(0, 1)
                    print(f"[ENSEMBLE] 🔄 Retry {attempt + 1}/{max_retries} for {teacher['name']} in {wait_time:.1f}s")
                    await asyncio.sleep(wait_time)
                else:
                    raise e
    
    async def _generate_from_teacher(
        self, 
        teacher: Dict, 
        system_prompt: str, 
        user_prompt: str
    ) -> ModelResponse:
        """Generate from a single teacher"""
        import time
        import random
        start_time = time.time()
        
        try:
            if teacher["provider"] == "gemini":
                full_prompt = f"{system_prompt}\n\n{user_prompt}"
                response = await asyncio.to_thread(
                    teacher["model"].generate_content,
                    full_prompt
                )
                content = response.text if hasattr(response, 'text') else str(response)
            
            elif teacher["provider"] in ["ollama", "groq", "huggingface"]:
                content = await teacher["model"].generate(
                    prompt=user_prompt,
                    system=system_prompt
                )
            
            else:
                raise Exception(f"Unknown provider: {teacher['provider']}")
            
            latency = time.time() - start_time
            
            return ModelResponse(
                model_name=teacher["name"],
                content=content,
                provider=teacher["provider"],
                latency=latency
            )
            
        except Exception as e:
            print(f"[ENSEMBLE] ⚠️ {teacher['name']} failed: {e}")
            return ModelResponse(
                model_name=teacher["name"],
                content="",
                provider=teacher["provider"],
                latency=0,
                error=str(e)
            )
    
    async def _vote_best_response(
        self, 
        responses: List[ModelResponse], 
        original_prompt: str
    ) -> ModelResponse:
        """Use Gemini as judge to select best response"""
        
        # Build voting prompt
        candidates = "\n\n".join([
            f"CANDIDATE {i+1} (from {r.model_name}):\n{r.content[:500]}..."
            for i, r in enumerate(responses)
        ])
        
        judge_prompt = f"""You are a quality judge for story generation.

Original request: {original_prompt}

Evaluate these {len(responses)} candidates and select the best one.

{candidates}

Consider:
- Creativity and originality
- Coherence and flow
- Grammar and style
- Relevance to prompt

Return ONLY the number (1-{len(responses)}) of the best candidate.
"""
        
        # Use Gemini as judge
        gemini_teacher = next((t for t in self.teachers if t["provider"] == "gemini"), None)
        
        if gemini_teacher:
            try:
                response = await asyncio.to_thread(
                    gemini_teacher["model"].generate_content,
                    judge_prompt
                )
                vote = response.text.strip()
                
                # Extract number
                import re
                match = re.search(r'\d+', vote)
                if match:
                    selected_idx = int(match.group()) - 1
                    if 0 <= selected_idx < len(responses):
                        return responses[selected_idx]
            except Exception as e:
                print(f"[ENSEMBLE] ⚠️ Voting failed: {e}")
        
        # Fallback: prefer local models (Ollama/Groq) over API
        for r in responses:
            if r.provider in ["ollama", "groq"]:
                return r
        
        return responses[0]
    
    async def generate_with_model(
        self, 
        prompt: str, 
        model_name: str, 
        mode: str = "scene"
    ) -> str:
        """Generate using a specific model"""
        teacher = next((t for t in self.teachers if t["name"] == model_name), None)
        
        if not teacher:
            raise Exception(f"Model not found: {model_name}")
        
        system_prompt = self._build_system_prompt(mode, "")
        response = await self._generate_from_teacher(teacher, system_prompt, prompt)
        
        if response.error:
            raise Exception(response.error)
        
        return response.content
    
    def _build_system_prompt(self, mode: str, style_context: str) -> str:
        """Build system prompt based on mode"""
        base = "You are ZEGA, an expert story writer."
        
        if style_context:
            base += f"\n\nUser's writing style examples:\n{style_context[:500]}"
        
        mode_prompts = {
            "scene": base + "\n\nWrite engaging, descriptive scenes.",
            "character": base + "\n\nCreate detailed, realistic characters.",
            "planning": base + "\n\nYou are a planning expert. Break down tasks logically.",
            "evaluation": base + "\n\nYou are a quality evaluator. Be objective and detailed.",
            "reflection": base + "\n\nYou are a self-improvement analyst."
        }
        
        return mode_prompts.get(mode, base)
    
    def get_available_models(self) -> List[Dict[str, Any]]:
        """Get list of all available models"""
        return [
            {
                "name": t["name"],
                "provider": t["provider"],
                "role": t["role"],
                "strength": t["strength"]
            }
            for t in self.teachers
        ]
