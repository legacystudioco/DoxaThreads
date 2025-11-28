"use client";

import { useState } from "react";
import Image from "next/image";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

interface Product {
  id: string;
  title: string;
  slug: string;
  product_images?: Array<{
    url: string;
    alt?: string;
    is_primary?: boolean;
  }>;
}

interface ProductSortManagerProps {
  products: Product[];
  type: 'homepage' | 'store';
  onSave: () => void;
}

export default function ProductSortManager({ products, type, onSave }: ProductSortManagerProps) {
  const [items, setItems] = useState(products);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const newItems = Array.from(items);
    const [reorderedItem] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, reorderedItem);

    setItems(newItems);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      // Create array with product IDs and their new sort order
      const sortedProducts = items.map((product, index) => ({
        id: product.id,
        sort_order: index + 1 // 1-based indexing
      }));

      const response = await fetch('/api/admin/products/sort-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          products: sortedProducts,
          type
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save sort order');
      }

      setMessage({ type: 'success', text: 'Product order saved successfully!' });
      onSave();
    } catch (error) {
      console.error('Error saving sort order:', error);
      setMessage({ type: 'error', text: 'Failed to save product order' });
    } finally {
      setSaving(false);
    }
  };

  const getProductImage = (product: Product) => {
    const primaryImage = product.product_images?.find(img => img.is_primary);
    return primaryImage?.url || product.product_images?.[0]?.url || '/placeholder.jpg';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {type === 'homepage' ? 'Latest Drops Order' : 'Store Page Order'}
          </h2>
          <p className="text-neutral-600 text-sm mt-1">
            Drag and drop to reorder products. Changes are saved when you click "Save Order".
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Order'}
        </button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg border ${
            message.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="products">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-2"
            >
              {items.map((product, index) => (
                <Draggable key={product.id} draggableId={product.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`flex items-center gap-4 p-4 bg-white border-2 rounded-lg transition-shadow ${
                        snapshot.isDragging ? 'shadow-lg border-neutral-900' : 'border-neutral-200'
                      }`}
                    >
                      <div className="flex items-center justify-center w-8 h-8 bg-neutral-100 rounded font-bold text-sm">
                        {index + 1}
                      </div>
                      
                      <div className="relative w-16 h-16 bg-neutral-100 rounded overflow-hidden flex-shrink-0">
                        <Image
                          src={getProductImage(product)}
                          alt={product.title}
                          fill
                          className="object-cover"
                        />
                      </div>

                      <div className="flex-grow">
                        <h3 className="font-bold">{product.title}</h3>
                        <p className="text-sm text-neutral-600">{product.slug}</p>
                      </div>

                      <div className="flex items-center gap-2 text-neutral-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                        </svg>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
