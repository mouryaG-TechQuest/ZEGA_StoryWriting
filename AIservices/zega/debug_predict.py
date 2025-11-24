
import sys
import asyncio
from pathlib import Path

# Add parent directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

from core.model import ZegaModel
from core.memory import ZegaMemory

async def test():
    memory = ZegaMemory(persistence_path="zega_store_debug")
    zega = ZegaModel(memory=memory)
    
    print("Testing with empty context...")
    try:
        res = await zega.predict("user_1", "", mode="continuation")
        print(f"Result: {res}")
    except Exception as e:
        print(f"Error: {e}")

    print("\nTesting with Title only...")
    try:
        res = await zega.predict("user_1", "Title: My Story", mode="continuation")
        print(f"Result: {res}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test())
