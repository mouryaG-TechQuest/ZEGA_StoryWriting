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

# Optional: Google Generative AI
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    print("[ENSEMBLE] Gemini not available (google-generativeai not installed)")

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
        
        # Build messages with proper formatting
        messages = []
        if system:
            messages.append({"role": "system", "content": str(system).strip()[:1200]})
        messages.append({"role": "user", "content": str(prompt).strip()[:3000]})
        
        async with httpx.AsyncClient(timeout=20.0) as client:
            try:
                response = await client.post(
                    self.base_url,
                    json={
                        "model": self.model_name,
                        "messages": messages,
                        "temperature": 0.8,
                        "max_tokens": 2000,
                        "top_p": 0.95,
                        "stream": False
                    },
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    }
                )
                
                if response.status_code != 200:
                    error_detail = response.text[:200]
                    raise Exception(f"Groq API error {response.status_code}: {error_detail}")
                
                result = response.json()
                return result["choices"][0]["message"]["content"]
            except httpx.TimeoutException:
                raise Exception(f"Groq timeout for {self.model_name}")
            except Exception as e:
                raise Exception(f"Groq error: {str(e)[:150]}")

class HuggingFaceTeacher:
    """HuggingFace Serverless Inference API teacher - Free tier with rate limits"""
    def __init__(self, model_name: str = "mistralai/Mistral-7B-Instruct-v0.2"):
        self.model_name = model_name
        self.api_key = os.getenv("HUGGINGFACEHUB_API_TOKEN")
        # Using serverless inference API (free but slower)
        self.base_url = f"https://api-inference.huggingface.co/models/{model_name}"
    
    async def generate(self, prompt: str, system: str = None) -> str:
        if not self.api_key:
            raise Exception("HUGGINGFACEHUB_API_TOKEN not set")
        
        # Format prompt based on model type
        if "mistral" in self.model_name.lower():
            # Mistral Instruct format
            if system:
                full_prompt = f"<s>[INST] {system}\n\n{prompt} [/INST]"
            else:
                full_prompt = f"<s>[INST] {prompt} [/INST]"
        elif "flan" in self.model_name.lower():
            # Flan-T5 is simpler - just the task
            full_prompt = prompt
        else:
            # Generic chat format
            full_prompt = f"System: {system or 'You are helpful.'}\n\nUser: {prompt}\n\nAssistant:"
        
        async with httpx.AsyncClient(timeout=60.0) as client:  # Longer timeout for serverless
            try:
                response = await client.post(
                    self.base_url,
                    json={
                        "inputs": full_prompt[:3000],
                        "parameters": {
                            "max_new_tokens": 512,  # Reduced for faster response
                            "temperature": 0.7,
                            "top_p": 0.9,
                            "return_full_text": False,
                            "do_sample": True
                        },
                        "options": {
                            "wait_for_model": True,  # Wait if model is loading (cold start)
                            "use_cache": True
                        }
                    },
                    headers={
                        "Authorization": f"Bearer {self.api_key}"
                    }
                )
                
                if response.status_code == 503:
                    raise Exception("HuggingFace model loading (cold start) - try again")
                elif response.status_code != 200:
                    raise Exception(f"HF API error {response.status_code}: {response.text[:150]}")
                
                result = response.json()
                
                # Handle different response formats
                if isinstance(result, list) and len(result) > 0:
                    return result[0].get("generated_text", "")
                elif isinstance(result, dict) and "generated_text" in result:
                    return result["generated_text"]
                elif isinstance(result, dict) and "error" in result:
                    raise Exception(f"HF error: {result['error']}")
                return str(result)
            except httpx.TimeoutException:
                raise Exception(f"HuggingFace timeout (60s) for {self.model_name}")
            except Exception as e:
                raise Exception(f"HuggingFace error: {str(e)[:150]}")
                return result.get("generated_text", result.get("text", str(result)))
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
        
        # 1. Google Gemini (optional - only if library installed and API key present)
        if GEMINI_AVAILABLE and os.getenv("GOOGLE_API_KEY"):
            try:
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
            except Exception as e:
                print(f"[ENSEMBLE] ⚠️ Gemini init failed: {e}")
        
        # 2. Groq (Fast cloud inference)
        if os.getenv("GROQ_API_KEY"):
            try:
                groq_models = [
                    {"name": "llama-3.3-70b-versatile", "role": "creative", "speed": "fast"},
                    {"name": "mixtral-8x7b-32768-instruct-v0.1", "role": "reasoning", "speed": "fast"},
                    {"name": "llama3-70b-8192", "role": "backup", "speed": "fast"}
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
        
        # 3. HuggingFace (Free serverless inference - slower but unlimited)
        if os.getenv("HUGGINGFACEHUB_API_TOKEN"):
            try:
                hf_models = [
                    {"name": "mistralai/Mistral-7B-Instruct-v0.2", "role": "creative"},
                    {"name": "google/flan-t5-large", "role": "fast_backup"}
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
        
        # Priority order: Speed-optimized with complete fallback chain
        priority_groups = [
            [t for t in self.teachers if t["provider"] == "gemini"],       # 1. Gemini - fastest (1-2s) but quota limited
            [t for t in self.teachers if t["provider"] == "groq"],         # 2. Groq - ultra fast (0.5-1s) generous quota
            [t for t in self.teachers if t["provider"] == "ollama"],       # 3. Ollama - local (2-5s) unlimited but needs install
            [t for t in self.teachers if t["provider"] == "huggingface"]   # 4. HuggingFace - slowest (10-30s) but free fallback
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
                    
                except Exception as e:
                    print(f"[ENSEMBLE] ⚠️ {teacher['name']} failed: {str(e)[:100]}")
                    # No delay - move to next model immediately
            
            # Minimal delay between priority groups
            if not valid_responses and group_idx < len(priority_groups) - 1:
                await asyncio.sleep(0.2)  # Reduced from 2s to 0.2s for faster switching
        
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
        max_retries: int = 1  # Reduced from 2 to 1 for faster fallback
    ) -> ModelResponse:
        """Generate with exponential backoff retry"""
        for attempt in range(max_retries):
            try:
                return await self._generate_from_teacher(teacher, system_prompt, user_prompt)
            except Exception as e:
                if attempt < max_retries - 1:
                    wait_time = 0.5 + random.uniform(0, 0.5)  # Much faster: 0.5-1s instead of 2-3s
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
            "reflection": base + "\n\nYou are a self-improvement analyst.",
            "scene_structured": (
                "You are ZEGA, a personalized story architect. "
                "Write a full scene based on the instruction and the provided story context (previous scenes, characters). "
                "IMPORTANT LENGTH LIMITS: title max 1000 chars, content max 10000 chars, character name max 255 chars, character role max 255 chars, character description max 10000 chars. "
                "You MUST return ONLY valid JSON with these exact keys: "
                "'title' (string: scene title, max 1000 characters), "
                "'content' (string: the scene narrative text, max 10000 characters), "
                "'new_characters' (array of character objects with keys: name (max 255 chars), role (max 255 chars), description (max 10000 chars), popularity (1-10)). Be extremely thorough in listing ALL new characters introduced in the scene, even minor ones. "
                "'existing_characters_used' (array of character name strings). "
                "Example format: {\"title\": \"The Meeting\", \"content\": \"The hero walked...\", \"new_characters\": [{\"name\": \"Alice\", \"role\": \"Mentor\", \"description\": \"Wise sage\", \"popularity\": 7}], \"existing_characters_used\": [\"John\"]}. "
                "Do NOT include any markdown formatting like ```json, explanations, or extra text. "
                "Only return the raw JSON object."
            ),
            "genre_selection": (
                "You are ZEGA, an expert literary agent and genre specialist. "
                "Analyze the provided story context and select the most appropriate genres. "
                "You MUST return ONLY a valid JSON array of strings, e.g., [\"Fantasy\", \"Adventure\"]. "
                "Do NOT include any explanations, markdown formatting, or extra text. "
                "Only return the JSON array."
            ),
            "title_ideas": (
                "You are ZEGA, a creative writing coach. "
                "Generate exactly 5 creative, catchy, and relevant titles based on the story context. "
                "IMPORTANT: Each title must be under 500 characters. "
                "You MUST return ONLY a valid JSON array of strings, e.g., [\"The Last Star\", \"Beyond the Void\", \"Eternal Night\", \"Shadow's Edge\", \"Rising Dawn\"]. "
                "Do NOT include any explanations, markdown formatting, or extra text. "
                "Only return the JSON array."
            ),
            "description_autocomplete": (
                base + "\n\nYou are a collaborative writing partner. "
                "Continue the story description with 2-3 sentences that flow naturally from the existing text. "
                "IMPORTANT: Keep the total description under 65535 characters (TEXT field limit). "
                "Do not repeat the input. Just provide the continuation as plain text."
            )
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
