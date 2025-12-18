import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../src/db/connection';
import { recipes } from '../../../../src/db/schema';

export async function GET(request: NextRequest) {
  try {
    console.log('Debug: Checking recipes in database...');
    
    // Get all recipes from database
    const allRecipes = await db.select().from(recipes);
    
    console.log('Debug: Found recipes:', allRecipes.length);
    
    return NextResponse.json({
      success: true,
      count: allRecipes.length,
      recipes: allRecipes.map((recipe: any) => ({
        id: recipe.id,
        title: recipe.title,
        userId: recipe.userId,
        createdAt: recipe.createdAt,
        sourceType: recipe.sourceType
      })),
      environment: process.env.NODE_ENV,
      databaseUrl: process.env.NEON_DATABASE_URL ? 'Set (production)' : 'Not set',
      devDatabaseUrl: process.env.NEON_DEV_DATABASE_URL ? 'Set (dev)' : 'Not set'
    });
    
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: process.env.NODE_ENV,
      databaseUrl: process.env.NEON_DATABASE_URL ? 'Set (production)' : 'Not set',
      devDatabaseUrl: process.env.NEON_DEV_DATABASE_URL ? 'Set (dev)' : 'Not set'
    }, { status: 500 });
  }
}