'use client'

import React, { useState, useEffect } from 'react';
import { Package, Loader, ImageIcon, DollarSign, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { supabase } from '../../lib/supabase.js';

export default function ProductsDisplayPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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

  // Get all images for a product (handles both old and new format)
  const getProductImages = (product) => {
    if (product.image_urls && Array.isArray(product.image_urls) && product.image_urls.length > 0) {
      return product.image_urls;
    } else if (product.image_url) {
      return [product.image_url];
    }
    return [];
  };

  // Open product modal
  const openProductModal = (product) => {
    setSelectedProduct(product);
    setCurrentImageIndex(0);
  };

  // Close product modal
  const closeProductModal = () => {
    setSelectedProduct(null);
    setCurrentImageIndex(0);
  };

  // Navigate to next image
  const nextImage = () => {
    const images = getProductImages(selectedProduct);
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  // Navigate to previous image
  const prevImage = () => {
    const images = getProductImages(selectedProduct);
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedProduct) return;
      
      if (e.key === 'ArrowRight') nextImage();
      else if (e.key === 'ArrowLeft') prevImage();
      else if (e.key === 'Escape') closeProductModal();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedProduct]);

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
            {products.map((product) => {
              const images = getProductImages(product);
              return (
                <div
                  key={product.id}
                  className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden hover:border-gray-700 transition-colors group cursor-pointer"
                  onClick={() => openProductModal(product)}
                >
                  {/* Product Image */}
                  <div className="aspect-square bg-gray-800 relative overflow-hidden">
                    {images.length > 0 ? (
                      <>
                        <img
                          src={images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextElementSibling.style.display = 'flex';
                          }}
                        />
                        <div className="hidden w-full h-full items-center justify-center">
                          <ImageIcon className="w-16 h-16 text-gray-600" />
                        </div>
                        
                        {/* Image Count Badge */}
                        {images.length > 1 && (
                          <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm border border-gray-700 rounded-lg px-2 py-1">
                            <div className="flex items-center space-x-1">
                              <ImageIcon className="w-3 h-3 text-white" />
                              <span className="text-white font-medium text-xs">
                                {images.length}
                              </span>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-16 h-16 text-gray-600" />
                      </div>
                    )}
                    
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
              );
            })}
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

      {/* Product Modal with Image Gallery */}
      {selectedProduct && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={closeProductModal}
        >
          <div 
            className="bg-gray-900 border border-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
              <h2 className="text-2xl font-bold text-white">{selectedProduct.name}</h2>
              <button
                onClick={closeProductModal}
                className="text-gray-400 hover:text-white transition-colors p-2"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Image Gallery */}
            <div className="p-6">
              {(() => {
                const images = getProductImages(selectedProduct);
                
                if (images.length === 0) {
                  return (
                    <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
                      <ImageIcon className="w-20 h-20 text-gray-600" />
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    {/* Main Image */}
                    <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden">
                      <img
                        src={images[currentImageIndex]}
                        alt={`${selectedProduct.name} - Image ${currentImageIndex + 1}`}
                        className="w-full h-full object-contain"
                      />
                      
                      {/* Navigation Arrows */}
                      {images.length > 1 && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              prevImage();
                            }}
                            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/80 hover:bg-black text-white p-3 rounded-full transition-colors"
                          >
                            <ChevronLeft className="w-6 h-6" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              nextImage();
                            }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/80 hover:bg-black text-white p-3 rounded-full transition-colors"
                          >
                            <ChevronRight className="w-6 h-6" />
                          </button>
                          
                          {/* Image Counter */}
                          <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-sm">
                            {currentImageIndex + 1} / {images.length}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Thumbnail Strip */}
                    {images.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {images.map((image, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                              index === currentImageIndex
                                ? 'border-white scale-105'
                                : 'border-gray-700 hover:border-gray-500'
                            }`}
                          >
                            <img
                              src={image}
                              alt={`Thumbnail ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Product Details */}
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-6 h-6 text-green-400" />
                    <span className="text-3xl font-bold text-green-400">
                      {parseFloat(selectedProduct.price).toFixed(2)}
                    </span>
                  </div>
                  <div className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
                    In Stock
                  </div>
                </div>

                {selectedProduct.description && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
                    <p className="text-gray-400 leading-relaxed">
                      {selectedProduct.description}
                    </p>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-800 text-sm text-gray-500">
                  Added on {new Date(selectedProduct.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}