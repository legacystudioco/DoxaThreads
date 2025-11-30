/**
 * Product sizing and material information display component
 * Shows size chart, measurements, and material features
 */

'use client';

import { useState } from 'react';
import {
  type ProductWithSizing,
  type SizeName,
  getMaterialDescription,
  getSizingInfo,
  formatMaterialFeatures,
  getAvailableSizes,
} from '@/lib/product-sizing';

interface ProductDetailsProps {
  product: ProductWithSizing;
}

export function ProductDetails({ product }: ProductDetailsProps) {
  const [activeTab, setActiveTab] = useState<'description' | 'sizing' | 'materials'>('description');
  
  const materialDescription = getMaterialDescription(product);
  const sizingInfo = getSizingInfo(product);
  const materialFeatures = materialDescription ? formatMaterialFeatures(materialDescription) : [];
  const availableSizes = getAvailableSizes(product);

  return (
    <div className="mt-8 border-t pt-8">
      {/* Tab Navigation */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('description')}
          className={`pb-2 px-1 font-medium transition-colors ${
            activeTab === 'description'
              ? 'border-b-2 border-neutral-900 text-neutral-900'
              : 'text-neutral-500 hover:text-neutral-700'
          }`}
        >
          Description
        </button>
        {sizingInfo && (
          <button
            onClick={() => setActiveTab('sizing')}
            className={`pb-2 px-1 font-medium transition-colors ${
              activeTab === 'sizing'
                ? 'border-b-2 border-neutral-900 text-neutral-900'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            Size Guide
          </button>
        )}
        {materialFeatures.length > 0 && (
          <button
            onClick={() => setActiveTab('materials')}
            className={`pb-2 px-1 font-medium transition-colors ${
              activeTab === 'materials'
                ? 'border-b-2 border-neutral-900 text-neutral-900'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            Materials
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className="py-4">
        {activeTab === 'description' && (
          <div className="prose prose-neutral max-w-none">
            <p className="text-neutral-700 leading-relaxed">
              {product.description || 'Premium quality apparel designed for comfort and style.'}
            </p>
          </div>
        )}

        {activeTab === 'sizing' && sizingInfo && (
          <div>
            {/* Size Chart */}
            <h3 className="font-semibold text-lg mb-4">Size Chart</h3>
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-neutral-100">
                    <th className="border border-neutral-300 px-4 py-2 text-left">Size</th>
                    <th className="border border-neutral-300 px-4 py-2 text-left">Chest Range</th>
                  </tr>
                </thead>
                <tbody>
                  {availableSizes.map((size) => (
                    <tr key={size} className="hover:bg-neutral-50">
                      <td className="border border-neutral-300 px-4 py-2 font-medium">{size}</td>
                      <td className="border border-neutral-300 px-4 py-2">
                        {sizingInfo.size_chart[size].chest_range}"
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Product Measurements */}
            <h3 className="font-semibold text-lg mb-4">Product Measurements (inches)</h3>
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-neutral-100">
                    <th className="border border-neutral-300 px-4 py-2 text-left">Size</th>
                    <th className="border border-neutral-300 px-4 py-2 text-left">Body Length</th>
                    <th className="border border-neutral-300 px-4 py-2 text-left">Chest</th>
                    <th className="border border-neutral-300 px-4 py-2 text-left">Sleeve Length</th>
                  </tr>
                </thead>
                <tbody>
                  {availableSizes.map((size) => {
                    const measurements = sizingInfo.measurements[size];
                    return (
                      <tr key={size} className="hover:bg-neutral-50">
                        <td className="border border-neutral-300 px-4 py-2 font-medium">{size}</td>
                        <td className="border border-neutral-300 px-4 py-2">{measurements.body_length}</td>
                        <td className="border border-neutral-300 px-4 py-2">{measurements.chest}</td>
                        <td className="border border-neutral-300 px-4 py-2">{measurements.sleeve_length}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Measurement Notes */}
            <div className="bg-neutral-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">How to Measure</h4>
              <ul className="space-y-2 text-sm text-neutral-700">
                <li>
                  <span className="font-medium">Body Length at Back:</span>{' '}
                  {sizingInfo.measurement_notes.body_length}
                </li>
                <li>
                  <span className="font-medium">Chest:</span>{' '}
                  {sizingInfo.measurement_notes.chest}
                </li>
                <li>
                  <span className="font-medium">Sleeve Length:</span>{' '}
                  {sizingInfo.measurement_notes.sleeve_length}
                </li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'materials' && materialFeatures.length > 0 && (
          <div>
            <h3 className="font-semibold text-lg mb-4">Materials & Features</h3>
            <ul className="space-y-2">
              {materialFeatures.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-neutral-400 mr-2">•</span>
                  <span className="text-neutral-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Compact size guide component for quick reference
 * Can be used in modals or tooltips
 */
export function CompactSizeGuide({ product }: ProductDetailsProps) {
  const sizingInfo = getSizingInfo(product);
  
  if (!sizingInfo) return null;

  const availableSizes = getAvailableSizes(product);

  return (
    <div className="max-w-md">
      <h3 className="font-semibold mb-3">Size Guide</h3>
      <div className="space-y-2 text-sm">
        {availableSizes.map((size) => (
          <div key={size} className="flex justify-between py-2 border-b border-neutral-200">
            <span className="font-medium">{size}</span>
            <span className="text-neutral-600">
              Chest: {sizingInfo.size_chart[size].chest_range}"
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
