'use client'

import React, { useState, useEffect } from 'react';
import { ShoppingCart, Star, ChefHat, Sparkles } from 'lucide-react';

export default function HomePage() {
  const [isVisible, setIsVisible] = useState(false);
  const [snowflakes, setSnowflakes] = useState([]);

  useEffect(() => {
    setIsVisible(true);
    
    // Generate snowflakes
    const flakes = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      animationDuration: 10 + Math.random() * 20,
      animationDelay: Math.random() * 10,
      size: 2 + Math.random() * 4,
      opacity: 0.3 + Math.random() * 0.4
    }));
    setSnowflakes(flakes);
  }, []);

  const handleOrderNow = () => {
    // Navigate to order page
    window.location.href = '/order';
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Snowflakes */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
        {snowflakes.map((flake) => (
          <div
            key={flake.id}
            className="absolute animate-fall"
            style={{
              left: `${flake.left}%`,
              top: '-10px',
              width: `${flake.size}px`,
              height: `${flake.size}px`,
              backgroundColor: 'white',
              borderRadius: '50%',
              opacity: flake.opacity,
              animationDuration: `${flake.animationDuration}s`,
              animationDelay: `${flake.animationDelay}s`,
              filter: 'blur(0.5px)',
              boxShadow: '0 0 2px rgba(255, 255, 255, 0.5)'
            }}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes fall {
          to {
            transform: translateY(100vh) translateX(50px);
          }
        }
        .animate-fall {
          animation: fall linear infinite;
        }
      `}</style>

      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-gray-600/20 to-gray-800/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-gray-700/20 to-gray-900/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-gradient-to-r from-white/10 to-gray-600/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Header */}
      <div className="relative border-b border-gray-800 bg-black/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-1">
                <img 
                  src="/w.png" 
                  alt="Dough Si Do Logo" 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    // Fallback to chef hat icon if logo fails to load
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
                <ChefHat className="w-6 h-6 text-black hidden" />
              </div>
              <span className="text-xl font-bold">Dough Si Do</span>
            </div>
            <nav className="flex items-center space-x-6 text-sm">
              <a href="/admin" className="text-gray-300 hover:text-white transition-colors">Admin</a>
              <a href="/order" className="text-gray-300 hover:text-white transition-colors">Order</a>
               {/* <a href="/products" className="text-gray-300 hover:text-white transition-colors">Products</a> */}
            </nav>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className={`text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {/* Logo Placeholder */}
            <div className="mb-8 flex justify-center">
              <div className="w-32 h-32 bg-white rounded-2xl flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform duration-300 p-4">
                <img 
                  src="/w.png" 
                  alt="Dough Si Do Logo" 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    // Fallback to chef hat icon if logo fails to load
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="w-full h-full bg-black rounded-xl items-center justify-center hidden">
                  <ChefHat className="w-12 h-12 text-white" />
                </div>
              </div>
            </div>

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
               <div className="flex items-center justify-center space-x-2 mb-4">
                <p className="text-xl md:text-2xl text-gray-300 font-light">
                 Order by midnight on Mondays for Friday porch pick up at back of driveway
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