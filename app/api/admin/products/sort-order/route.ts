import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { products, type } = await request.json();
    
    if (!products || !Array.isArray(products)) {
      return NextResponse.json(
        { error: "Invalid products array" },
        { status: 400 }
      );
    }

    if (!type || !['homepage', 'store'].includes(type)) {
      return NextResponse.json(
        { error: "Invalid type. Must be 'homepage' or 'store'" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    const sortField = type === 'homepage' ? 'homepage_sort_order' : 'store_sort_order';

    // Update each product's sort order
    const updates = products.map((product: { id: string; sort_order: number }) => 
      supabase
        .from('products')
        .update({ [sortField]: product.sort_order })
        .eq('id', product.id)
    );

    const results = await Promise.all(updates);
    
    // Check for errors
    const errors = results.filter(r => r.error);
    if (errors.length > 0) {
      console.error('Sort order update errors:', errors);
      return NextResponse.json(
        { error: "Failed to update some products", details: errors },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: `Updated sort order for ${products.length} products`
    });

  } catch (error) {
    console.error('Error updating product sort order:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
