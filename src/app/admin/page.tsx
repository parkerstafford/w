'use client'

import React, { useState, useEffect } from 'react';
import { Plus, Package, Check, AlertCircle, Database, Loader, ShoppingCart, Phone, User, Calendar, Trash2, LogOut } from 'lucide-react';
import { supabase } from '../../lib/supabase.js';

export default function ProtectedAdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: ''
  });

  // Check authentication on component mount
  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = () => {
    const isLoggedIn = localStorage.getItem('admin_logged_in') === 'true';
    const loginTime = localStorage.getItem('admin_login_time');
    
    // Check if login is recent (24 hours)
    if (isLoggedIn && loginTime) {
      const now = new Date().getTime();
      const loginTimestamp = parseInt(loginTime);
      const twentyFourHours = 24 * 60 * 60 * 1000;
      
      if (now - loginTimestamp < twentyFourHours) {
        setIsAuthenticated(true);
        fetchProducts();
        fetchOrders();
      } else {
        // Session expired
        handleLogout();
      }
    } else {
      // Not logged in, redirect to login
      window.location.href = '/admin/login';
    }
    
    setCheckingAuth(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_logged_in');
    localStorage.removeItem('admin_login_time');
    window.location.href = '/admin/login';
  };

  // Fetch products from Supabase
  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

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

  // Fetch orders from Supabase
  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('is_completed', false)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching orders:', error);
        setMessage({ type: 'error', text: 'Failed to load orders.' });
        return;
      }

      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setMessage({ type: 'error', text: 'Failed to load orders.' });
    } finally {
      setOrdersLoading(false);
    }
  };

  // Delete product from Supabase
  const deleteProduct = async (productId) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) {
        console.error('Error deleting product:', error);
        setMessage({ type: 'error', text: 'Failed to delete product.' });
        return;
      }

      setProducts(prev => prev.filter(product => product.id !== productId));
      setMessage({ type: 'success', text: 'Product deleted successfully!' });
    } catch (error) {
      console.error('Error deleting product:', error);
      setMessage({ type: 'error', text: 'Failed to delete product.' });
    }
  };

  // Mark order as completed
  const markOrderCompleted = async (orderId) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ is_completed: true })
        .eq('id', orderId);

      if (error) {
        console.error('Error updating order:', error);
        setMessage({ type: 'error', text: 'Failed to mark order as completed.' });
        return;
      }

      setOrders(prev => prev.filter(order => order.id !== orderId));
      setMessage({ type: 'success', text: 'Order marked as completed and removed!' });
    } catch (error) {
      console.error('Error updating order:', error);
      setMessage({ type: 'error', text: 'Failed to mark order as completed.' });
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

      setProducts(prev => [data, ...prev.slice(0, 9)]);
      setMessage({ type: 'success', text: 'Product added successfully!' });
      
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
    if (message.type === 'error') {
      setMessage({ type: '', text: '' });
    }
  };

  // Clear success messages after 5 seconds
  useEffect(() => {
    if (message.text && message.type === 'success') {
      const timer = setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Group orders by customer for better display
  const groupOrdersByCustomer = (orders) => {
    const grouped = {};
    orders.forEach(order => {
      const key = `${order.customer_name}-${order.phone_number}-${new Date(order.created_at).toDateString()}`;
      if (!grouped[key]) {
        grouped[key] = {
          customer_name: order.customer_name,
          phone_number: order.phone_number,
          created_at: order.created_at,
          orders: [],
          total: 0,
          allCompleted: true
        };
      }
      grouped[key].orders.push(order);
      grouped[key].total += parseFloat(order.total_price);
      if (!order.is_completed) {
        grouped[key].allCompleted = false;
      }
    });
    return Object.values(grouped);
  };

  const groupedOrders = groupOrdersByCustomer(orders);
  const pendingOrders = orders.filter(order => !order.is_completed);

  // Show loading spinner while checking authentication
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 mx-auto mb-4 text-white animate-spin" />
          <p className="text-gray-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, this component won't render (redirected to login)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-black">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Database className="w-8 h-8 text-white" />
              <div>
                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                <p className="text-gray-400 text-sm">Manage your products and orders</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
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

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
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

          {/* Products */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Package className="w-5 h-5" />
              <h2 className="text-xl font-semibold">Products</h2>
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
                      <div className="flex-1">
                        <h3 className="font-medium text-white">{product.name}</h3>
                        <span className="text-lg font-bold text-green-400">
                          ${parseFloat(product.price).toFixed(2)}
                        </span>
                      </div>
                      <button
                        onClick={() => deleteProduct(product.id)}
                        className="text-red-400 hover:text-red-300 transition-colors p-1"
                        title="Delete product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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

          {/* Orders Management */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-6">
              <ShoppingCart className="w-5 h-5" />
              <h2 className="text-xl font-semibold">Pending Orders</h2>
              <span className="bg-gray-800 text-xs px-2 py-1 rounded-full">
                {pendingOrders.length}
              </span>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {ordersLoading ? (
                <div className="text-center py-8">
                  <Loader className="w-12 h-12 mx-auto mb-3 text-gray-600 animate-spin" />
                  <p className="text-gray-500">Loading orders...</p>
                </div>
              ) : groupedOrders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                  <p>No pending orders</p>
                  <p className="text-sm text-gray-600 mt-1">Completed orders are automatically removed</p>
                </div>
              ) : (
                groupedOrders.map((group, index) => (
                  <div key={index} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    {/* Customer Info */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <h3 className="font-medium text-white">{group.customer_name}</h3>
                      </div>
                      <span className="text-lg font-bold text-green-400">
                        ${group.total.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center space-x-4 mb-3 text-sm text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Phone className="w-3 h-3" />
                        <span>{group.phone_number}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(group.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-2">
                      {group.orders.map((order) => (
                        <div key={order.id} className="flex items-center justify-between bg-gray-700 rounded p-2">
                          <div className="flex-1">
                            <span className="text-white text-sm">{order.product_name}</span>
                            <span className="text-gray-400 text-xs ml-2">x{order.quantity}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-green-400 text-sm font-medium">
                              ${parseFloat(order.total_price).toFixed(2)}
                            </span>
                            <button
                              onClick={() => markOrderCompleted(order.id)}
                              className="bg-green-600 hover:bg-green-700 text-white p-1 rounded transition-colors"
                              title="Mark as completed"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
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