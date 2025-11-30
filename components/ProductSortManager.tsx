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
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [tempPosition, setTempPosition] = useState<string>("");

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const newItems = Array.from(items);
    const [reorderedItem] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, reorderedItem);

    setItems(newItems);
  };

  const handleRandomize = async () => {
    // Only randomize for store page, not homepage
    if (type !== 'store') return;
    
    setSaving(true);
    setMessage(null);
    
    // Fisher-Yates shuffle algorithm
    const shuffled = [...items];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    setItems(shuffled);
    
    try {
      // Automatically save the randomized order
      const sortedProducts = shuffled.map((product, index) => ({
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
        throw new Error('Failed to save randomized order');
      }

      setMessage({ type: 'success', text: 'Products randomized and saved successfully!' });
      onSave();
    } catch (error) {
      console.error('Error saving randomized order:', error);
      setMessage({ type: 'error', text: 'Failed to save randomized order' });
      // Revert to original order on error
      setItems(products);
    } finally {
      setSaving(false);
    }
  };

  const handlePositionChange = (currentIndex: number, newPosition: string) => {
    const pos = parseInt(newPosition);
    
    // Validate the input
    if (isNaN(pos) || pos < 1 || pos > items.length) {
      setEditingIndex(null);
      setTempPosition("");
      return;
    }

    // Move the item to the new position
    const newItems = Array.from(items);
    const [movedItem] = newItems.splice(currentIndex, 1);
    newItems.splice(pos - 1, 0, movedItem);
    
    setItems(newItems);
    setEditingIndex(null);
    setTempPosition("");
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
            Drag and drop to reorder products, or click the number to jump to a specific position. Click "Save Order" to apply changes.
          </p>
        </div>
        <div className="flex gap-2">
          {type === 'store' && (
            <button
              onClick={handleRandomize}
              disabled={saving}
              className="btn-secondary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🎲 Randomize
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Order'}
          </button>
        </div>
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
                      <div 
                        className="flex items-center justify-center w-8 h-8 bg-neutral-100 rounded font-bold text-sm cursor-pointer hover:bg-neutral-200 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingIndex(index);
                          setTempPosition((index + 1).toString());
                        }}
                        title="Click to change position"
                      >
                        {editingIndex === index ? (
                          <input
                            type="number"
                            min="1"
                            max={items.length}
                            value={tempPosition}
                            onChange={(e) => setTempPosition(e.target.value)}
                            onBlur={() => handlePositionChange(index, tempPosition)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handlePositionChange(index, tempPosition);
                              } else if (e.key === 'Escape') {
                                setEditingIndex(null);
                                setTempPosition("");
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                            className="w-full h-full text-center bg-white border-2 border-black rounded font-bold text-sm focus:outline-none focus:ring-2 focus:ring-black"
                          />
                        ) : (
                          index + 1
                        )}
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
