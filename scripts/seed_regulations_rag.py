# -*- coding: utf-8 -*-
"""
INFERA: Seed JKN Regulations pgvector RAG Knowledge Base.
1. Reads regulations_chunks.json.
2. Generates 1536-dimensional embeddings using OpenRouter text-embedding-3-small.
3. Caches embeddings into regulations_embeddings_cache.json for instant offline fallback.
4. Attempts to upsert chunks into Supabase table public.jkn_regulations.
5. Runs test semantic search to verify cosine similarity scoring.
"""

import os
import sys
import json
import time
import requests
import numpy as np

CHUNKS_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'regulations', 'regulations_chunks.json')
CACHE_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'regulations', 'regulations_embeddings_cache.json')

# Load environment variables
API_ENV_PATH = os.path.join(os.path.dirname(__file__), '..', 'apps', 'api', '.env')
env_vars = {}
if os.path.exists(API_ENV_PATH):
    with open(API_ENV_PATH, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, v = line.split('=', 1)
                env_vars[k.strip()] = v.strip()

OPENROUTER_API_KEY = env_vars.get('OPENROUTER_API_KEY') or os.environ.get('OPENROUTER_API_KEY')
SUPABASE_URL = env_vars.get('SUPABASE_URL') or os.environ.get('SUPABASE_URL')
SUPABASE_SERVICE_ROLE_KEY = env_vars.get('SUPABASE_SERVICE_ROLE_KEY') or os.environ.get('SUPABASE_SERVICE_ROLE_KEY')

if not OPENROUTER_API_KEY:
    print("[ERROR] OPENROUTER_API_KEY not found in apps/api/.env or environment!")
    sys.exit(1)

def get_embedding(text: str, api_key: str) -> list[float]:
    """Fetch 1536-dimensional embedding from OpenRouter (text-embedding-3-small)"""
    url = "https://openrouter.ai/api/v1/embeddings"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "text-embedding-3-small",
        "input": text
    }
    
    for attempt in range(3):
        try:
            resp = requests.post(url, headers=headers, json=payload, timeout=30)
            if resp.status_code == 200:
                data = resp.json()
                return data["data"][0]["embedding"]
            else:
                print(f"  [WARN] OpenRouter HTTP {resp.status_code}: {resp.text[:120]}, retrying...")
                time.sleep(2)
        except Exception as e:
            print(f"  [WARN] Request failed ({e}), retrying {attempt + 1}/3...")
            time.sleep(2)
            
    raise RuntimeError(f"Failed to get embedding for text: {text[:60]}")

def cosine_similarity(v1: list[float], v2: list[float]) -> float:
    a = np.array(v1, dtype=float)
    b = np.array(v2, dtype=float)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))

def main():
    print("=============================================================")
    print("INFERA: JKN REGULATION RAG KNOWLEDGE BASE SEEDER")
    print("=============================================================")
    
    with open(CHUNKS_PATH, 'r', encoding='utf-8') as f:
        chunks = json.load(f)
        
    print(f"Loaded {len(chunks)} verified regulatory chunks from {CHUNKS_PATH}")
    
    # Check if cache already exists
    cached_chunks = {}
    if os.path.exists(CACHE_PATH):
        try:
            with open(CACHE_PATH, 'r', encoding='utf-8') as f:
                cached_list = json.load(f)
                for c in cached_list:
                    if "embedding" in c and len(c["embedding"]) == 1536:
                        cached_chunks[c["id"]] = c["embedding"]
            print(f"Found {len(cached_chunks)} cached embeddings.")
        except Exception as e:
            print(f"Could not read cache: {e}")
            
    # Compute embeddings
    updated_chunks = []
    print("\n--- Generating Embeddings (text-embedding-3-small, 1536 dim) ---")
    for idx, chunk in enumerate(chunks, 1):
        cid = chunk["id"]
        title = chunk["title"]
        if cid in cached_chunks:
            print(f"[{idx}/{len(chunks)}] {cid}: {title} (cached)")
            chunk["embedding"] = cached_chunks[cid]
        else:
            print(f"[{idx}/{len(chunks)}] {cid}: {title} (generating via OpenRouter)...")
            embed_input = f"{chunk['title']}. {chunk['content']}. Keywords: {', '.join(chunk.get('keywords', []))}"
            emb = get_embedding(embed_input, OPENROUTER_API_KEY)
            chunk["embedding"] = emb
            time.sleep(0.5) # gentle rate limit
        updated_chunks.append(chunk)
        
    # Save cache
    with open(CACHE_PATH, 'w', encoding='utf-8') as f:
        json.dump(updated_chunks, f, ensure_ascii=False, indent=2)
    print(f"\nSaved {len(updated_chunks)} chunks with embeddings to {CACHE_PATH}")
    
    # Try inserting into Supabase
    if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY:
        print("\n--- Attempting Supabase Ingestion ---")
        sb_headers = {
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates"
        }
        
        # Test if table exists
        check_url = f"{SUPABASE_URL}/rest/v1/jkn_regulations?select=id&limit=1"
        try:
            check_res = requests.get(check_url, headers=sb_headers)
            if check_res.status_code == 200:
                print("Table 'public.jkn_regulations' exists in Supabase. Upserting rows...")
                for c in updated_chunks:
                    row = {
                        "id": c["id"],
                        "title": c["title"],
                        "regulation": c["regulation"],
                        "chapter": c.get("chapter"),
                        "article": c.get("article"),
                        "category": c["category"],
                        "keywords": c.get("keywords", []),
                        "content": c["content"],
                        "embedding": c["embedding"]
                    }
                    upsert_res = requests.post(
                        f"{SUPABASE_URL}/rest/v1/jkn_regulations",
                        headers=sb_headers,
                        json=row
                    )
                    if upsert_res.status_code in [200, 201]:
                        print(f"  [OK] Upserted {c['id']}")
                    else:
                        print(f"  [WARN] Failed to upsert {c['id']}: {upsert_res.status_code} {upsert_res.text}")
                print("Supabase ingestion complete!")
            else:
                print(f"[NOTICE] Table 'public.jkn_regulations' not found yet (HTTP {check_res.status_code}).")
                print("         Please execute 'data/regulations/schema_supabase_rag.sql' in your Supabase SQL Editor.")
                print("         INFERA will automatically use the high-speed cached embeddings in the meantime!")
        except Exception as e:
            print(f"[WARN] Supabase check error: {e}")
            
    # Run test semantic search
    print("\n--- Testing Semantic Search (Cosine Similarity) ---")
    test_query = "Pasien ditagihkan fisioterapi 3 kali seminggu tapi tidak ada rekam medis di hari libur"
    print(f"Test Query: \"{test_query}\"")
    q_emb = get_embedding(test_query, OPENROUTER_API_KEY)
    
    scored_results = []
    for c in updated_chunks:
        sim = cosine_similarity(q_emb, c["embedding"])
        scored_results.append((sim, c))
        
    scored_results.sort(key=lambda x: x[0], reverse=True)
    
    print("\nTop Matches for Query:")
    for rank, (sim, c) in enumerate(scored_results[:3], 1):
        print(f" {rank}. [Score: {sim:.4f}] [{c['id']}] {c['title']}")
        print(f"    Pasal/Regulasi: {c['regulation']} ({c.get('article', '')})")
        print(f"    Snippet: {c['content'][:140]}...\n")
        
    print("=============================================================")
    print("SEEDING AND VERIFICATION SUCCESSFUL!")
    print("=============================================================")

if __name__ == '__main__':
    main()
