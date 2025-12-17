'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Recipe } from '@/db';

interface RecipeEditorProps {
  recipe: Recipe;
  onUpdate: (recipe: Recipe) => void;
  onDelete: () => void;
}

interface Ingredient {
  name: string;
  quantity?: number;
  unit?: string;
  notes?: string;
}

interface Instruction {
  stepNumber: number;
  description: string;
  duration?: number;
}

export function RecipeEditor({ recipe, onUpdate, onDelete }: RecipeEditorProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [isDeleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'ingredients' | 'instructions'>('ingredients');
  
  // Form state
  const [title, setTitle] = useState(recipe.title);
  const [description, setDescription] = useState(recipe.description || '');
  const [ingredients, setIngredients] = useState<Ingredient[]>(recipe.ingredients);
  const [instructions, setInstructions] = useState<Instruction[]>(recipe.instructions);
  const [cookingTime, setCookingTime] = useState(recipe.cookingTime || 0);
  const [prepTime, setPrepTime] = useState(recipe.prepTime || 0);
  const [servings, setServings] = useState(recipe.servings || 4);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | ''>(recipe.difficulty || '');
  const [categories, setCategories] = useState<string[]>(recipe.categories);
  const [tags, setTags] = useState<string[]>(recipe.tags);
  const [personalNotes, setPersonalNotes] = useState(recipe.personalNotes || '');
  
  // Scaling state
  const [scalingServings, setScalingServings] = useState(recipe.servings || 4);
  const [isScaling, setIsScaling] = useState(false);

  // Reset form when recipe changes
  useEffect(() => {
    setTitle(recipe.title);
    setDescription(recipe.description || '');
    setIngredients(recipe.ingredients);
    setInstructions(recipe.instructions);
    setCookingTime(recipe.cookingTime || 0);
    setPrepTime(recipe.prepTime || 0);
    setServings(recipe.servings || 4);
    setDifficulty(recipe.difficulty || '');
    setCategories(recipe.categories);
    setTags(recipe.tags);
    setPersonalNotes(recipe.personalNotes || '');
    setScalingServings(recipe.servings || 4);
  }, [recipe]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData = {
        title,
        description: description || undefined,
        ingredients,
        instructions,
        cookingTime: cookingTime || undefined,
        prepTime: prepTime || undefined,
        servings: servings || undefined,
        difficulty: difficulty || undefined,
        categories,
        tags,
        personalNotes: personalNotes || undefined,
      };

      const response = await fetch(`/api/recipes/${recipe.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error('Failed to update recipe');
      }

      const data = await response.json();
      onUpdate(data.recipe);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating recipe:', error);
      alert('Failed to update recipe. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/recipes/${recipe.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete recipe');
      }

      onDelete();
    } catch (error) {
      console.error('Error deleting recipe:', error);
      alert('Failed to delete recipe. Please try again.');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleScale = async () => {
    if (scalingServings === servings) return;
    
    setIsScaling(true);
    try {
      const response = await fetch(`/api/recipes/${recipe.id}/scale`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newServings: scalingServings }),
      });

      if (!response.ok) {
        throw new Error('Failed to scale recipe');
      }

      const data = await response.json();
      onUpdate(data.recipe);
    } catch (error) {
      console.error('Error scaling recipe:', error);
      alert('Failed to scale recipe. Please try again.');
    } finally {
      setIsScaling(false);
    }
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { name: '', quantity: undefined, unit: '', notes: '' }]);
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: string | number) => {
    const updated = [...ingredients];
    if (field === 'quantity') {
      updated[index][field] = value as number;
    } else {
      updated[index][field] = value as string;
    }
    setIngredients(updated);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const addInstruction = () => {
    const nextStep = Math.max(...instructions.map(i => i.stepNumber), 0) + 1;
    setInstructions([...instructions, { stepNumber: nextStep, description: '', duration: undefined }]);
  };

  const updateInstruction = (index: number, field: keyof Instruction, value: string | number) => {
    const updated = [...instructions];
    if (field === 'stepNumber' || field === 'duration') {
      updated[index][field] = value as number;
    } else {
      updated[index][field] = value as string;
    }
    setInstructions(updated);
  };

  const removeInstruction = (index: number) => {
    setInstructions(instructions.filter((_, i) => i !== index));
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'hard': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getSourceIcon = (sourceType: string) => {
    switch (sourceType) {
      case 'web': return '🌐';
      case 'video': return '📹';
      case 'document': return '📄';
      case 'manual': return '✍️';
      default: return '📝';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start justify-between mb-4 gap-4">
          <div className="flex-1 w-full">
            {isEditing ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 w-full border-none outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 rounded px-2 py-1 bg-transparent"
                placeholder="Recipe title"
                aria-label="Recipe title"
              />
            ) : (
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">{recipe.title}</h1>
            )}
            
            {isEditing ? (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-2 w-full text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                placeholder="Recipe description"
                rows={2}
                aria-label="Recipe description"
              />
            ) : (
              recipe.description && (
                <p className="mt-2 text-gray-600 dark:text-gray-400">{recipe.description}</p>
              )
            )}
          </div>
          
          <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="touch-target px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                aria-label="Edit recipe"
              >
                Edit
              </button>
            )}
            
            {isEditing && (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="touch-target px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  aria-label="Cancel editing"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="touch-target px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label={isSaving ? 'Saving recipe' : 'Save recipe'}
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </>
            )}
            
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="touch-target px-4 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/30 rounded-lg transition-colors"
              aria-label="Delete recipe"
            >
              Delete
            </button>
          </div>
        </div>

        {/* Recipe metadata */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label htmlFor="servings" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Servings</label>
            {isEditing ? (
              <input
                id="servings"
                type="number"
                value={servings}
                onChange={(e) => setServings(parseInt(e.target.value) || 0)}
                className="input-field"
                min="1"
                aria-label="Number of servings"
              />
            ) : (
              <p className="text-gray-900 dark:text-gray-100 py-2">{recipe.servings || 'Not specified'}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="prepTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prep Time</label>
            {isEditing ? (
              <input
                id="prepTime"
                type="number"
                value={prepTime}
                onChange={(e) => setPrepTime(parseInt(e.target.value) || 0)}
                className="input-field"
                placeholder="minutes"
                aria-label="Preparation time in minutes"
              />
            ) : (
              <p className="text-gray-900 dark:text-gray-100 py-2">{recipe.prepTime ? formatTime(recipe.prepTime) : 'Not specified'}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="cookTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cook Time</label>
            {isEditing ? (
              <input
                id="cookTime"
                type="number"
                value={cookingTime}
                onChange={(e) => setCookingTime(parseInt(e.target.value) || 0)}
                className="input-field"
                placeholder="minutes"
                aria-label="Cooking time in minutes"
              />
            ) : (
              <p className="text-gray-900 dark:text-gray-100 py-2">{recipe.cookingTime ? formatTime(recipe.cookingTime) : 'Not specified'}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Difficulty</label>
            {isEditing ? (
              <select
                id="difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard' | '')}
                className="input-field"
                aria-label="Recipe difficulty level"
              >
                <option value="">Select difficulty</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            ) : (
              <div className="py-2">
                {recipe.difficulty ? (
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(recipe.difficulty)}`}>
                    {recipe.difficulty}
                  </span>
                ) : (
                  <p className="text-gray-900 dark:text-gray-100">Not specified</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Source info */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center">
              <span className="mr-1" aria-hidden="true">{getSourceIcon(recipe.sourceType)}</span>
              <span className="sr-only">Source type: </span>
              Source: {recipe.sourceType}
            </span>
            {recipe.sourceUrl && (
              <a
                href={recipe.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline touch-target"
              >
                View original
              </a>
            )}
          </div>
          <div>
            <span className="sr-only">Last updated: </span>
            Updated: {new Date(recipe.updatedAt).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Recipe scaling */}
      {!isEditing && recipe.servings && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Scale Recipe</h3>
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <div className="w-full sm:w-auto">
              <label htmlFor="scalingServings" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Servings (currently {recipe.servings})
              </label>
              <input
                id="scalingServings"
                type="number"
                value={scalingServings}
                onChange={(e) => setScalingServings(parseInt(e.target.value) || 1)}
                className="w-full sm:w-24 input-field"
                min="1"
                aria-label="New number of servings"
              />
            </div>
            <button
              onClick={handleScale}
              disabled={isScaling || scalingServings === recipe.servings}
              className="touch-target w-full sm:w-auto px-4 py-2 bg-green-600 text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={isScaling ? 'Scaling recipe' : 'Scale recipe to new serving size'}
            >
              {isScaling ? 'Scaling...' : 'Scale Recipe'}
            </button>
          </div>
        </div>
      )}

      {/* Recipe content tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        {/* Tab navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <nav className="flex space-x-4 sm:space-x-8 px-4 sm:px-6" role="tablist">
            <button
              onClick={() => setActiveTab('ingredients')}
              role="tab"
              aria-selected={activeTab === 'ingredients'}
              aria-controls="ingredients-panel"
              className={`touch-target py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'ingredients'
                  ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
              }`}
            >
              Ingredients ({ingredients.length})
            </button>
            <button
              onClick={() => setActiveTab('instructions')}
              role="tab"
              aria-selected={activeTab === 'instructions'}
              aria-controls="instructions-panel"
              className={`touch-target py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'instructions'
                  ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
              }`}
            >
              Instructions ({instructions.length})
            </button>
          </nav>
        </div>

        {/* Tab content */}
        <div className="p-4 sm:p-6">
          {activeTab === 'ingredients' && (
            <div id="ingredients-panel" role="tabpanel" aria-labelledby="ingredients-tab">
              <div className="space-y-3">
                {ingredients.map((ingredient, index) => (
                  <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    {isEditing ? (
                      <>
                        <div className="flex gap-2 w-full sm:w-auto">
                          <input
                            type="number"
                            value={ingredient.quantity || ''}
                            onChange={(e) => updateIngredient(index, 'quantity', parseFloat(e.target.value) || 0)}
                            className="w-20 border border-gray-300 dark:border-gray-600 rounded px-2 py-2 text-sm dark:bg-gray-700 dark:text-gray-100"
                            placeholder="Qty"
                            aria-label={`Ingredient ${index + 1} quantity`}
                          />
                          <input
                            type="text"
                            value={ingredient.unit || ''}
                            onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                            className="w-20 border border-gray-300 dark:border-gray-600 rounded px-2 py-2 text-sm dark:bg-gray-700 dark:text-gray-100"
                            placeholder="Unit"
                            aria-label={`Ingredient ${index + 1} unit`}
                          />
                        </div>
                        <input
                          type="text"
                          value={ingredient.name}
                          onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                          className="flex-1 w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-2 text-sm dark:bg-gray-700 dark:text-gray-100"
                          placeholder="Ingredient name"
                          aria-label={`Ingredient ${index + 1} name`}
                        />
                        <input
                          type="text"
                          value={ingredient.notes || ''}
                          onChange={(e) => updateIngredient(index, 'notes', e.target.value)}
                          className="w-full sm:w-32 border border-gray-300 dark:border-gray-600 rounded px-2 py-2 text-sm dark:bg-gray-700 dark:text-gray-100"
                          placeholder="Notes"
                          aria-label={`Ingredient ${index + 1} notes`}
                        />
                        <button
                          onClick={() => removeIngredient(index)}
                          className="touch-target text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1"
                          aria-label={`Remove ingredient ${index + 1}`}
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center flex-wrap gap-2 w-full">
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {ingredient.quantity && ingredient.unit
                            ? `${ingredient.quantity} ${ingredient.unit}`
                            : ingredient.quantity
                            ? ingredient.quantity
                            : ''}
                        </span>
                        <span className="text-gray-900 dark:text-gray-100">{ingredient.name}</span>
                        {ingredient.notes && (
                          <span className="text-sm text-gray-500 dark:text-gray-400 italic">({ingredient.notes})</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {isEditing && (
                <button
                  onClick={addIngredient}
                  className="touch-target mt-4 px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                  aria-label="Add new ingredient"
                >
                  + Add Ingredient
                </button>
              )}
            </div>
          )}

          {activeTab === 'instructions' && (
            <div id="instructions-panel" role="tabpanel" aria-labelledby="instructions-tab">
              <div className="space-y-4">
                {instructions
                  .sort((a, b) => a.stepNumber - b.stepNumber)
                  .map((instruction, index) => (
                    <div key={index} className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      {isEditing ? (
                        <>
                          <div className="flex gap-2 w-full sm:w-auto">
                            <input
                              type="number"
                              value={instruction.stepNumber}
                              onChange={(e) => updateInstruction(index, 'stepNumber', parseInt(e.target.value) || 1)}
                              className="w-16 border border-gray-300 dark:border-gray-600 rounded px-2 py-2 text-sm dark:bg-gray-700 dark:text-gray-100"
                              min="1"
                              aria-label={`Step ${index + 1} number`}
                            />
                            <input
                              type="number"
                              value={instruction.duration || ''}
                              onChange={(e) => updateInstruction(index, 'duration', parseInt(e.target.value) || 0)}
                              className="w-20 border border-gray-300 dark:border-gray-600 rounded px-2 py-2 text-sm dark:bg-gray-700 dark:text-gray-100"
                              placeholder="Min"
                              aria-label={`Step ${index + 1} duration in minutes`}
                            />
                          </div>
                          <textarea
                            value={instruction.description}
                            onChange={(e) => updateInstruction(index, 'description', e.target.value)}
                            className="flex-1 w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100"
                            placeholder="Instruction description"
                            rows={2}
                            aria-label={`Step ${index + 1} description`}
                          />
                          <button
                            onClick={() => removeInstruction(index)}
                            className="touch-target text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1"
                            aria-label={`Remove step ${index + 1}`}
                          >
                            ✕
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-600 dark:bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                            {instruction.stepNumber}
                          </div>
                          <div className="flex-1">
                            <p className="text-gray-900 dark:text-gray-100">{instruction.description}</p>
                            {instruction.duration && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                <span className="sr-only">Duration: </span>
                                Duration: {formatTime(instruction.duration)}
                              </p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
              </div>
              
              {isEditing && (
                <button
                  onClick={addInstruction}
                  className="touch-target mt-4 px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                  aria-label="Add new instruction step"
                >
                  + Add Instruction
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Personal Notes */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mt-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Personal Notes</h3>
        {isEditing ? (
          <textarea
            value={personalNotes}
            onChange={(e) => setPersonalNotes(e.target.value)}
            className="input-field"
            placeholder="Add your personal notes, modifications, or tips for this recipe..."
            rows={4}
            aria-label="Personal notes for this recipe"
          />
        ) : (
          <div>
            {recipe.personalNotes ? (
              <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{recipe.personalNotes}</p>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 italic">No personal notes added yet.</p>
            )}
          </div>
        )}
      </div>

      {/* Categories and Tags */}
      {(recipe.categories.length > 0 || recipe.tags.length > 0) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Categories & Tags</h3>
          
          {recipe.categories.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Categories</h4>
              <div className="flex flex-wrap gap-2">
                {recipe.categories.map((category: string) => (
                  <span
                    key={category}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {recipe.tags.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {recipe.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-xl">
            <h3 id="delete-dialog-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Delete Recipe</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete "{recipe.title}"? This action cannot be undone.
            </p>
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="touch-target px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="Cancel deletion"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="touch-target px-4 py-2 bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={isDeleting ? 'Deleting recipe' : 'Confirm delete recipe'}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}