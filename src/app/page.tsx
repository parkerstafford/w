'use client'

import React, { useState, useEffect } from 'react';
import { Plus, Package, Check, AlertCircle, Database, Loader, ShoppingCart } from 'lucide-react';
import { supabase } from '../lib/supabase.js'; // Adjust path based on your structure

export default function ProductAddDashboard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: ''
  });

  // Fetch products from Supabase
  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10); // Limit to most recent 10 products

      if (error) {
        console.error('Error fetching products:', error);
        setMessage({ type: 'error', text: 'Failed to load products.' });
        return;
      }

      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setMessage({ type: 'error', text: 'Failed to load products.' });
    } finally {
      setInitialLoading(false);
    }
  };

  // Add product to Supabase database
  const addProductToDatabase = async (productData) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([{
          name: productData.name,
          price: parseFloat(productData.price),
          description: productData.description || null
        }])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        setMessage({ type: 'error', text: 'Failed to add product. Please try again.' });
        return;
      }

      // Add the new product to the beginning of the list
      setProducts(prev => [data, ...prev.slice(0, 9)]); // Keep only 10 most recent
      setMessage({ type: 'success', text: 'Product added successfully!' });
      
      // Reset form
      setFormData({
        name: '',
        price: '',
        description: '',
      });
      
    } catch (error) {
      console.error('Error adding product:', error);
      setMessage({ type: 'error', text: 'Failed to add product. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price) {
      setMessage({ type: 'error', text: 'Please fill in all required fields.' });
      return;
    }

    if (parseFloat(formData.price) <= 0) {
      setMessage({ type: 'error', text: 'Price must be greater than 0.' });
      return;
    }
    
    await addProductToDatabase(formData);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear any existing error messages when user starts typing
    if (message.type === 'error') {
      setMessage({ type: '', text: '' });
    }
  };

  // Load products on component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  // Clear success messages after 5 seconds
  useEffect(() => {
    if (message.text && message.type === 'success') {
      const timer = setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-black">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center space-x-3">
            <Database className="w-8 h-8 text-white" />
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-gray-400 text-sm">Add new products to your inventory</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Success/Error Message */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg border ${
            message.type === 'success' 
              ? 'bg-green-900/20 border-green-800 text-green-300' 
              : 'bg-red-900/20 border-red-800 text-red-300'
          }`}>
            <div className="flex items-center space-x-2">
              {message.type === 'success' ? (
                <Check className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span>{message.text}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Add Product Form */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Plus className="w-5 h-5" />
              <h2 className="text-xl font-semibold">Add New Product</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Product Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-white transition-colors"
                  placeholder="Enter product name"
                  disabled={loading}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Price ($) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  name="price"
                  step="0.01"
                  min="0.01"
                  value={formData.price}
                  onChange={handleInputChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-white transition-colors"
                  placeholder="0.00"
                  disabled={loading}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-white transition-colors resize-none"
                  placeholder="Enter product description (optional)"
                  disabled={loading}
                />
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !formData.name || !formData.price}
                className="w-full bg-white text-black py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Adding Product...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Add to Database</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Recent Products */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-6">
              <ShoppingCart className="w-5 h-5" />
              <h2 className="text-xl font-semibold">Recent Products</h2>
              <span className="bg-gray-800 text-xs px-2 py-1 rounded-full">
                {products.length}
              </span>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {initialLoading ? (
                <div className="text-center py-8">
                  <Loader className="w-12 h-12 mx-auto mb-3 text-gray-600 animate-spin" />
                  <p className="text-gray-500">Loading products...</p>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                  <p>No products yet</p>
                  <p className="text-sm text-gray-600 mt-1">Add your first product to get started</p>
                </div>
              ) : (
                products.map((product) => (
                  <div key={product.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-white">{product.name}</h3>
                      <span className="text-lg font-bold text-green-400">
                        ${parseFloat(product.price).toFixed(2)}
                      </span>
                    </div>
                  
                    {product.description && (
                      <p className="text-sm text-gray-400 mb-2 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      Added {new Date(product.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}