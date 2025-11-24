# ZEGA - Self-Learning Personalized AI Model

ZEGA is a personalized, self-learning next-token/next-scene predictor designed to adapt to each user's unique writing style.

## Architecture

ZEGA follows a modular architecture designed for personalization and privacy:

1.  **Foundation Model Layer**: Currently wraps `Gemini Pro` (Free Tier) but is architected to swap with local LLaMA models.
2.  **Personalization Layer (Virtual Adapters)**: Uses RAG (Retrieval Augmented Generation) to inject user-specific style examples into the context window, simulating the effect of LoRA adapters without weight updates.
3.  **Memory Store**: Uses `ChromaDB` to store user writing samples, edits, and successful generations.
4.  **Continual Learning**: The `/learn` endpoint feeds accepted text back into the Memory Store, allowing the model to "learn" from every interaction.

## Directory Structure

- `api.py`: FastAPI entry point for the ZEGA service (Port 8002).
- `core/model.py`: The main ZEGA logic, handling prompt construction and model interaction.
- `core/memory.py`: Interface for the Vector Database (ChromaDB).
- `pipeline.yaml`: Configuration for the training/inference pipeline.

## Usage

### Start the Service
```bash
# From AIservices directory
python -m zega.api
```

### API Endpoints

- **POST /predict**: Generate text based on context and user style.
  ```json
  {
    "user_id": "user123",
    "context": "The night was dark and...",
    "mode": "continuation"
  }
  ```

- **POST /learn**: Feed feedback/text back into the model.
  ```json
  {
    "user_id": "user123",
    "text": "The night was dark and full of terrors.",
    "rating": 5.0
  }
  ```

## Roadmap

- **Phase 0 (Current)**: MVP with RAG-based personalization on Gemini.
- **Phase 1**: Implement local LLaMA 8B with real LoRA adapters.
- **Phase 2**: Federated Learning for privacy-preserving updates.
