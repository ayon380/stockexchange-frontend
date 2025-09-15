'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

const SYMBOLS = ["AAPL", "GOOGL", "MSFT", "TSLA", "AMZN", "META", "NVDA", "NFLX"];

interface StockData {
  symbol: string;
  price: number;
  change: number;
}

interface IndexData {
  time: string;
  value: number;
}

export default function StockDashboard() {
  const [stockPrices, setStockPrices] = useState<StockData[]>([]);
  const [indexData, setIndexData] = useState<IndexData[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const toggleStreaming = useCallback(() => {
    setIsStreaming(prev => !prev);
  }, []);

  useEffect(() => {
    if (isStreaming) {
      intervalRef.current = setInterval(() => {
        // Simulate stock price updates with change
        setStockPrices(prevPrices => {
          return SYMBOLS.map(symbol => {
            const prevPrice = prevPrices.find(p => p.symbol === symbol)?.price || Math.random() * 1000 + 100;
            const newPrice = prevPrice + (Math.random() - 0.5) * 20; // Small random change
            const change = ((newPrice - prevPrice) / prevPrice) * 100;
            return { symbol, price: Math.max(newPrice, 0), change };
          });
        });

        // Simulate index value update
        const newIndexValue = Math.random() * 1000 + 2000; // Random index
        const now = new Date().toLocaleTimeString();
        setIndexData(prev => [...prev.slice(-19), { time: now, value: newIndexValue }]); // Keep last 20 points
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isStreaming]);

  return (
    <div className="min-h-screen bg-white dark:bg-black p-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-black dark:text-white mb-8 text-center">Stock Exchange Dashboard</h1>
        
        <div className="mb-8 text-center">
          <button
            onClick={toggleStreaming}
            className={`px-8 py-3 rounded-lg font-semibold text-lg transition-all duration-300 ${
              isStreaming
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {isStreaming ? 'Stop Streaming' : 'Start Streaming'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Market Index Chart */}
          <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-lg transition-all duration-300">
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">Market Index</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={indexData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb dark:#374151" />
                <XAxis dataKey="time" stroke="#374151 dark:#d1d5db" />
                <YAxis stroke="#374151 dark:#d1d5db" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff dark:#000000',
                    border: '1px solid #e5e7eb dark:#374151',
                    borderRadius: '6px',
                    color: '#000000 dark:#ffffff'
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 1, r: 3 }}
                  activeDot={{ r: 5, stroke: '#3b82f6', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Stock Prices Chart */}
          <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-lg transition-all duration-300">
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">Latest Stock Prices</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stockPrices}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb dark:#374151" />
                <XAxis dataKey="symbol" stroke="#374151 dark:#d1d5db" />
                <YAxis stroke="#374151 dark:#d1d5db" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff dark:#000000',
                    border: '1px solid #e5e7eb dark:#374151',
                    borderRadius: '6px',
                    color: '#000000 dark:#ffffff'
                  }}
                />
                <Legend />
                <Bar
                  dataKey="price"
                  fill="#10b981"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stock Prices Table */}
        <div className="mt-8 bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-lg transition-all duration-300">
          <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">Stock Details</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-black dark:text-white">
              <thead>
                <tr className="border-b border-gray-300 dark:border-gray-600">
                  <th className="text-left py-3 font-medium">Symbol</th>
                  <th className="text-right py-3 font-medium">Price</th>
                  <th className="text-right py-3 font-medium">Change</th>
                </tr>
              </thead>
              <tbody>
                {stockPrices.map((stock) => (
                  <tr key={stock.symbol} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors duration-200">
                    <td className="py-3 font-medium">{stock.symbol}</td>
                    <td className="text-right py-3">${stock.price.toFixed(2)}</td>
                    <td className={`text-right py-3 font-medium ${stock.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}