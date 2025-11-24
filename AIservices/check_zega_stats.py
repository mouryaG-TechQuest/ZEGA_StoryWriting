import chromadb
from pathlib import Path

# Connect to ChromaDB
client = chromadb.PersistentClient(path='zega_store')
collection = client.get_collection('zega_user_style')

print(f"═══════════════════════════════════════════════════")
print(f"📊 ZEGA VECTOR DATABASE STATISTICS")
print(f"═══════════════════════════════════════════════════")
print(f"Total Documents Stored: {collection.count()}")

# Get sample documents
results = collection.get(limit=5)

print(f"\n📝 Sample Stored Documents:")
print(f"───────────────────────────────────────────────────")
for i, (doc, meta) in enumerate(zip(results['documents'][:5], results['metadatas'][:5])):
    print(f"\n{i+1}. User: {meta.get('user_id', 'unknown')}")
    print(f"   Score: {meta.get('score', 'N/A')}")
    print(f"   Preview: {doc[:150]}...")

print(f"\n═══════════════════════════════════════════════════")
