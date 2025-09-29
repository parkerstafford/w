'use client'

import React, { useState, useEffect } from 'react';
import { ShoppingCart, Star, ChefHat, Sparkles } from 'lucide-react';

export default function HomePage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleOrderNow = () => {
    // Navigate to order page
    window.location.href = '/order';
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Background image */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
          style={{
            backgroundImage: 'url(/w1.jpg)',
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80"></div>
      </div>

      {/* Header */}
      <div className="relative border-b border-gray-800 bg-black/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ChefHat className="w-10 h-10 text-white" />
              <span className="text-xl font-bold">Dough Si Do</span>
            </div>
            <nav className="flex items-center space-x-6 text-sm">
              <a href="/admin" className="text-gray-300 hover:text-white transition-colors">Admin</a>
              <a href="/order" className="text-gray-300 hover:text-white transition-colors">Order</a>
               <a href="/products" className="text-gray-300 hover:text-white transition-colors">Products</a>
            </nav>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className={`text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {/* Main Title */}
            <div className="mb-6">
              <h1 className="text-6xl md:text-8xl font-bold mb-4 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                Dough Si Do
              </h1>
              <div className="flex items-center justify-center space-x-2 mb-4">
                <p className="text-xl md:text-2xl text-gray-300 font-light">
                  Sourdough Shack
                </p>
              </div>
              <div className="flex items-center justify-center space-x-1 text-white">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-current" />
                ))}
             
              </div>
            </div>

            {/* Order Now Button */}
            <div className="mb-12">
              <button
                onClick={handleOrderNow}
                className="group relative inline-flex items-center space-x-3 bg-white hover:bg-gray-200 text-black px-12 py-4 rounded-full text-xl font-semibold shadow-2xl transform hover:scale-105 transition-all duration-300 hover:shadow-white/25"
              >
                <ShoppingCart className="w-6 h-6 group-hover:animate-bounce" />
                <span>Order Now</span>
                <div className="absolute inset-0 rounded-full bg-black opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}