-- Add full-text search capabilities to recipes table
-- This migration adds tsvector columns and indexes for efficient full-text search

-- Add tsvector column for search content
ALTER TABLE recipes ADD COLUMN search_vector tsvector;

-- Create function to update search vector
CREATE OR REPLACE FUNCTION update_recipe_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.personal_notes, '')), 'C') ||
    setweight(to_tsvector('english', 
      COALESCE((
        SELECT string_agg(ingredient->>'name', ' ')
        FROM jsonb_array_elements(NEW.ingredients) AS ingredient
      ), '')
    ), 'B') ||
    setweight(to_tsvector('english', 
      COALESCE((
        SELECT string_agg(instruction->>'description', ' ')
        FROM jsonb_array_elements(NEW.instructions) AS instruction
      ), '')
    ), 'C') ||
    setweight(to_tsvector('english', 
      COALESCE(array_to_string(
        ARRAY(SELECT jsonb_array_elements_text(NEW.categories)), ' '
      ), '')
    ), 'B') ||
    setweight(to_tsvector('english', 
      COALESCE(array_to_string(
        ARRAY(SELECT jsonb_array_elements_text(NEW.tags)), ' '
      ), '')
    ), 'C');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update search vector
CREATE TRIGGER recipe_search_vector_update
  BEFORE INSERT OR UPDATE ON recipes
  FOR EACH ROW EXECUTE FUNCTION update_recipe_search_vector();

-- Update existing recipes with search vectors
UPDATE recipes SET search_vector = 
  setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(personal_notes, '')), 'C') ||
  setweight(to_tsvector('english', 
    COALESCE((
      SELECT string_agg(ingredient->>'name', ' ')
      FROM jsonb_array_elements(ingredients) AS ingredient
    ), '')
  ), 'B') ||
  setweight(to_tsvector('english', 
    COALESCE((
      SELECT string_agg(instruction->>'description', ' ')
      FROM jsonb_array_elements(instructions) AS instruction
    ), '')
  ), 'C') ||
  setweight(to_tsvector('english', 
    COALESCE(array_to_string(
      ARRAY(SELECT jsonb_array_elements_text(categories)), ' '
    ), '')
  ), 'B') ||
  setweight(to_tsvector('english', 
    COALESCE(array_to_string(
      ARRAY(SELECT jsonb_array_elements_text(tags)), ' '
    ), '')
  ), 'C');

-- Create GIN index for full-text search
CREATE INDEX recipes_search_vector_idx ON recipes USING GIN(search_vector);

-- Create additional indexes for search performance
CREATE INDEX recipes_user_search_idx ON recipes(user_id, search_vector) USING GIN(search_vector);

-- Create search history table
CREATE TABLE search_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  search_term text NOT NULL,
  search_count integer DEFAULT 1,
  last_searched_at timestamp DEFAULT NOW(),
  created_at timestamp DEFAULT NOW()
);

-- Create indexes for search history
CREATE INDEX search_history_user_id_idx ON search_history(user_id);
CREATE INDEX search_history_user_term_idx ON search_history(user_id, search_term);
CREATE INDEX search_history_last_searched_idx ON search_history(user_id, last_searched_at DESC);

-- Create function for search suggestions based on history and recipe content
CREATE OR REPLACE FUNCTION get_search_suggestions(p_user_id uuid, p_partial_term text, p_limit integer DEFAULT 10)
RETURNS TABLE(suggestion text, source text, frequency integer) AS $$
BEGIN
  RETURN QUERY
  (
    -- Get from search history
    SELECT 
      sh.search_term as suggestion,
      'history'::text as source,
      sh.search_count as frequency
    FROM search_history sh
    WHERE sh.user_id = p_user_id 
      AND sh.search_term ILIKE p_partial_term || '%'
      AND sh.search_term != p_partial_term
    ORDER BY sh.search_count DESC, sh.last_searched_at DESC
    LIMIT p_limit / 2
  )
  UNION ALL
  (
    -- Get popular ingredients from user's recipes
    SELECT DISTINCT
      ingredient->>'name' as suggestion,
      'ingredient'::text as source,
      COUNT(*)::integer as frequency
    FROM recipes r, jsonb_array_elements(r.ingredients) AS ingredient
    WHERE r.user_id = p_user_id
      AND ingredient->>'name' ILIKE p_partial_term || '%'
      AND ingredient->>'name' != p_partial_term
    GROUP BY ingredient->>'name'
    ORDER BY COUNT(*) DESC
    LIMIT p_limit / 2
  )
  ORDER BY frequency DESC, suggestion
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;