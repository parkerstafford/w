'use client'

import React, { useState, useEffect } from 'react';
import { Plus, Package, Check, AlertCircle, Database, Loader, ShoppingCart, Phone, User, Calendar, Trash2, LogOut, Upload, X, Image, Edit2, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase.js';

export default function ProtectedAdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    images: []
  });
  const [imagePreviews, setImagePreviews] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editImages, setEditImages] = useState([]);
  const [editImagePreviews, setEditImagePreviews] = useState([]);

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

  // Get product images (handles both old and new format)
  const getProductImages = (product) => {
    if (product.image_urls && Array.isArray(product.image_urls) && product.image_urls.length > 0) {
      return product.image_urls;
    } else if (product.image_url) {
      return [product.image_url];
    }
    return [];
  };

  // Start editing a product
  const startEditingProduct = (product) => {
    setEditingProduct(product);
    const existingImages = getProductImages(product);
    setEditImagePreviews(existingImages);
    setEditImages([]);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingProduct(null);
    setEditImages([]);
    setEditImagePreviews([]);
  };

  // Handle adding more images to existing product
  const handleEditImageChange = (e) => {
    const files = Array.from(e.target.files);
    const currentTotal = editImagePreviews.length;
    
    // Check if adding these files would exceed 5 images
    if (currentTotal + files.length > 5) {
      setMessage({ type: 'error', text: 'You can have a maximum of 5 images per product.' });
      return;
    }

    const validFiles = [];
    const newPreviews = [];

    for (const file of files) {
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Each image must be less than 5MB.' });
        continue;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Please select valid image files only.' });
        continue;
      }

      validFiles.push(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews.push(e.target.result);
        if (newPreviews.length === validFiles.length) {
          setEditImagePreviews(prev => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    }

    if (validFiles.length > 0) {
      setEditImages(prev => [...prev, ...validFiles]);
    }
    
    // Reset file input
    const fileInput = document.getElementById('edit-image-upload');
    if (fileInput) fileInput.value = '';
  };

  // Remove image from edit preview
  const removeEditImage = (index) => {
    const existingImages = getProductImages(editingProduct);
    
    // If it's an existing image (not a new upload)
    if (index < existingImages.length) {
      setEditImagePreviews(prev => prev.filter((_, i) => i !== index));
    } else {
      // It's a new upload
      const newImageIndex = index - existingImages.length;
      setEditImages(prev => prev.filter((_, i) => i !== newImageIndex));
      setEditImagePreviews(prev => prev.filter((_, i) => i !== index));
    }
  };

  // Save edited product images
  const saveProductImages = async () => {
    if (!editingProduct) return;

    setLoading(true);
    try {
      const existingImages = getProductImages(editingProduct);
      let allImageUrls = editImagePreviews.filter(url => typeof url === 'string' && url.startsWith('http'));

      // Upload new images if any
      if (editImages.length > 0) {
        setUploadingImage(true);
        const newImageUrls = await uploadImages(editImages, editingProduct.id);
        allImageUrls = [...allImageUrls, ...newImageUrls];
        setUploadingImage(false);
      }

      // Update the product with new image URLs
      const { error: updateError } = await supabase
        .from('products')
        .update({ image_urls: allImageUrls })
        .eq('id', editingProduct.id);

      if (updateError) {
        console.error('Error updating product images:', updateError);
        setMessage({ type: 'error', text: 'Failed to update product images.' });
        return;
      }

      // Update local state
      setProducts(prev => prev.map(p => 
        p.id === editingProduct.id 
          ? { ...p, image_urls: allImageUrls } 
          : p
      ));

      setMessage({ type: 'success', text: 'Product images updated successfully!' });
      cancelEditing();
    } catch (error) {
      console.error('Error saving product images:', error);
      setMessage({ type: 'error', text: 'Failed to update product images.' });
    } finally {
      setLoading(false);
    }
  };

  // Handle image selection (multiple)
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Check if adding these files would exceed 5 images
    if (formData.images.length + files.length > 5) {
      setMessage({ type: 'error', text: 'You can upload a maximum of 5 images per product.' });
      return;
    }

    const validFiles = [];
    const newPreviews = [];

    for (const file of files) {
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Each image must be less than 5MB.' });
        continue;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Please select valid image files only.' });
        continue;
      }

      validFiles.push(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews.push(e.target.result);
        if (newPreviews.length === validFiles.length) {
          setImagePreviews(prev => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    }

    if (validFiles.length > 0) {
      setFormData(prev => ({ ...prev, images: [...prev.images, ...validFiles] }));
    }
    
    // Reset file input
    const fileInput = document.getElementById('image-upload');
    if (fileInput) fileInput.value = '';
  };

  // Remove selected image by index
  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Upload multiple images to Supabase Storage
  const uploadImages = async (files, productId) => {
    const imageUrls = [];
    const timestamp = Date.now();
    
    for (let i = 0; i < files.length; i++) {
      try {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${productId}_${timestamp}_${i}.${fileExt}`;
        const filePath = `products/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw uploadError;
        }

        // Get public URL
        const { data } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        imageUrls.push(data.publicUrl);
      } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
      }
    }
    
    return imageUrls;
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
      // First get the product to check if it has images
      const { data: product } = await supabase
        .from('products')
        .select('image_url, image_urls')
        .eq('id', productId)
        .single();

      // Delete the product from database
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) {
        console.error('Error deleting product:', error);
        setMessage({ type: 'error', text: 'Failed to delete product.' });
        return;
      }

      // Delete images from storage
      const imagesToDelete = [];
      
      // Handle old single image format
      if (product && product.image_url) {
        const imagePath = product.image_url.split('/').pop();
        imagesToDelete.push(`products/${imagePath}`);
      }
      
      // Handle new multiple images format
      if (product && product.image_urls && Array.isArray(product.image_urls)) {
        product.image_urls.forEach(url => {
          const imagePath = url.split('/').pop();
          imagesToDelete.push(`products/${imagePath}`);
        });
      }
      
      // Delete all images at once
      if (imagesToDelete.length > 0) {
        const { error: deleteError } = await supabase.storage
          .from('product-images')
          .remove(imagesToDelete);
        
        if (deleteError) {
          console.error('Error deleting images from storage:', deleteError);
        }
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
      // First, insert the product without images
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

      let imageUrls = [];

      // If there are images, upload them
      if (productData.images && productData.images.length > 0) {
        try {
          setUploadingImage(true);
          console.log('Starting image upload for product:', data.id);
          imageUrls = await uploadImages(productData.images, data.id);
          console.log('Images uploaded successfully, URLs:', imageUrls);
          
          // Update the product with the image URLs (stored as JSON array)
          const { error: updateError } = await supabase
            .from('products')
            .update({ image_urls: imageUrls })
            .eq('id', data.id);

          if (updateError) {
            console.error('Error updating product with images:', updateError);
            setMessage({ type: 'error', text: 'Product added but failed to save image URLs.' });
          } else {
            console.log('Product updated with image URLs successfully');
          }
        } catch (imageError) {
          console.error('Error uploading images:', imageError);
          setMessage({ type: 'error', text: 'Product added but image upload failed. You can try adding images later.' });
        } finally {
          setUploadingImage(false);
        }
      }

      // Add the new product to the list with image URLs
      const newProduct = { ...data, image_urls: imageUrls };
      setProducts(prev => [newProduct, ...prev.slice(0, 9)]);
      setMessage({ type: 'success', text: 'Product added successfully!' });
      
      // Reset form
      setFormData({
        name: '',
        price: '',
        description: '',
        images: []
      });
      setImagePreviews([]);
      
      // Reset file input
      const fileInput = document.getElementById('image-upload');
      if (fileInput) fileInput.value = '';
      
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

              {/* Image Upload Section */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Product Images <span className="text-gray-500 text-xs">(Max 5)</span>
                </label>
                
                {/* Image Previews */}
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-700"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full transition-colors"
                          disabled={loading}
                        >
                          <X className="w-3 h-3" />
                        </button>
                        {index === 0 && (
                          <div className="absolute bottom-1 left-1 bg-blue-600 text-white text-xs px-2 py-0.5 rounded">
                            Primary
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload Button */}
                {imagePreviews.length < 5 && (
                  <div className="relative">
                    <input
                      type="file"
                      id="image-upload"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={loading}
                    />
                    <div className="bg-gray-800 border border-gray-700 border-dashed rounded-lg p-6 text-center hover:border-gray-600 transition-colors">
                      <Upload className="w-6 h-6 mx-auto mb-2 text-gray-500" />
                      <p className="text-gray-400 text-sm">
                        {imagePreviews.length === 0 ? 'Click to upload images' : 'Add more images'}
                      </p>
                      <p className="text-gray-500 text-xs mt-1">
                        {imagePreviews.length}/5 images • Max 5MB each
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || uploadingImage || !formData.name || !formData.price}
                className="w-full bg-white text-black py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading || uploadingImage ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>{uploadingImage ? 'Uploading Images...' : 'Adding Product...'}</span>
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
                products.map((product) => {
                  const images = getProductImages(product);
                  return (
                    <div key={product.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                      <div className="flex space-x-3">
                        {/* Product Image(s) */}
                        <div className="flex-shrink-0">
                          {images.length > 0 ? (
                            <div className="relative">
                              <img
                                src={images[0]}
                                alt={product.name}
                                className="w-16 h-16 object-cover rounded-lg border border-gray-600"
                              />
                              {images.length > 1 && (
                                <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full font-medium">
                                  +{images.length - 1}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center border border-gray-600">
                              <Image className="w-6 h-6 text-gray-500" />
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h3 className="font-medium text-white truncate">{product.name}</h3>
                              <span className="text-lg font-bold text-green-400">
                                ${parseFloat(product.price).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex space-x-1">
                              <button
                                onClick={() => startEditingProduct(product)}
                                className="text-blue-400 hover:text-blue-300 transition-colors p-1"
                                title="Edit images"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteProduct(product.id)}
                                className="text-red-400 hover:text-red-300 transition-colors p-1"
                                title="Delete product"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
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
                      </div>
                    </div>
                  );
                })
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

      {/* Edit Product Images Modal */}
      {editingProduct && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={cancelEditing}
        >
          <div 
            className="bg-gray-900 border border-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
              <div>
                <h2 className="text-2xl font-bold text-white">Edit Product Images</h2>
                <p className="text-gray-400 text-sm mt-1">{editingProduct.name}</p>
              </div>
              <button
                onClick={cancelEditing}
                className="text-gray-400 hover:text-white transition-colors p-2"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="space-y-4">
                {/* Current Images */}
                {editImagePreviews.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-3">
                      Current Images <span className="text-gray-500 text-xs">({editImagePreviews.length}/5)</span>
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {editImagePreviews.map((preview, index) => (
                        <div key={index} className="relative">
                          <img
                            src={preview}
                            alt={`Image ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border border-gray-700"
                          />
                          <button
                            type="button"
                            onClick={() => removeEditImage(index)}
                            className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white p-1 rounded-full transition-colors"
                            disabled={loading}
                          >
                            <X className="w-3 h-3" />
                          </button>
                          {index === 0 && (
                            <div className="absolute bottom-1 left-1 bg-blue-600 text-white text-xs px-2 py-0.5 rounded">
                              Primary
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add More Images */}
                {editImagePreviews.length < 5 && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Add More Images</label>
                    <div className="relative">
                      <input
                        type="file"
                        id="edit-image-upload"
                        accept="image/*"
                        multiple
                        onChange={handleEditImageChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={loading}
                      />
                      <div className="bg-gray-800 border border-gray-700 border-dashed rounded-lg p-8 text-center hover:border-gray-600 transition-colors">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-500" />
                        <p className="text-gray-400 text-sm">Click to add more images</p>
                        <p className="text-gray-500 text-xs mt-1">
                          {editImagePreviews.length}/5 images • Max 5MB each
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={saveProductImages}
                    disabled={loading || uploadingImage}
                    className="flex-1 bg-white text-black py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {loading || uploadingImage ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        <span>{uploadingImage ? 'Uploading...' : 'Saving...'}</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={cancelEditing}
                    disabled={loading || uploadingImage}
                    className="bg-gray-800 text-white py-3 px-6 rounded-lg hover:bg-gray-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}