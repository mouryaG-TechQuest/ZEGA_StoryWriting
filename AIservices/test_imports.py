
import sys
print("Python executable:", sys.executable)
try:
    import fastapi
    print("FastAPI imported")
    import langchain
    print("LangChain imported")
    from langchain_community.llms import HuggingFaceEndpoint
    print("HuggingFaceEndpoint imported")
    import chromadb
    print("ChromaDB imported")
except ImportError as e:
    print(f"ImportError: {e}")
except Exception as e:
    print(f"Error: {e}")
