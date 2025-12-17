-- Performance optimization indexes for the personal cookbook database

-- Composite indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS recipes_user_updated_idx 
ON recipes (user_id, updated_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS recipes_user_created_idx 
ON recipes (user_id, created_at DESC);

-- Indexes for filtering operations
CREATE INDEX CONCURRENTLY IF NOT EXISTS recipes_user_difficulty_idx 
ON recipes (user_id, difficulty) WHERE difficulty IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS recipes_user_cooking_time_idx 
ON recipes (user_id, cooking_time) WHERE cooking_time IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS recipes_user_prep_time_idx 
ON recipes (user_id, prep_time) WHERE prep_time IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS recipes_user_servings_idx 
ON recipes (user_id, servings) WHERE servings IS NOT NULL;

-- GIN indexes for JSONB columns (categories and tags)
CREATE INDEX CONCURRENTLY IF NOT EXISTS recipes_categories_gin_idx 
ON recipes USING GIN (categories);

CREATE INDEX CONCURRENTLY IF NOT EXISTS recipes_tags_gin_idx 
ON recipes USING GIN (tags);

CREATE INDEX CONCURRENTLY IF NOT EXISTS recipes_ingredients_gin_idx 
ON recipes USING GIN (ingredients);

CREATE INDEX CONCURRENTLY IF NOT EXISTS recipes_instructions_gin_idx 
ON recipes USING GIN (instructions);

-- Full-text search index (if search_vector column exists)
CREATE INDEX CONCURRENTLY IF NOT EXISTS recipes_search_vector_idx 
ON recipes USING GIN (search_vector) WHERE search_vector IS NOT NULL;

-- Partial indexes for source types
CREATE INDEX CONCURRENTLY IF NOT EXISTS recipes_user_source_web_idx 
ON recipes (user_id, source_url) WHERE source_type = 'web' AND source_url IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS recipes_user_source_video_idx 
ON recipes (user_id, source_url) WHERE source_type = 'video' AND source_url IS NOT NULL;

-- Wishlist performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS wishlist_user_category_idx 
ON wishlist_items (user_id, category);

CREATE INDEX CONCURRENTLY IF NOT EXISTS wishlist_user_priority_idx 
ON wishlist_items (user_id, priority);

CREATE INDEX CONCURRENTLY IF NOT EXISTS wishlist_user_purchased_created_idx 
ON wishlist_items (user_id, is_purchased, created_at DESC);

-- Search history performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS search_history_user_term_count_idx 
ON search_history (user_id, search_term, search_count DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS search_history_user_recent_idx 
ON search_history (user_id, last_searched_at DESC);

-- Update search vector trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_recipe_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.personal_notes, '')), 'C') ||
    setweight(to_tsvector('english', 
      COALESCE(
        (SELECT string_agg(ingredient->>'name', ' ') 
         FROM jsonb_array_elements(NEW.ingredients) AS ingredient), 
        ''
      )
    ), 'B') ||
    setweight(to_tsvector('english', 
      COALESCE(
        (SELECT string_agg(instruction->>'description', ' ') 
         FROM jsonb_array_elements(NEW.instructions) AS instruction), 
        ''
      )
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

-- Create trigger for automatic search vector updates
DROP TRIGGER IF EXISTS recipe_search_vector_update ON recipes;
CREATE TRIGGER recipe_search_vector_update
  BEFORE INSERT OR UPDATE ON recipes
  FOR EACH ROW EXECUTE FUNCTION update_recipe_search_vector();

-- Update existing recipes' search vectors
UPDATE recipes SET search_vector = 
  setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(personal_notes, '')), 'C') ||
  setweight(to_tsvector('english', 
    COALESCE(
      (SELECT string_agg(ingredient->>'name', ' ') 
       FROM jsonb_array_elements(ingredients) AS ingredient), 
      ''
    )
  ), 'B') ||
  setweight(to_tsvector('english', 
    COALESCE(
      (SELECT string_agg(instruction->>'description', ' ') 
       FROM jsonb_array_elements(instructions) AS instruction), 
      ''
    )
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
  ), 'C')
WHERE search_vector IS NULL;

-- Analyze tables for better query planning
ANALYZE recipes;
ANALYZE wishlist_items;
ANALYZE search_history;
ANALYZE users;