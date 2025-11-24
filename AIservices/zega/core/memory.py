import chromadb
from chromadb.config import Settings
import os
import json
from pathlib import Path
from typing import List, Dict, Any, Optional

class ZegaMemory:
    def __init__(self, persistence_path: str = "zega_memory"):
        self.persistence_path = Path(persistence_path)
        self.persistence_path.mkdir(exist_ok=True)
        self.client = chromadb.PersistentClient(path=str(self.persistence_path))
        self.collection = self.client.get_or_create_collection(name="zega_user_style")
        self.user_profiles_path = self.persistence_path / "user_profiles"
        self.user_profiles_path.mkdir(exist_ok=True)
        
    def add_experience(self, user_id: str, text: str, metadata: Dict[str, Any]):
        """
        Stores a writing sample or interaction to learn from.
        """
        try:
            doc_id = f"{user_id}_{metadata.get('timestamp', 'unknown')}_{abs(hash(text))}"
            self.collection.add(
                documents=[text],
                metadatas=[{**metadata, "user_id": user_id}],
                ids=[doc_id]
            )
            
            # Update user profile
            self._update_user_profile(user_id, text, metadata)
            print(f"✅ Stored experience for user {user_id}")
        except Exception as e:
            print(f"⚠️ Failed to add experience: {e}")
    
    def _update_user_profile(self, user_id: str, text: str, metadata: Dict[str, Any]):
        """Update user profile with writing statistics."""
        profile_file = self.user_profiles_path / f"{user_id}.json"
        
        profile = {
            "user_id": user_id,
            "total_samples": 0,
            "total_words": 0,
            "avg_sentence_length": 0,
            "last_updated": metadata.get("timestamp")
        }
        
        if profile_file.exists():
            with open(profile_file, 'r') as f:
                profile = json.load(f)
        
        # Update stats
        word_count = len(text.split())
        profile["total_samples"] += 1
        profile["total_words"] += word_count
        profile["last_updated"] = metadata.get("timestamp")
        
        with open(profile_file, 'w') as f:
            json.dump(profile, f, indent=2)

    def retrieve_context(self, user_id: str, query: str, n_results: int = 5) -> List[str]:
        """
        Retrieves relevant past writings to use as context/style reference.
        """
        try:
            results = self.collection.query(
                query_texts=[query],
                n_results=n_results,
                where={"user_id": user_id}
            )
            
            if results and results['documents']:
                return results['documents'][0]
        except Exception as e:
            print(f"⚠️ Failed to retrieve context: {e}")
        return []
    
    def get_user_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user's writing profile."""
        profile_file = self.user_profiles_path / f"{user_id}.json"
        if profile_file.exists():
            with open(profile_file, 'r') as f:
                return json.load(f)
        return None

    def get_user_style_vector(self, user_id: str):
        """
        Placeholder for retrieving a computed style vector.
        In a full implementation, this would average embeddings of recent works.
        """
        # For MVP, we rely on RAG (retrieve_context) as the "Style Adapter"
        pass
    
    def get_stats(self) -> Dict[str, Any]:
        """Get memory statistics."""
        try:
            total_docs = self.collection.count()
            unique_users = len(list(self.user_profiles_path.glob("*.json")))
            return {
                "total_documents": total_docs,
                "unique_users": unique_users,
                "storage_path": str(self.persistence_path)
            }
        except Exception as e:
            return {"error": str(e)}
