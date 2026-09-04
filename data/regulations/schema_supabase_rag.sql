-- ====================================================================
-- SUPABASE PGVECTOR MIGRATION FOR INFERA JKN REGULATORY RAG
-- ====================================================================

-- 1. Enable pgvector extension in Supabase
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create Regulations Knowledge Base Table
CREATE TABLE IF NOT EXISTS public.jkn_regulations (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  regulation TEXT NOT NULL,
  chapter TEXT,
  article TEXT,
  category TEXT NOT NULL,
  keywords TEXT[],
  content TEXT NOT NULL,
  embedding vector(1536), -- Standard OpenAI / text-embedding-3-small dimension
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Index for Fast Cosine Similarity Search
CREATE INDEX IF NOT EXISTS jkn_regulations_embedding_idx 
ON public.jkn_regulations 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 10);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.jkn_regulations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to jkn_regulations"
ON public.jkn_regulations FOR SELECT
TO anon, authenticated
USING (true);

-- 5. Stored Procedure for Semantic Vector Search (RPC)
CREATE OR REPLACE FUNCTION match_jkn_regulations(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.65,
  match_count int DEFAULT 3,
  filter_category text DEFAULT NULL
)
RETURNS TABLE (
  id TEXT,
  title TEXT,
  regulation TEXT,
  article TEXT,
  category TEXT,
  content TEXT,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.title,
    r.regulation,
    r.article,
    r.category,
    r.content,
    1 - (r.embedding <=> query_embedding) AS similarity
  FROM public.jkn_regulations r
  WHERE 
    (filter_category IS NULL OR r.category = filter_category)
    AND 1 - (r.embedding <=> query_embedding) > match_threshold
  ORDER BY r.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;