'use client'

import React, { useState, useEffect } from 'react';
import { Package, Loader, ImageIcon, DollarSign } from 'lucide-react';
import { supabase } from '../../lib/supabase.js';

export default function ProductsDisplayPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch all products from Supabase
  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error);
        setError('Failed to load products. Please try again.');
        return;
      }

      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        {/* Header */}
        <div className="border-b border-gray-800 bg-black">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center space-x-3">
              <Package className="w-8 h-8 text-white" />
              <div>
                <h1 className="text-2xl font-bold">Our Products</h1>
                <p className="text-gray-400 text-sm">Discover our amazing collection</p>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center">
            <Loader className="w-16 h-16 mx-auto mb-4 text-white animate-spin" />
            <p className="text-gray-400 text-lg">Loading products...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white">
        {/* Header */}
        <div className="border-b border-gray-800 bg-black">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center space-x-3">
              <Package className="w-8 h-8 text-white" />
              <div>
                <h1 className="text-2xl font-bold">Our Products</h1>
                <p className="text-gray-400 text-sm">Discover our amazing collection</p>
              </div>
            </div>
          </div>
        </div>

        {/* Error State */}
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center">
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-8 max-w-md mx-auto">
              <Package className="w-16 h-16 mx-auto mb-4 text-red-400" />
              <h2 className="text-xl font-semibold text-red-300 mb-2">Error Loading Products</h2>
              <p className="text-red-400">{error}</p>
              <button
                onClick={fetchProducts}
                className="mt-4 bg-white text-black px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-black">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center space-x-3">
            <Package className="w-8 h-8 text-white" />
            <div>
              <h1 className="text-2xl font-bold">Our Products</h1>
              <p className="text-gray-400 text-sm">
                Discover our amazing collection of {products.length} products
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {products.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-12 max-w-md mx-auto">
              <Package className="w-20 h-20 mx-auto mb-6 text-gray-600" />
              <h2 className="text-2xl font-semibold text-gray-300 mb-4">No Products Yet</h2>
              <p className="text-gray-500">
                We're working on adding some amazing products. Check back soon!
              </p>
            </div>
          </div>
        ) : (
          /* Products Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden hover:border-gray-700 transition-colors group"
              >
                {/* Product Image */}
                <div className="aspect-square bg-gray-800 relative overflow-hidden">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      onError={(e) => {
                        console.log('Image failed to load:', product.image_url);
                        e.target.style.display = 'none';
                        e.target.nextElementSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className={`w-full h-full flex items-center justify-center ${product.image_url ? 'hidden' : ''}`}>
                    <ImageIcon className="w-16 h-16 text-gray-600" />
                  </div>
                  
                  {/* Price Badge */}
                  <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm border border-gray-700 rounded-lg px-3 py-1">
                    <div className="flex items-center space-x-1">
                      <DollarSign className="w-3 h-3 text-green-400" />
                      <span className="text-green-400 font-bold text-sm">
                        {parseFloat(product.price).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-white text-lg mb-2 line-clamp-2 group-hover:text-gray-200 transition-colors">
                    {product.name}
                  </h3>
                  
                  {product.description && (
                    <p className="text-gray-400 text-sm line-clamp-3 mb-3">
                      {product.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Added {new Date(product.created_at).toLocaleDateString()}</span>
                    <div className="flex items-center space-x-1">
                      <Package className="w-3 h-3" />
                      <span>In Stock</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats Footer */}
        {products.length > 0 && (
          <div className="mt-12 text-center">
            <div className="inline-flex items-center space-x-4 bg-gray-900 border border-gray-800 rounded-lg px-6 py-3">
              <div className="flex items-center space-x-2">
                <Package className="w-4 h-4 text-gray-400" />
                <span className="text-gray-400 text-sm">Total Products:</span>
                <span className="text-white font-semibold">{products.length}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}