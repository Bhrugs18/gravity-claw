-- Enable pgvector extension
create extension if not exists vector;

-- Table for all messages
create table if not exists messages (
  id bigint primary key generated always as identity,
  user_id bigint not null,
  role text not null, -- 'user' or 'assistant'
  content text not null,
  embedding vector(1536), -- Vector size for Gemini embeddings
  created_at timestamp with time zone default now()
);

-- Table for core entities/facts
create table if not exists entities (
  id bigint primary key generated always as identity,
  user_id bigint not null,
  key text not null,
  value text not null,
  updated_at timestamp with time zone default now(),
  unique(user_id, key)
);

-- Function for semantic search
create or replace function match_messages (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  p_user_id bigint
)
returns table (
  id bigint,
  content text,
  role text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    messages.id,
    messages.content,
    messages.role,
    1 - (messages.embedding <=> query_embedding) as similarity
  from messages
  where 1 - (messages.embedding <=> query_embedding) > match_threshold
    and messages.user_id = p_user_id
  order by similarity desc
  limit match_count;
end;
$$;
