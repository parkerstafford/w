'use client'

import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Check, AlertCircle, Database, Loader, Package, Plus, Minus, X, CreditCard } from 'lucide-react';
import { supabase } from '../../lib/supabase';

// PayPal configuration - replace with your actual client ID
const PAYPAL_CLIENT_ID = "AasmG6SWkXwXb7MhRPWLg317rc34aU6X5AVR2y3xtQogXQmu5YpWQpJOheWNtb3504v29A4TKCUp6xwe";

export default function OrderPage() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(true);
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [customerInfo, setCustomerInfo] = useState({
    customerName: '',
    phoneNumber: ''
  });
  const [showPayment, setShowPayment] = useState(false);
  const paypalRef = useRef();

  // Load PayPal SDK
  useEffect(() => {
    const loadPayPalScript = () => {
      if (window.paypal) {
        setPaypalLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&intent=capture&enable-funding=venmo&disable-funding=credit,card`;
      script.async = true;
      script.onload = () => {
        setPaypalLoaded(true);
      };
      script.onerror = () => {
        setMessage({ type: 'error', text: 'Failed to load PayPal. Please refresh the page.' });
      };
      document.body.appendChild(script);
    };

    loadPayPalScript();
  }, []);

  // Initialize PayPal buttons when paypal is loaded and payment is shown
  useEffect(() => {
    if (paypalLoaded && showPayment && window.paypal && paypalRef.current) {
      // Clear any existing buttons
      paypalRef.current.innerHTML = '';
      
      const totalAmount = getTotalPrice().toFixed(2);
      
      window.paypal.Buttons({
        createOrder: (data, actions) => {
          return actions.order.create({
            purchase_units: [{
              amount: {
                value: totalAmount,
                currency_code: 'USD'
              },
              description: `Order for ${cart.length} item${cart.length !== 1 ? 's' : ''}`,
              custom_id: `order_${Date.now()}`
            }]
          });
        },
        onApprove: async (data, actions) => {
          try {
            setLoading(true);
            const details = await actions.order.capture();
            
            // Payment successful, now place the order
            await handleSuccessfulPayment(details, 'paypal');
            
          } catch (error) {
            console.error('PayPal payment capture error:', error);
            setMessage({ type: 'error', text: 'Payment processing failed. Please try again.' });
            setLoading(false);
          }
        },
        onError: (err) => {
          console.error('PayPal error:', err);
          setMessage({ type: 'error', text: 'Payment failed. Please try again.' });
          setLoading(false);
        },
        onCancel: (data) => {
          setMessage({ type: 'error', text: 'Payment was cancelled.' });
          setLoading(false);
        },
        style: {
          layout: 'vertical',
          color: 'blue',
          shape: 'rect',
          height: 40
        }
      }).render(paypalRef.current);
    }
  }, [paypalLoaded, showPayment, cart]);

  // Handle successful payment and place order
  const handleSuccessfulPayment = async (paymentDetails, paymentMethod = 'paypal') => {
    try {
      // Create order records for each item in cart
      const orderPromises = cart.map(item => {
        const unitPrice = parseFloat(item.price);
        const totalPrice = unitPrice * item.quantity;

        return supabase
          .from('orders')
          .insert([{
            customer_name: customerInfo.customerName,
            phone_number: customerInfo.phoneNumber,
            product_name: item.name,
            product_id: item.id,
            quantity: item.quantity,
            unit_price: unitPrice,
            total_price: totalPrice,
            is_completed: false,
            payment_id: paymentDetails.id,
            payment_status: paymentDetails.status,
            payment_amount: parseFloat(getTotalPrice().toFixed(2)),
            payment_method: paymentMethod
          }]);
      });

      const results = await Promise.all(orderPromises);
      
      // Check for any errors
      const hasErrors = results.some(result => result.error);
      if (hasErrors) {
        console.error('Some orders failed to submit');
        setMessage({ type: 'error', text: 'Payment successful but order recording failed. Please contact support.' });
        return;
      }

      setMessage({ 
        type: 'success', 
        text: `Payment successful! Order placed for ${cart.length} item${cart.length > 1 ? 's' : ''}. We will contact you soon.` 
      });
      
      // Reset everything
      setCart([]);
      setCustomerInfo({
        customerName: '',
        phoneNumber: ''
      });
      setShowPayment(false);
      
    } catch (error) {
      console.error('Error placing orders after payment:', error);
      setMessage({ type: 'error', text: 'Payment successful but order recording failed. Please contact support with payment ID: ' + paymentDetails.id });
    } finally {
      setLoading(false);
    }
  };

  // Fetch products from Supabase
  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching products:', error);
        setMessage({ type: 'error', text: 'Failed to load products.' });
        return;
      }

      setProducts(data as any || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setMessage({ type: 'error', text: 'Failed to load products.' });
    } finally {
      setProductsLoading(false);
    }
  };

  // Add item to cart
  const addToCart = (product) => {
    setCart(prev => {
      const existingItem = prev.find(item => item.id === product.id);
      if (existingItem) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prev, { ...product, quantity: 1 }];
      }
    });
    
    // Hide payment section when cart is modified
    setShowPayment(false);
  };

  // Remove item from cart
  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
    setShowPayment(false);
  };

  // Update quantity in cart
  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
    setShowPayment(false);
  };

  // Calculate total price
  const getTotalPrice = () => {
    return cart.reduce((total, item) => {
      return total + (parseFloat(item.price) * item.quantity);
    }, 0);
  };

  // Show payment section (validate customer info first)
  const proceedToPayment = () => {
    if (!customerInfo.customerName || !customerInfo.phoneNumber) {
      setMessage({ type: 'error', text: 'Please fill in your contact information.' });
      return;
    }

    if (cart.length === 0) {
      setMessage({ type: 'error', text: 'Please add items to your cart before placing an order.' });
      return;
    }

    if (!paypalLoaded) {
      setMessage({ type: 'error', text: 'Payment system is loading. Please wait a moment.' });
      return;
    }

    setShowPayment(true);
    setMessage({ type: '', text: '' });
  };

  const handleCustomerInfoChange = (e) => {
    const { name, value } = e.target;
    setCustomerInfo(prev => ({
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
            <ShoppingCart className="w-8 h-8 text-white" />
            <div>
              <h1 className="text-2xl font-bold">Place Your Order</h1>
              <p className="text-gray-400 text-sm">Select products and complete your purchase</p>
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
          {/* Products Section */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Package className="w-5 h-5" />
              <h2 className="text-xl font-semibold">Available Products</h2>
            </div>

            {productsLoading ? (
              <div className="text-center py-8">
                <Loader className="w-12 h-12 mx-auto mb-3 text-gray-600 animate-spin" />
                <p className="text-gray-500">Loading products...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                <p>No products available</p>
                <p className="text-sm text-gray-600 mt-1">Please check back later</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {products.map((product) => (
                  <div key={product.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-white mb-1">{product.name}</h3>
                        {product.description && (
                          <p className="text-sm text-gray-400 mb-2 line-clamp-2">
                            {product.description}
                          </p>
                        )}
                        <span className="text-lg font-bold text-green-400">
                          ${parseFloat(product.price).toFixed(2)}
                        </span>
                      </div>
                      <button
                        onClick={() => addToCart(product)}
                        disabled={loading}
                        className="ml-4 bg-white text-black px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart and Order Section */}
          <div className="space-y-6">
            {/* Customer Information */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <div className="flex items-center space-x-2 mb-6">
                <ShoppingCart className="w-5 h-5" />
                <h2 className="text-xl font-semibold">Contact Information</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Customer Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="customerName"
                    value={customerInfo.customerName}
                    onChange={handleCustomerInfoChange}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-white transition-colors"
                    placeholder="Enter your full name"
                    disabled={loading}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Phone Number <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={customerInfo.phoneNumber}
                    onChange={handleCustomerInfoChange}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-white transition-colors"
                    placeholder="(555) 123-4567"
                    disabled={loading}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Shopping Cart */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <div className="flex items-center space-x-2 mb-6">
                <ShoppingCart className="w-5 h-5" />
                <h2 className="text-xl font-semibold">Your Order</h2>
                <span className="bg-gray-800 text-xs px-2 py-1 rounded-full">
                  {cart.length} item{cart.length !== 1 ? 's' : ''}
                </span>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                  <p>Your cart is empty</p>
                  <p className="text-sm text-gray-600 mt-1">Add products from the left to get started</p>
                </div>
              ) : (
                <div className="space-y-3 mb-6">
                  {cart.map((item) => (
                    <div key={item.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-medium text-white">{item.name}</h3>
                          <span className="text-sm text-gray-400">
                            ${parseFloat(item.price).toFixed(2)} each
                          </span>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          disabled={loading}
                          className="text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={loading}
                            className="bg-gray-700 text-white p-1 rounded hover:bg-gray-600 transition-colors disabled:opacity-50"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="text-white font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={loading}
                            className="bg-gray-700 text-white p-1 rounded hover:bg-gray-600 transition-colors disabled:opacity-50"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <span className="text-lg font-bold text-green-400">
                          ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Total */}
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-medium text-white">Total:</span>
                      <span className="text-2xl font-bold text-green-400">
                        ${getTotalPrice().toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {!showPayment ? (
                <button
                  type="button"
                  onClick={proceedToPayment}
                  disabled={loading || !customerInfo.customerName || !customerInfo.phoneNumber || cart.length === 0}
                  className="w-full bg-white text-black py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Proceed to Payment</span>
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">Complete Your Payment</h3>
                    <p className="text-gray-400 text-sm mb-4">
                      Total: <span className="text-green-400 font-bold">${getTotalPrice().toFixed(2)}</span>
                    </p>
                    <p className="text-gray-500 text-xs mb-4">
                      Choose your preferred payment method below
                    </p>
                  </div>
                  
                  {loading && (
                    <div className="text-center py-4">
                      <Loader className="w-6 h-6 mx-auto mb-2 text-gray-400 animate-spin" />
                      <p className="text-sm text-gray-400">Processing payment...</p>
                    </div>
                  )}
                  
                  <div 
                    ref={paypalRef}
                    className={loading ? 'opacity-50 pointer-events-none' : ''}
                  ></div>
                  
                  <button
                    onClick={() => setShowPayment(false)}
                    disabled={loading}
                    className="w-full bg-gray-700 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors font-medium disabled:opacity-50 text-sm"
                  >
                    Back to Cart
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}