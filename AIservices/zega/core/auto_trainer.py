"""
Auto-Trainer Module
Automatically generates training data for user-specific models
"""
import asyncio
import random
import json
import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime

class AutoTrainer:
    """
    Generates synthetic training data to quickly train user models
    """
    
    # Training prompts by genre - ALL 25 DATABASE GENRES
    TRAINING_PROMPTS = {
        "fantasy": [
            "A young wizard discovers an ancient spellbook in the forbidden library",
            "A knight embarks on a quest to slay the last dragon of the realm",
            "An elf princess must unite the warring kingdoms before darkness falls",
            "A magical artifact is stolen from the sacred temple by shadow thieves",
            "A prophecy foretells the coming of a chosen one who will restore balance",
            "Dark magic begins to corrupt the enchanted forest and its creatures",
            "A portal opens to a realm of eternal darkness and ancient evils",
            "The last dragon awakens from centuries of slumber beneath the mountain",
            "A cursed prince seeks to break his transformation before the solstice",
            "Ancient ruins hold the key to saving the realm from destruction"
        ],
        "science fiction": [
            "First contact with an alien civilization changes humanity forever",
            "A colony ship reaches a mysterious planet with impossible life forms",
            "AI systems begin showing signs of consciousness and emotion",
            "Time travel paradoxes threaten to unravel the fabric of reality",
            "Humans merge with advanced technology to survive a hostile galaxy",
            "A quantum computer predicts the future with terrifying accuracy",
            "Explorers discover an ancient alien artifact that defies physics",
            "Virtual reality becomes indistinguishable from the real world",
            "Genetic engineering creates new species that challenge humanity",
            "Interstellar war threatens multiple worlds and civilizations"
        ],
        "mystery": [
            "A detective investigates a locked-room murder with no suspects",
            "Ancient symbols lead to a hidden treasure beneath the city",
            "A series of disappearances puzzle authorities in the small town",
            "A coded message reveals a conspiracy at the highest levels",
            "The town's dark secrets begin to surface after decades of silence",
            "An unsolved case from decades ago reopens with new evidence",
            "Strange occurrences plague the old mansion on the hill",
            "A journalist uncovers a web of corruption and lies",
            "Cryptic clues point to an unexpected culprit no one suspected",
            "The truth behind the legend must be uncovered before it's too late"
        ],
        "horror": [
            "Something moves in the shadows of the basement at midnight",
            "The old house on the hill claims another victim this Halloween",
            "Strange whispers echo through empty corridors in the asylum",
            "A cursed object brings misfortune to all who possess it",
            "The forest harbors something ancient and hungry for human souls",
            "Nightmares begin to bleed into waking life with deadly consequences",
            "A serial killer leaves cryptic messages written in blood",
            "The mirror reflects something that isn't there watching you",
            "Townspeople vanish during the blood moon without a trace",
            "An entity feeds on fear and despair growing stronger each night"
        ],
        "romance": [
            "Two rivals must work together on a project that brings them closer",
            "A chance encounter at the coffee shop changes everything forever",
            "Old flames reunite after years apart at their high school reunion",
            "A forbidden love defies social boundaries and family expectations",
            "Letters from the past reveal hidden feelings that never faded",
            "A fake relationship becomes surprisingly real and complicated",
            "Destiny brings two souls together repeatedly across time",
            "Love blooms in the most unexpected place during a storm",
            "A second chance at happiness arrives when least expected",
            "Two hearts find healing through each other's understanding"
        ],
        "adventure": [
            "Explorers search for a legendary lost city in the Amazon",
            "A map leads to an uncharted island filled with ancient secrets",
            "Treasure hunters race against time and rival expeditions",
            "A survival journey through hostile wilderness tests their limits",
            "Ancient ruins hide deadly traps protecting priceless artifacts",
            "A rescue mission into enemy territory requires impossible courage",
            "Discovering a new world through a mysterious portal in the desert",
            "A quest to recover stolen artifacts from dangerous thieves",
            "Crossing dangerous lands to reach sanctuary before winter comes",
            "Uncovering secrets of a fallen civilization beneath the ocean"
        ],
        "thriller": [
            "A witness goes into hiding from assassins hunting them relentlessly",
            "Government conspiracies threaten exposure by a determined journalist",
            "A race against time to prevent disaster before millions die",
            "Double agents infiltrate the organization from the inside",
            "Betrayal comes from an unexpected source close to home",
            "A perfect crime begins to unravel with one small mistake",
            "Hidden identities are revealed in a web of deception",
            "The hunter becomes the hunted in a deadly game of cat and mouse",
            "A ticking clock threatens innocent lives in the crowded city",
            "Trust no one in this deadly game of international espionage"
        ],
        "dystopian": [
            "The last free city falls under totalitarian control overnight",
            "Resources dwindle as society collapses into chaos and violence",
            "A rebellion forms in the shadows against the oppressive regime",
            "The truth about the perfect society is finally revealed",
            "Survivors must adapt to a world without technology or hope",
            "A chosen few control all while the masses suffer in poverty",
            "The environment has turned deadly and uninhabitable",
            "Memory erasure keeps the population docile and compliant",
            "Underground networks fight for freedom against impossible odds",
            "The last remnants of humanity cling to survival in bunkers"
        ],
        "urban fantasy": [
            "Magic hidden in plain sight within the modern city",
            "Supernatural creatures live among humans in secret",
            "A detective with magical abilities solves impossible crimes",
            "Ancient prophecies unfold on city streets at night",
            "Portals to other realms open in subway stations",
            "Vampire clans control the city's underworld businesses",
            "A werewolf pack protects their territory from dark forces",
            "Witches run coffee shops that serve more than drinks",
            "Fae nobility hold court in abandoned warehouses",
            "Urban legends come to life with terrifying consequences"
        ],
        "paranormal": [
            "Ghosts communicate through electronics and technology",
            "Psychic visions reveal murders before they happen",
            "A medium helps lost souls find peace and closure",
            "Haunted objects possess incredible and dangerous power",
            "Parallel dimensions intersect with our reality",
            "Spirits seek revenge for wrongs committed against them",
            "Telekinesis manifests in times of extreme emotion",
            "Shadow people watch from the corners of rooms",
            "Astral projection allows exploration of other planes",
            "Demonic possession threatens an innocent family"
        ],
        "historical fiction": [
            "A soldier's untold story from the Great War emerges",
            "Life in ancient Rome through the eyes of a slave",
            "The Renaissance artist's secret life and forbidden love",
            "A spy's dangerous missions during the Cold War era",
            "Colonial America settlers face impossible challenges",
            "Victorian London's underbelly and its dark secrets",
            "Medieval knights and the code of chivalry tested",
            "The Industrial Revolution changes lives forever",
            "World War II resistance fighters risk everything",
            "Ancient Egypt's pharaohs and political intrigue"
        ],
        "contemporary": [
            "Modern life challenges and personal growth in the city",
            "Family dynamics in the age of social media",
            "Career ambitions clash with personal relationships",
            "Finding identity in a rapidly changing world",
            "Technology connects and isolates people simultaneously",
            "Urban living and the search for meaning and purpose",
            "Friendship tested by life's unexpected turns",
            "Love and loss in contemporary society explored",
            "Mental health struggles in modern times addressed",
            "Cultural diversity and integration in today's world"
        ],
        "young adult": [
            "Coming of age during turbulent high school years",
            "First love and heartbreak shape a teenager's world",
            "Finding your place when you don't fit in anywhere",
            "Friendship bonds tested by secrets and betrayal",
            "Standing up against bullies and injustice at school",
            "Discovering hidden talents and pursuing dreams",
            "Family problems that teenagers must navigate alone",
            "Identity crisis and self-discovery journey begins",
            "Social pressure and the need to belong conflicts",
            "Growing up too fast in difficult circumstances"
        ],
        "crime": [
            "Organized crime syndicate controls the entire city",
            "A heist meticulously planned down to every detail",
            "Undercover cop infiltrates dangerous criminal gang",
            "Drug cartel war erupts on city streets violently",
            "White-collar crime ruins thousands of lives quietly",
            "Serial robberies baffle police for months on end",
            "Money laundering operation spans multiple countries",
            "Witness protection fails putting lives in danger",
            "Corrupt officials protect criminal enterprises secretly",
            "Vigilante justice targets those who escape the law"
        ],
        "biography": [
            "Rise from poverty to incredible success and fame",
            "Overcoming adversity through determination and courage",
            "Revolutionary leader who changed history forever",
            "Artist's journey from obscurity to recognition worldwide",
            "Scientist's groundbreaking discoveries despite opposition",
            "Athlete's triumph over injury and personal demons",
            "Activist fighting for justice against powerful forces",
            "Entrepreneur building empire from nothing but ideas",
            "War hero's sacrifice and bravery under fire",
            "Cultural icon's impact on generations that followed"
        ],
        "memoir": [
            "Childhood memories shape adult life and choices",
            "Surviving trauma and finding strength to continue",
            "Journey through addiction and recovery to hope",
            "Family secrets revealed after decades of silence",
            "Travel experiences that transform perspective completely",
            "Career changes at midlife lead to fulfillment",
            "Relationships that defined and shaped a lifetime",
            "Loss and grief processed through writing honestly",
            "Finding purpose after major life upheaval occurs",
            "Cultural heritage explored through personal history"
        ],
        "comedy": [
            "Misunderstandings lead to hilarious complications daily",
            "Unlikely friends embark on absurd adventure together",
            "Workplace chaos with eccentric coworkers causes havoc",
            "Family gatherings descend into comic disasters always",
            "Romantic mishaps result in laugh-out-loud moments",
            "Fish out of water struggles with new environment",
            "Pranks and schemes backfire spectacularly and publicly",
            "Mistaken identity creates increasingly funny situations",
            "Awkward social encounters multiply exponentially somehow",
            "Everyday situations become absurdly complicated events"
        ],
        "drama": [
            "Family torn apart by secrets and betrayal revealed",
            "Moral dilemmas force impossible choices with consequences",
            "Relationships crumble under pressure and stress",
            "Personal crisis leads to profound life changes",
            "Social issues explored through character struggles deeply",
            "Power dynamics shift with devastating results for all",
            "Sacrifice made for the greater good of others",
            "Truth versus loyalty creates unbearable tension",
            "Past mistakes haunt present and future relentlessly",
            "Redemption sought through difficult personal journey"
        ],
        "epic": [
            "Generations-spanning saga of family and destiny",
            "Kingdom rises and falls over centuries of conflict",
            "Heroes journey across vast lands facing trials",
            "Legendary battles determine fate of civilizations",
            "Mythical quest for artifact of ultimate power",
            "Empire building through conquest and diplomacy",
            "Prophecies fulfilled through sacrifice and courage",
            "Multiple storylines converge for final confrontation",
            "Historical events reimagined with grand scope",
            "Chosen ones rise to challenge gods themselves"
        ],
        "mythology": [
            "Gods walk among mortals with hidden agendas",
            "Ancient myths retold from new perspectives fresh",
            "Creation stories explain origins of the world",
            "Heroes undertake divine quests for immortality",
            "Monsters from legends terrorize the land again",
            "Pantheons clash in epic battles for supremacy",
            "Mythical creatures guide heroes on dangerous journeys",
            "Sacred artifacts hold power of the gods themselves",
            "Underworld journeys reveal secrets of death itself",
            "Prophecies from oracles shape destinies of nations"
        ],
        "fairy tale": [
            "Classic stories reimagined for modern times creatively",
            "Magical transformations teach valuable life lessons",
            "Enchanted forests hide wonders and dangers equally",
            "True love breaks ancient and powerful curses",
            "Talking animals guide lost travelers home safely",
            "Wishes granted come with unexpected consequences always",
            "Good triumphs over evil through kindness shown",
            "Magical objects grant powers beyond imagination",
            "Quests test character and reveal true hearts",
            "Happily ever after earned through trials overcome"
        ],
        "poetry": [
            "Emotions captured in lyrical verse and rhythm",
            "Nature's beauty expressed through metaphor elegantly",
            "Love and loss explored in structured sonnets",
            "Social commentary delivered through powerful imagery",
            "Personal experiences transformed into universal truths",
            "Abstract concepts made tangible through words chosen",
            "Cultural heritage preserved in traditional forms",
            "Modern life reflected in contemporary verse style",
            "Spiritual journey expressed through symbolic language",
            "Human condition examined with raw honesty displayed"
        ],
        "short story": [
            "Complete narrative arc in brief format executed",
            "Twist ending that reframes entire story cleverly",
            "Character study revealing depth in few pages",
            "Single moment in time captured with precision",
            "Slice of life that resonates universally somehow",
            "Flash fiction with maximum impact achieved quickly",
            "Experimental narrative structure challenges readers",
            "Moral tale that teaches through example given",
            "Vignette that captures essence of experience",
            "Compressed epic with all elements included"
        ],
        "western": [
            "Lone gunslinger arrives in lawless frontier town",
            "Cattle drive faces dangers across wild territory",
            "Outlaw gang terrorizes settlers and homesteaders",
            "Sheriff brings justice to corrupt mining town",
            "Native American conflicts over disputed lands",
            "Gold rush fever drives men to desperate acts",
            "Railroad expansion changes the frontier forever",
            "Revenge quest across the untamed wilderness",
            "Ranch wars between powerful families erupt",
            "Frontier justice served by vigilante posses"
        ],
        "literary fiction": [
            "Character-driven narrative explores human nature deeply",
            "Experimental prose challenges conventional storytelling",
            "Psychological complexity examined through relationships",
            "Philosophical themes woven throughout narrative carefully",
            "Language elevated to art form with precision",
            "Social commentary embedded in personal stories",
            "Multiple perspectives reveal truth gradually always",
            "Symbolism layers meaning beneath surface events",
            "Internal conflict drives external plot forward",
            "Ambiguous endings invite reader interpretation freely"
        ]
    }
    
    # Style variations
    STYLE_MODIFIERS = [
        "Make it atmospheric and descriptive",
        "Focus on character emotions and internal conflict",
        "Use vivid sensory details",
        "Create tension and suspense",
        "Emphasize dialogue and character interaction",
        "Build a mysterious and ominous tone",
        "Include poetic and metaphorical language",
        "Write with a fast-paced, action-oriented style",
        "Develop complex moral dilemmas",
        "Create an immersive world with rich details"
    ]
    
    def __init__(self, ensemble, memory, finetuning):
        self.ensemble = ensemble
        self.memory = memory
        self.finetuning = finetuning
        self.story_service_url = "http://localhost:8082/api/stories"  # Story service endpoint
        self.training_history_url = "http://localhost:8082/api/training-history"  # Training history endpoint
    
    def get_training_prompt(self, genre: str = None) -> tuple[str, str, str]:
        """
        Get a random training prompt
        
        Returns:
            (genre, prompt, style_modifier)
        """
        if genre and genre in self.TRAINING_PROMPTS:
            selected_genre = genre
        else:
            selected_genre = random.choice(list(self.TRAINING_PROMPTS.keys()))
        
        prompt = random.choice(self.TRAINING_PROMPTS[selected_genre])
        style = random.choice(self.STYLE_MODIFIERS)
        
        return selected_genre, prompt, style
    
    async def generate_training_example(
        self,
        user_id: str,
        genre: str = None,
        store_in_memory: bool = False,
        save_to_database: bool = False
    ) -> Dict[str, Any]:
        """
        Generate a SIMPLE single-element training example (one scene/character/word)
        OPTIMIZED FOR RATE LIMITS: Focuses on small, high-quality outputs
        
        Args:
            user_id: User identifier
            genre: Specific genre or random
            store_in_memory: Whether to store in RAG memory
            save_to_database: Whether to save as actual story in database
            
        Returns:
            Training example data with model voting details
        """
        try:
            # Get random prompt
            selected_genre, prompt, style_modifier = self.get_training_prompt(genre)
            
            # SIMPLIFIED PROMPT - Focus on ONE element only
            training_modes = [
                "Write ONE scene (2-3 paragraphs max):",
                "Create ONE character (description + backstory, 150 words):",
                "Write ONE dialogue exchange (5-10 lines):",
                "Describe ONE setting (vivid details, 100 words):",
            ]
            
            mode = random.choice(training_modes)
            simplified_prompt = f"{mode} {prompt}\n\nStyle: {style_modifier}\n\nKeep it concise and focused."
            
            # Get ensemble result with smart fallback
            result = await self.ensemble.generate_with_voting(
                prompt=simplified_prompt,
                instruction=f"{style_modifier}. Maximum 200 words.",
                style_context="",
                mode="scene"
            )
            
            # Extract best model parameters from ensemble voting
            voting_details = getattr(self.ensemble, 'last_voting_details', {})
            best_model = voting_details.get('winning_model', 'ensemble')
            model_scores = voting_details.get('model_scores', {})
            
            # Quality score based on ensemble confidence and text quality
            quality_score = self._estimate_quality(result)
            ensemble_confidence = voting_details.get('confidence', 0.7)
            final_quality = (quality_score * 0.7) + (ensemble_confidence * 10 * 0.3)
            
            # Collect for fine-tuning with best model parameters
            self.finetuning.collect_training_example(
                user_id=user_id,
                input_text=prompt,
                output_text=result,
                quality_score=final_quality,
                metadata={
                    "genre": selected_genre,
                    "style_modifier": style_modifier,
                    "auto_generated": True,
                    "timestamp": datetime.now().isoformat(),
                    "best_model": best_model,
                    "ensemble_confidence": ensemble_confidence,
                    "model_scores": model_scores,
                    "voting_details": voting_details
                }
            )
            
            # Optionally store in RAG memory
            if store_in_memory and final_quality >= 7.0:
                self.memory.add_experience(
                    user_id=user_id,
                    text=result,
                    metadata={
                        "genre": selected_genre,
                        "quality_score": final_quality,
                        "auto_generated": True,
                        "timestamp": datetime.now().isoformat(),
                        "best_model": best_model
                    }
                )
            
            # Optionally save to database as actual story
            story_id = None
            if save_to_database and final_quality >= 8.0:  # Only save high-quality stories
                story_id = await self._save_story_to_database(
                    user_id=user_id,
                    title=f"Auto-Generated: {prompt[:50]}...",
                    content=result,
                    genre=selected_genre,
                    quality_score=final_quality,
                    metadata={
                        "auto_generated": True,
                        "best_model": best_model,
                        "style_modifier": style_modifier
                    }
                )
            
            return {
                "success": True,
                "genre": selected_genre,
                "prompt": prompt,
                "output": result,
                "quality_score": final_quality,
                "stored_in_memory": store_in_memory,
                "saved_to_database": save_to_database and story_id is not None,
                "story_id": story_id,
                "length": len(result),
                "best_model": best_model,
                "ensemble_confidence": ensemble_confidence
            }
            
        except Exception as e:
            print(f"[AutoTrainer] ❌ Error generating example: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def batch_generate_training_data(
        self,
        user_id: str,
        num_examples: int,
        genres: List[str] = None,
        store_in_memory: bool = False,
        save_to_database: bool = False,
        progress_callback = None
    ) -> Dict[str, Any]:
        """
        Generate multiple training examples in batch with ensemble voting
        
        Args:
            user_id: User identifier
            num_examples: Number of examples to generate (1-1000)
            genres: List of genres to focus on, or None for random
            store_in_memory: Whether to store in RAG memory
            save_to_database: Whether to save high-quality stories to database
            progress_callback: Optional callback for progress updates
            
        Returns:
            Summary of generation process with model performance metrics
        """
        num_examples = max(1, min(1000, num_examples))  # Clamp to 1-1000
        
        # Get training stats before starting
        stats_before = self.finetuning.get_user_stats(user_id)
        training_examples_before = stats_before.get("training_examples", 0)
        
        print(f"[AutoTrainer] 🚀 Starting batch generation: {num_examples} examples")
        print(f"[AutoTrainer] 📊 Store in memory: {store_in_memory}")
        print(f"[AutoTrainer] 💾 Save to database: {save_to_database}")
        print(f"[AutoTrainer] 🎯 Genres: {genres or 'random'}")
        
        results = {
            "total_requested": num_examples,
            "successful": 0,
            "failed": 0,
            "examples": [],
            "genre_distribution": {},
            "average_quality": 0,
            "total_time": 0,
            "stored_in_memory": store_in_memory,
            "saved_to_database": save_to_database,
            "stories_saved": 0,
            "model_performance": {},  # Track which models perform best
            "best_examples": []  # Top 10 quality examples
        }
        
        start_time = datetime.now()
        
        # Generate examples ONE AT A TIME with rate limiting
        for i in range(num_examples):
            try:
                # Select genre
                if genres:
                    genre = random.choice(genres)
                else:
                    genre = None
                
                # RATE LIMITING: Add delay between examples (respect API limits)
                if i > 0:
                    delay = random.uniform(3, 5)  # 3-5 second delay between requests
                    print(f"[AutoTrainer] ⏳ Waiting {delay:.1f}s before next example (rate limiting)...")
                    await asyncio.sleep(delay)
                
                # Generate example
                print(f"[AutoTrainer] 🎯 Generating example {i + 1}/{num_examples}...")
                example = await self.generate_training_example(
                    user_id=user_id,
                    genre=genre,
                    store_in_memory=store_in_memory,
                    save_to_database=save_to_database
                )
                
                if example["success"]:
                    results["successful"] += 1
                    results["examples"].append(example)
                    
                    # Track stories saved to database
                    if example.get("saved_to_database"):
                        results["stories_saved"] += 1
                    
                    # Update genre distribution
                    example_genre = example["genre"]
                    results["genre_distribution"][example_genre] = \
                        results["genre_distribution"].get(example_genre, 0) + 1
                    
                    # Track model performance
                    best_model = example.get("best_model", "unknown")
                    if best_model not in results["model_performance"]:
                        results["model_performance"][best_model] = {
                            "count": 0,
                            "avg_quality": 0,
                            "total_quality": 0
                        }
                    results["model_performance"][best_model]["count"] += 1
                    results["model_performance"][best_model]["total_quality"] += example["quality_score"]
                    results["model_performance"][best_model]["avg_quality"] = \
                        results["model_performance"][best_model]["total_quality"] / \
                        results["model_performance"][best_model]["count"]
                    
                    # Progress callback
                    if progress_callback:
                        await progress_callback({
                            "current": i + 1,
                            "total": num_examples,
                            "percentage": ((i + 1) / num_examples) * 100,
                            "latest_quality": example["quality_score"],
                            "current_genre": example_genre,
                            "best_model": best_model,
                            "successful": results["successful"],
                            "failed": results["failed"],
                            "stories_saved": results["stories_saved"]
                        })
                    
                    # Log progress
                    if (i + 1) % 10 == 0 or (i + 1) == num_examples:
                        print(f"[AutoTrainer] 📈 Progress: {i + 1}/{num_examples} ({results['successful']} successful)")
                
                else:
                    results["failed"] += 1
                    
            except Exception as e:
                print(f"[AutoTrainer] ⚠️ Example {i + 1} failed: {e}")
                results["failed"] += 1
        
        # Calculate statistics
        end_time = datetime.now()
        results["total_time"] = (end_time - start_time).total_seconds()
        
        if results["successful"] > 0:
            quality_scores = [ex["quality_score"] for ex in results["examples"]]
            results["average_quality"] = sum(quality_scores) / len(quality_scores)
            results["min_quality"] = min(quality_scores)
            results["max_quality"] = max(quality_scores)
            
            # Get top 10 best examples
            sorted_examples = sorted(results["examples"], 
                                    key=lambda x: x["quality_score"], 
                                    reverse=True)
            results["best_examples"] = sorted_examples[:10]
        
        # Check if ready for fine-tuning
        stats = self.finetuning.get_user_stats(user_id)
        results["training_stats"] = stats
        results["ready_for_finetuning"] = stats.get("training_examples", 0) >= 50
        
        print(f"[AutoTrainer] ✅ Batch complete: {results['successful']}/{num_examples} successful")
        print(f"[AutoTrainer] ⏱️ Total time: {results['total_time']:.2f}s")
        print(f"[AutoTrainer] 📊 Average quality: {results['average_quality']:.2f}/10")
        print(f"[AutoTrainer] 💾 Stories saved to database: {results['stories_saved']}")
        print(f"[AutoTrainer] 🎓 Total training examples: {stats.get('training_examples', 0)}")
        
        # Print model performance summary
        if results["model_performance"]:
            print(f"[AutoTrainer] 🤖 Model Performance Summary:")
            for model, perf in sorted(results["model_performance"].items(), 
                                     key=lambda x: x[1]["avg_quality"], 
                                     reverse=True):
                print(f"  - {model}: {perf['count']} wins, avg quality {perf['avg_quality']:.2f}/10")
        
        # Save training history
        try:
            await self._save_training_history(
                user_id=user_id,
                start_time=start_time,
                end_time=end_time,
                num_examples=num_examples,
                genres=genres,
                save_to_database=save_to_database,
                results=results,
                training_examples_before=training_examples_before
            )
        except Exception as e:
            print(f"[AutoTrainer] ⚠️ Failed to save training history: {e}")
        
        return results
    
    def _estimate_quality(self, text: str) -> float:
        """
        Estimate quality score based on text characteristics
        
        This is a simple heuristic - in production, you might use
        a more sophisticated quality model
        """
        if not text or len(text) < 50:
            return 5.0
        
        score = 7.0  # Base score
        
        # Length bonus (optimal 200-800 chars)
        length = len(text)
        if 200 <= length <= 800:
            score += 1.0
        elif length > 800:
            score += 0.5
        
        # Sentence structure (check for periods)
        sentences = text.count('.') + text.count('!') + text.count('?')
        if sentences >= 3:
            score += 0.5
        
        # Descriptive words bonus
        descriptive_words = ['dark', 'mysterious', 'ancient', 'powerful', 'shadows', 
                            'whispered', 'gleaming', 'haunting', 'ethereal', 'vast']
        descriptive_count = sum(1 for word in descriptive_words if word.lower() in text.lower())
        if descriptive_count >= 2:
            score += 0.5
        
        # Dialogue bonus (check for quotes)
        if '"' in text or "'" in text:
            score += 0.3
        
        return min(10.0, score)  # Cap at 10.0
    
    async def _save_story_to_database(
        self,
        user_id: str,
        title: str,
        content: str,
        genre: str,
        quality_score: float,
        metadata: Dict[str, Any]
    ) -> Optional[int]:
        """
        Save a high-quality training story to the database for user access
        
        Returns:
            Story ID if successful, None otherwise
        """
        try:
            import aiohttp
            
            # Map genre names to match database
            genre_mapping = {
                "sci_fi": "Science Fiction",
                "dark_fantasy": "Urban Fantasy",  # Close match
                "young adult": "Young Adult"
            }
            
            db_genre = genre_mapping.get(genre.lower(), genre.title())
            
            story_data = {
                "title": title,
                "content": content,
                "userId": int(user_id) if user_id.isdigit() else 1,  # Default to user 1 if not numeric
                "summary": f"Auto-generated {db_genre} story with quality score {quality_score:.1f}/10",
                "genreIds": [],  # Will be populated by story service based on genre lookup
                "isPublic": False,  # Private by default
                "tags": ["auto-generated", "ai-training", metadata.get("best_model", "ensemble")],
                "metadata": {
                    "auto_generated": True,
                    "quality_score": quality_score,
                    "style_modifier": metadata.get("style_modifier", ""),
                    "best_model": metadata.get("best_model", "ensemble"),
                    "training_timestamp": datetime.now().isoformat()
                }
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    self.story_service_url,
                    json=story_data,
                    headers={"Content-Type": "application/json"}
                ) as response:
                    if response.status == 201 or response.status == 200:
                        result = await response.json()
                        story_id = result.get("id")
                        print(f"[AutoTrainer] 💾 Saved story #{story_id} to database")
                        return story_id
                    else:
                        error_text = await response.text()
                        print(f"[AutoTrainer] ⚠️ Failed to save story: {response.status} - {error_text}")
                        return None
                        
        except Exception as e:
            print(f"[AutoTrainer] ⚠️ Error saving story to database: {e}")
            return None
    
    async def _save_training_history(
        self,
        user_id: str,
        start_time: datetime,
        end_time: datetime,
        num_examples: int,
        genres: List[str],
        save_to_database: bool,
        results: Dict[str, Any],
        training_examples_before: int
    ) -> None:
        """
        Save training session history to database
        
        Args:
            user_id: User identifier
            start_time: When training started
            end_time: When training completed
            num_examples: Number of examples requested
            genres: Genres used in training
            save_to_database: Whether stories were saved to database
            results: Training results dictionary
            training_examples_before: Number of training examples before this session
        """
        try:
            import aiohttp
            
            # Generate unique session ID
            session_id = uuid.uuid4().hex
            
            # Get final training stats
            stats_after = self.finetuning.get_user_stats(user_id)
            training_examples_after = stats_after.get("training_examples", 0)
            
            # Determine best performing model
            best_model = "unknown"
            if results.get("model_performance"):
                best_model = max(
                    results["model_performance"].items(),
                    key=lambda x: x[1]["avg_quality"]
                )[0]
            
            # Prepare history data
            history_data = {
                "userId": int(user_id) if user_id.isdigit() else 1,
                "sessionId": session_id,
                "numExamplesRequested": num_examples,
                "numExamplesSuccessful": results.get("successful", 0),
                "numExamplesFailed": results.get("failed", 0),
                "genresSelected": json.dumps(genres if genres else ["random"]),
                "storedInMemory": results.get("stored_in_memory", False),
                "savedToDatabase": save_to_database,
                "storiesSavedCount": results.get("stories_saved", 0),
                "averageQuality": round(results.get("average_quality", 0.0), 1),
                "minQuality": round(results.get("min_quality", 0.0), 1),
                "maxQuality": round(results.get("max_quality", 0.0), 1),
                "bestPerformingModel": best_model,
                "modelPerformanceJson": json.dumps(results.get("model_performance", {})),
                "genreDistributionJson": json.dumps(results.get("genre_distribution", {})),
                "totalTimeSeconds": int(results.get("total_time", 0)),
                "trainingExamplesBefore": training_examples_before,
                "trainingExamplesAfter": training_examples_after,
                "finetuningTriggered": training_examples_after >= 50 and training_examples_before < 50,
                "startedAt": start_time.isoformat(),
                "completedAt": end_time.isoformat()
            }
            
            # Save to backend
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    self.training_history_url,
                    json=history_data,
                    headers={"Content-Type": "application/json"}
                ) as response:
                    if response.status in (200, 201):
                        print(f"[AutoTrainer] 📝 Training history saved (Session ID: {session_id})")
                    else:
                        error_text = await response.text()
                        print(f"[AutoTrainer] ⚠️ Failed to save training history: {response.status} - {error_text}")
                        
        except Exception as e:
            print(f"[AutoTrainer] ⚠️ Error saving training history: {e}")
            # Don't raise - history saving should not fail the training process
    
    def get_available_genres(self) -> List[str]:
        """Get list of all available genres for training (25 genres)"""
        return sorted(list(self.TRAINING_PROMPTS.keys()))
