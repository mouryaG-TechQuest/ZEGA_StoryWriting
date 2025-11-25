"""
ZEGA Agentic AI Core
Autonomous agent with multi-model ensemble, planning, and tool use
"""
import asyncio
import json
from typing import List, Dict, Any, Optional
from enum import Enum
from dataclasses import dataclass, field

class AgentState(Enum):
    IDLE = "idle"
    PLANNING = "planning"
    EXECUTING = "executing"
    LEARNING = "learning"
    REFLECTING = "reflecting"

class TaskType(Enum):
    STORY_GENERATION = "story_generation"
    CHARACTER_CREATION = "character_creation"
    SCENE_WRITING = "scene_writing"
    STYLE_ANALYSIS = "style_analysis"
    GENRE_SELECTION = "genre_selection"
    QUALITY_EVALUATION = "quality_evaluation"

@dataclass
class AgentTask:
    """Represents a task in the agent's plan"""
    task_id: str
    task_type: TaskType
    description: str
    dependencies: List[str] = field(default_factory=list)
    status: str = "pending"  # pending, in_progress, completed, failed
    result: Any = None
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class AgentPlan:
    """Multi-step execution plan"""
    plan_id: str
    goal: str
    tasks: List[AgentTask]
    current_task_index: int = 0
    context: Dict[str, Any] = field(default_factory=dict)

class ZegaAgent:
    """
    Autonomous AI Agent with:
    - Multi-step planning
    - Tool use (RAG, ensemble voting, quality check)
    - Self-reflection and learning
    - User-specific adaptation
    """
    
    def __init__(self, ensemble_controller, memory, user_id: str):
        self.ensemble = ensemble_controller
        self.memory = memory
        self.user_id = user_id
        self.state = AgentState.IDLE
        self.current_plan: Optional[AgentPlan] = None
        self.tool_registry = self._init_tools()
        
    def _init_tools(self) -> Dict[str, callable]:
        """Initialize available tools for the agent"""
        return {
            "retrieve_user_style": self._tool_retrieve_style,
            "generate_with_ensemble": self._tool_generate_ensemble,
            "evaluate_quality": self._tool_evaluate_quality,
            "select_best_model": self._tool_select_model,
            "analyze_user_preferences": self._tool_analyze_preferences,
            "store_memory": self._tool_store_memory,
        }
    
    async def plan(self, goal: str, context: Dict[str, Any]) -> AgentPlan:
        """
        Autonomous planning: Agent breaks down goal into tasks
        Uses LLM to generate execution plan
        """
        self.state = AgentState.PLANNING
        
        planning_prompt = f"""You are ZEGA, an autonomous AI agent for story generation.
Your goal: {goal}

Context: {json.dumps(context, indent=2)}

Create a detailed execution plan. Break down the goal into specific tasks.
For each task, specify:
1. Task type (story_generation, character_creation, scene_writing, etc.)
2. Description
3. Dependencies (which tasks must complete first)
4. Which tool to use

Return a JSON plan with this structure:
{{
    "tasks": [
        {{
            "task_id": "task_1",
            "task_type": "retrieve_user_style",
            "description": "Retrieve user's writing style from memory",
            "dependencies": [],
            "tool": "retrieve_user_style"
        }},
        ...
    ]
}}
"""
        
        # Use strongest model (Gemini) for planning
        plan_response = await self.ensemble.generate_with_model(
            prompt=planning_prompt,
            model_name="gemini-2.0-flash",
            mode="planning"
        )
        
        try:
            plan_data = json.loads(plan_response)
            tasks = [
                AgentTask(
                    task_id=t["task_id"],
                    task_type=TaskType(t["task_type"]),
                    description=t["description"],
                    dependencies=t.get("dependencies", []),
                    metadata={"tool": t.get("tool", "generate_with_ensemble")}
                )
                for t in plan_data["tasks"]
            ]
            
            plan = AgentPlan(
                plan_id=f"plan_{asyncio.get_event_loop().time()}",
                goal=goal,
                tasks=tasks,
                context=context
            )
            
            self.current_plan = plan
            print(f"[AGENT] 📋 Created plan with {len(tasks)} tasks")
            return plan
            
        except Exception as e:
            print(f"[AGENT] ⚠️ Planning failed: {e}")
            # Fallback to default plan
            return self._create_default_plan(goal, context)
    
    def _create_default_plan(self, goal: str, context: Dict[str, Any]) -> AgentPlan:
        """Fallback plan if LLM planning fails"""
        tasks = [
            AgentTask("task_1", TaskType.STYLE_ANALYSIS, "Retrieve user style", [], metadata={"tool": "retrieve_user_style"}),
            AgentTask("task_2", TaskType.STORY_GENERATION, "Generate story content", ["task_1"], metadata={"tool": "generate_with_ensemble"}),
            AgentTask("task_3", TaskType.QUALITY_EVALUATION, "Evaluate quality", ["task_2"], metadata={"tool": "evaluate_quality"}),
        ]
        
        return AgentPlan(
            plan_id=f"default_plan_{asyncio.get_event_loop().time()}",
            goal=goal,
            tasks=tasks,
            context=context
        )
    
    async def execute(self, plan: AgentPlan) -> Dict[str, Any]:
        """Execute the plan autonomously"""
        self.state = AgentState.EXECUTING
        results = {}
        
        for task in plan.tasks:
            # Check dependencies
            if not all(dep_id in results for dep_id in task.dependencies):
                task.status = "failed"
                print(f"[AGENT] ❌ Task {task.task_id} failed: dependencies not met")
                continue
            
            task.status = "in_progress"
            print(f"[AGENT] ⚙️ Executing: {task.description}")
            
            try:
                # Execute task using appropriate tool
                tool_name = task.metadata.get("tool", "generate_with_ensemble")
                tool = self.tool_registry.get(tool_name)
                
                if tool:
                    result = await tool(task, plan.context, results)
                    task.result = result
                    task.status = "completed"
                    results[task.task_id] = result
                    print(f"[AGENT] ✅ Completed: {task.task_id}")
                else:
                    raise Exception(f"Tool not found: {tool_name}")
                    
            except Exception as e:
                task.status = "failed"
                print(f"[AGENT] ❌ Task {task.task_id} failed: {e}")
        
        return results
    
    async def reflect(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """Self-reflection: Agent evaluates its own performance"""
        self.state = AgentState.REFLECTING
        
        reflection_prompt = f"""Analyze your performance on the following tasks:

Results: {json.dumps(results, indent=2)}

Provide:
1. What went well
2. What could be improved
3. Which models performed best
4. Suggestions for next time

Return JSON:
{{
    "quality_score": 0-10,
    "strengths": ["..."],
    "weaknesses": ["..."],
    "best_models": ["model1", "model2"],
    "improvements": ["suggestion1", "suggestion2"]
}}
"""
        
        reflection = await self.ensemble.generate_with_model(
            prompt=reflection_prompt,
            model_name="gemini-2.0-flash",
            mode="reflection"
        )
        
        try:
            return json.loads(reflection)
        except:
            return {"quality_score": 7, "note": "Reflection parsing failed"}
    
    # Tool implementations
    async def _tool_retrieve_style(self, task: AgentTask, context: Dict, results: Dict) -> Dict:
        """Tool: Retrieve user's writing style from memory"""
        query = context.get("prompt", "writing style")
        style_examples = self.memory.retrieve_context(self.user_id, query, n_results=5)
        
        return {
            "style_examples": style_examples,
            "user_profile": self.memory.get_user_profile(self.user_id)
        }
    
    async def _tool_generate_ensemble(self, task: AgentTask, context: Dict, results: Dict) -> str:
        """Tool: Generate using ensemble of all models"""
        style_data = results.get("task_1", {})
        style_context = "\n---\n".join(style_data.get("style_examples", []))
        
        prompt = context.get("prompt", "")
        instruction = context.get("instruction", "")
        
        # Use ensemble controller
        return await self.ensemble.generate_with_voting(
            prompt=prompt,
            instruction=instruction,
            style_context=style_context,
            mode=context.get("mode", "scene")
        )
    
    async def _tool_evaluate_quality(self, task: AgentTask, context: Dict, results: Dict) -> Dict:
        """Tool: Evaluate quality of generated content"""
        generated_content = results.get("task_2", "")
        
        eval_prompt = f"""Evaluate this generated content:

{generated_content}

Rate on scale 1-10 for:
- Creativity
- Coherence
- Style consistency
- Grammar

Return JSON:
{{
    "creativity": 0-10,
    "coherence": 0-10,
    "style_consistency": 0-10,
    "grammar": 0-10,
    "overall": 0-10,
    "feedback": "..."
}}
"""
        
        evaluation = await self.ensemble.generate_with_model(
            prompt=eval_prompt,
            model_name="gemini-2.0-flash",
            mode="evaluation"
        )
        
        try:
            return json.loads(evaluation)
        except:
            return {"overall": 7, "note": "Could not parse evaluation"}
    
    async def _tool_select_model(self, task: AgentTask, context: Dict, results: Dict) -> str:
        """Tool: Select best model for specific task"""
        task_type = context.get("task_type", "story")
        
        # Model selection logic based on task
        model_map = {
            "creative": "llama3.1:8b-instruct-q4_K_M",
            "structured": "mistral:7b-instruct-v0.3-q4_K_M",
            "fast": "phi3.5:3.8b-mini-instruct-q4_K_M",
            "quality": "gemini-2.0-flash"
        }
        
        return model_map.get(task_type, "llama3.1:8b-instruct-q4_K_M")
    
    async def _tool_analyze_preferences(self, task: AgentTask, context: Dict, results: Dict) -> Dict:
        """Tool: Analyze user preferences from history"""
        profile = self.memory.get_user_profile(self.user_id)
        
        return {
            "total_samples": profile.get("total_samples", 0) if profile else 0,
            "preferred_genres": context.get("genres", []),
            "avg_length": profile.get("avg_sentence_length", 0) if profile else 0
        }
    
    async def _tool_store_memory(self, task: AgentTask, context: Dict, results: Dict) -> bool:
        """Tool: Store result in memory for learning"""
        content = results.get("task_2", "")
        quality = results.get("task_3", {}).get("overall", 7)
        
        if quality >= 6:  # Only store good content
            self.memory.add_experience(
                user_id=self.user_id,
                text=content,
                metadata={
                    "timestamp": str(asyncio.get_event_loop().time()),
                    "quality": quality,
                    "agent_generated": True
                }
            )
            return True
        return False
    
    async def run(self, goal: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Main agent loop: Plan → Execute → Reflect → Learn"""
        try:
            # 1. Planning phase
            plan = await self.plan(goal, context)
            
            # 2. Execution phase
            results = await self.execute(plan)
            
            # 3. Reflection phase
            reflection = await self.reflect(results)
            
            # 4. Learning phase (store successful outcomes)
            self.state = AgentState.LEARNING
            if reflection.get("quality_score", 0) >= 7:
                await self._tool_store_memory(None, context, results)
            
            # Return to idle
            self.state = AgentState.IDLE
            
            return {
                "plan": plan,
                "results": results,
                "reflection": reflection,
                "final_output": results.get("task_2", "")
            }
            
        except Exception as e:
            print(f"[AGENT] 💥 Agent run failed: {e}")
            self.state = AgentState.IDLE
            raise
