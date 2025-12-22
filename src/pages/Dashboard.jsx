export default function Dashboard() {
  // Mock stock data
  const stocks = [
    { symbol: 'AAPL', name: 'Apple Inc.', price: 175.43, change: 2.34, changePercent: 1.35 },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 138.21, change: -1.23, changePercent: -0.88 },
    { symbol: 'MSFT', name: 'Microsoft Corporation', price: 378.85, change: 5.67, changePercent: 1.52 },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 144.05, change: -0.89, changePercent: -0.61 },
    { symbol: 'TSLA', name: 'Tesla Inc.', price: 248.42, change: 12.34, changePercent: 5.23 },
    { symbol: 'NVDA', name: 'NVIDIA Corporation', price: 875.28, change: 15.67, changePercent: 1.82 },
    { symbol: 'META', name: 'Meta Platforms Inc.', price: 484.10, change: -8.92, changePercent: -1.81 },
    { symbol: 'NFLX', name: 'Netflix Inc.', price: 442.57, change: 7.89, changePercent: 1.81 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-50 mb-2">Stock Market Dashboard</h1>
          <p className="text-slate-400">Real-time stock prices and market data</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <div className="text-sm text-slate-400 mb-1">Market Cap</div>
            <div className="text-2xl font-bold text-slate-50">$42.5T</div>
            <div className="text-sm text-green-400">+1.2%</div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <div className="text-sm text-slate-400 mb-1">Volume</div>
            <div className="text-2xl font-bold text-slate-50">8.2B</div>
            <div className="text-sm text-red-400">-0.8%</div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <div className="text-sm text-slate-400 mb-1">S&P 500</div>
            <div className="text-2xl font-bold text-slate-50">4,567.89</div>
            <div className="text-sm text-green-400">+0.5%</div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <div className="text-sm text-slate-400 mb-1">NASDAQ</div>
            <div className="text-2xl font-bold text-slate-50">14,234.56</div>
            <div className="text-sm text-green-400">+0.3%</div>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
          <div className="p-6 border-b border-slate-700/50">
            <h2 className="text-xl font-semibold text-slate-50">Top Stocks</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Symbol</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Change</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">% Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {stocks.map((stock) => (
                  <tr key={stock.symbol} className="hover:bg-slate-700/20">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-50">{stock.symbol}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-300">{stock.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-50">${stock.price.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${stock.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${stock.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                      </div>
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
