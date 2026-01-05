import { useState, useEffect } from 'react';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import { TrendingUp, TrendingDown, DollarSign, Activity, Menu, X, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {Star} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("access_token");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

useEffect(() => {
  if (!token) {
    navigate("/login");
  }
}, [token,navigate]);
   const authHeaders = token ?{
  "Content-Type": "application/json",
  "Authorization": `Bearer ${token}`
}: null;

  const [stocks, setStocks] = useState([]);
  const [marketOverview, setMarketOverview] = useState({});
  const [selectedStock, setSelectedStock] = useState('AAPL');
  const [stockHistory, setStockHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favoriteStocks, setFavoriteStocks] = useState([]);
  const [favoriteSymbols, setFavoriteSymbols] = useState([]);
  const [lastClickTime, setLastClickTime] = useState({});

  const API_BASE = 'http://127.0.0.1:5000';

  const handleStarClick = (symbol) => {
    const now = Date.now();
    const lastClick = lastClickTime[symbol] || 0;
    const timeDiff = now - lastClick;

    if (timeDiff < 300) { // Double click within 300ms
      removeFavorite(symbol);
      setLastClickTime(prev => ({ ...prev, [symbol]: 0 }));
    } else {
      setLastClickTime(prev => ({ ...prev, [symbol]: now }));
      setTimeout(() => {
        const currentTime = Date.now();
        if (currentTime - (lastClickTime[symbol] || 0) >= 300) {
          addFavorite(symbol);
        }
      }, 300);
    }
  };

   const addFavorite = async (symbol) => {
    const isCurrentlyFavorite = favoriteSymbols.includes(symbol.toUpperCase());

    if (isCurrentlyFavorite) return; // Already favorite, do nothing

    try {
      console.log("Adding favorite stock:", symbol);

      await fetch(`${API_BASE}/auth/favorite-stock`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ symbol: symbol, status: "selected" }),
      });
      console.log("send from frontend")

      // Refresh favorite stocks after add
      fetchFavoriteStocks();
    } catch (err) {
      console.error("Failed to add favorite stock", err);
    }
   };

   const removeFavorite = async (symbol) => {
    const isCurrentlyFavorite = favoriteSymbols.includes(symbol.toUpperCase());

    if (!isCurrentlyFavorite) return; // Not favorite, do nothing

    try {
      console.log("Removing favorite stock:", symbol);

      await fetch(`${API_BASE}/auth/favorite-stock`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ symbol: symbol, status: "unselected" }),
      });
      console.log("send from frontend")
      // Refresh favorite stocks after remove
      fetchFavoriteStocks();
    } catch (err) {
      console.error("Failed to remove favorite stock", err);
    }
   };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("username");
    navigate("/signin");
  };


  useEffect(() => {
    fetchData();
    fetchFavoriteStocks();
    const interval = setInterval(fetchData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);



  useEffect(() => {
    if (selectedStock) {
      fetchStockHistory(selectedStock);
    }
  }, [selectedStock]);

  const fetchData = async () => {
  if (!authHeaders) return;

  try {
    const [stocksRes, overviewRes] = await Promise.all([
      fetch(`${API_BASE}/auth/stocks`, { headers: authHeaders }),
      fetch(`${API_BASE}/auth/market/overview`, { headers: authHeaders })
    ]);

    if (!stocksRes.ok) throw new Error("Stocks API failed");
    if (!overviewRes.ok) throw new Error("Overview API failed");

    setStocks(await stocksRes.json());
    setMarketOverview(await overviewRes.json());
  } catch (err) {
    console.error(err.message);
  } finally {
    setLoading(false);
  }
};


  const fetchFavoriteStocks = async () => {
    if (!authHeaders) return;

    try {
      const res = await fetch(`${API_BASE}/auth/favorite-stocks`, { headers: authHeaders });
      if (!res.ok) throw new Error("Favorite stocks fetch failed");
      const data = await res.json();

      // Filter only selected favorites
      const selectedFavorites = data.filter(fav => fav.status === 'selected');

      // Fetch full stock data for each favorite
      const favoriteStockData = [];
      for (const fav of selectedFavorites) {
        try {
          const stockRes = await fetch(`${API_BASE}/auth/stock/${fav.symbol}`, { headers: authHeaders });
          if (stockRes.ok) {
            const stockData = await stockRes.json();
            favoriteStockData.push(stockData);
          }
        } catch (err) {
          console.error(`Failed to fetch stock data for ${fav.symbol}:`, err);
        }
      }

      setFavoriteStocks(favoriteStockData);
      setFavoriteSymbols(selectedFavorites.map(fav => fav.symbol.toUpperCase()));
      console.log('favoriteStocks:', favoriteStockData);
    } catch (err) {
      console.error('Failed to fetch favorite stocks:', err);
    }
  };

  const fetchStockHistory = async (symbol) => {
    if(!authHeaders) return;
  try {
    const res = await fetch(
      `${API_BASE}/auth/stocks/history/${symbol}`,
      { headers: authHeaders }
    );

    if (!res.ok) throw new Error("History fetch failed");

    setStockHistory(await res.json());
  } catch (err) {
    console.error(err.message);
    setStockHistory([]);
  }
};



  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-slate-50 text-xl">Loading...</div>
      </div>
    );
  }

  // Calculate highest and lowest value stocks
  const sortedByPrice = [...stocks].sort((a, b) => b.price - a.price);
  const highestStock = sortedByPrice[0];
  const lowestStock = sortedByPrice[sortedByPrice.length - 1];

  // Chart data
  const priceChartData = {
    labels: stocks.map(stock => stock.symbol),
    datasets: [{
      label: 'Stock Price ($)',
      data: stocks.map(stock => stock.price),
      backgroundColor: stocks.map(stock => stock.change >= 0 ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)'),
      borderColor: stocks.map(stock => stock.change >= 0 ? 'rgba(34, 197, 94, 1)' : 'rgba(239, 68, 68, 1)'),
      borderWidth: 1,
    }]
  };

  const filteredStocks = stocks.filter(stock => stock.symbol !== 'TCS' && stock.symbol !== 'INFY').slice(0, 10);
  const volumeChartData = {
    labels: filteredStocks.map(stock => stock.symbol),
    datasets: [{
      label: 'Volume',
      data: filteredStocks.map(stock => stock.volume),
      backgroundColor: 'rgba(59, 130, 246, 0.8)',
      borderColor: 'rgba(59, 130, 246, 1)',
      borderWidth: 1,
    }]
  };

  const marketCapChartData = {
    labels: stocks.map(stock => stock.symbol),
    datasets: [{
      data: stocks.map(stock => stock.marketCap / 1000000000000), // Convert to trillions
      backgroundColor: [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
        '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
      ],
    }]
  };

  const historyChartData = {
    labels: stockHistory.map(item => item.date),
    datasets: [{
      label: 'Price',
      data: stockHistory.map(item => item.price),
      borderColor: 'rgba(34, 197, 94, 1)',
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      tension: 0.1,
    }]
  };

  const riskChartData = {
    labels: stocks.map(stock => stock.symbol),
    datasets: [{
      label: 'Risk Score',
      data: stocks.map(stock => stock.riskScore),
      backgroundColor: stocks.map(stock => stock.riskScore >= 7 ? 'rgba(239, 68, 68, 0.8)' : stock.riskScore >= 5 ? 'rgba(251, 191, 36, 0.8)' : 'rgba(34, 197, 94, 0.8)'),
      borderColor: stocks.map(stock => stock.riskScore >= 7 ? 'rgba(239, 68, 68, 1)' : stock.riskScore >= 5 ? 'rgba(251, 191, 36, 1)' : 'rgba(34, 197, 94, 1)'),
      borderWidth: 1,
    }]
  };

  const industryInvestment = stocks.reduce((acc, stock) => {
    const industry = stock.industry || 'Unknown';
    if (!acc[industry]) {
      acc[industry] = { totalCap: 0, count: 0 };
    }
    acc[industry].totalCap += stock.marketCap || 0;
    acc[industry].count += 1;
    return acc;
  }, {});

  const industryDonutData = {
    labels: Object.keys(industryInvestment).map(industry => `${industry} (${industryInvestment[industry].count} stocks)`),
    datasets: [{
      data: Object.values(industryInvestment).map(d => d.totalCap / 1000000000000), // trillions
      backgroundColor: [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
        '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF',
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0' // add more if needed
      ],
    }]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex">
      <div className={`transition-all duration-300 ${isMenuOpen ? 'w-1/3' : 'w-0'} bg-slate-800/50 border-r border-slate-700/50 overflow-hidden`}>
        <div className="p-6">
          <h2 className="text-xl font-semibold text-slate-50 mb-4">Navigation</h2>
          <div className="flex flex-col gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-slate-800/50 hover:bg-slate-700/50 text-slate-50 px-4 py-2 rounded-xl border border-slate-700/50 transition"
            >
              Dashboard
            </button>
            <button
              onClick={() => navigate('/chatgpt')}
              className="bg-slate-800/50 hover:bg-slate-700/50 text-slate-50 px-4 py-2 rounded-xl border border-slate-700/50 transition"
            >
              Advisory Platform
            </button>
            <button
              onClick={() => navigate('/watchlist')}
              className="bg-slate-800/50 hover:bg-slate-700/50 text-slate-50 px-4 py-2 rounded-xl border border-slate-700/50 transition"
            >
              Watchlist
            </button>
             <button
              onClick={() => navigate('/tradingview')}
              className="bg-slate-800/50 hover:bg-slate-700/50 text-slate-50 px-4 py-2 rounded-xl border border-slate-700/50 transition"
            >
              Portfolio
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-slate-50 px-4 py-2 rounded-xl border border-red-500 transition flex items-center gap-2"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </div>
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold text-slate-50">Stock Market Dashboard</h1>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 bg-slate-800/50 hover:bg-slate-700/50 text-slate-50 rounded-xl border border-slate-700/50 transition"
              >
                {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
            <p className="text-slate-400">Real-time stock prices and market data</p>
          </div>

        {/* Market Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm text-slate-400">Market Cap</div>
              <DollarSign className="h-4 w-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-50">${(marketOverview.marketCap / 1000000000000).toFixed(1)}T</div>
            <div className={`text-sm ${marketOverview.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {marketOverview.changePercent >= 0 ? '+' : ''}{(marketOverview.changePercent * 100).toFixed(1)}%
            </div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm text-slate-400">Volume</div>
              <Activity className="h-4 w-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-50">{(marketOverview.volume / 1000000000).toFixed(1)}B</div>
            <div className="text-sm text-slate-400">Total Volume</div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm text-slate-400">S&P 500</div>
              <TrendingUp className="h-4 w-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-50">{marketOverview.sp500?.toLocaleString()}</div>
            <div className="text-sm text-green-400">+0.5%</div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm text-slate-400">NASDAQ</div>
              <TrendingDown className="h-4 w-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-50">{marketOverview.nasdaq?.toLocaleString()}</div>
            <div className="text-sm text-green-400">+0.3%</div>
          </div>
        </div>

        {/* Highest and Lowest Stocks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-slate-50 mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 text-green-400 mr-2" />
              Highest Value Stock
            </h3>
            {highestStock && (
              <div>
                <div className="text-2xl font-bold text-slate-50">{highestStock.symbol}</div>
                <div className="text-sm text-slate-300 mb-2">{highestStock.name}</div>
                <div className="text-xl font-semibold text-green-400">{highestStock.changePercent != null 
  ? Number(highestStock.changePercent).toFixed(2) 
  : "N/A"}
</div>
                <div className="text-sm text-green-400">
                  +{parseFloat(highestStock.changePercent).toFixed(2)}%
                </div>
              </div>
            )}
          </div>
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-slate-50 mb-4 flex items-center">
              <TrendingDown className="h-5 w-5 text-red-400 mr-2" />
              Lowest Value Stock
            </h3>
            {lowestStock && (
              <div>
                <div className="text-2xl font-bold text-slate-50">{lowestStock.symbol}</div>
                <div className="text-sm text-slate-300 mb-2">{lowestStock.name}</div>
                <div className="text-xl font-semibold text-red-400">${lowestStock.price != null ? parseFloat(lowestStock.price).toFixed(2) : 'N/A'}</div>
                <div className="text-sm text-red-400">
                  {lowestStock.changePercent != null ? parseFloat(lowestStock.changePercent).toFixed(2) : 'N/A'}%
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-slate-50 mb-4">Stock Prices</h3>
            <Bar data={priceChartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
          </div>
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-slate-50 mb-4">Trading Volume</h3>
            <Bar data={volumeChartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
          </div>
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-slate-50 mb-4">Market Cap Distribution</h3>
            <Pie data={marketCapChartData} options={{ responsive: true }} />
          </div>
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-slate-50 mb-4">Industry Investment Distribution (Total Stocks: {stocks.length})</h3>
            <Doughnut data={industryDonutData} options={{ responsive: true }} />
          </div>
        </div>



        {/* Additional Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-slate-50 mb-4">Price History - {selectedStock}</h3>
            <select
              value={selectedStock}
              onChange={(e) => setSelectedStock(e.target.value)}
              className="mb-4 bg-slate-700 text-slate-50 rounded px-3 py-1 text-sm"
            >
              {stocks.map(stock => (
                <option key={stock.symbol} value={stock.symbol}>{stock.symbol}</option>
              ))}
            </select>
            <Line data={historyChartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
          </div>
        </div>

        {/* Stocks Table */}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Volume</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Favorites</th>
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
                      <div className="text-sm text-slate-50">${stock.price != null ? parseFloat(stock.price).toFixed(2) : 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${stock.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {stock.change >= 0 ? '+' : ''}${stock.change != null ? parseFloat(stock.change).toFixed(2) : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${stock.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent != null ? parseFloat(stock.changePercent).toFixed(2) : 'N/A'}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-50">{stock.volume != null ? (parseFloat(stock.volume) / 1000000).toFixed(1) : 'N/A'}M</div>
                    </td>
                                   <td className="px-6 py-4 whitespace-nowrap text-center">
  <Star
    size={20}
    onClick={() => addFavorite(stock.symbol)}
    onDoubleClick={() => removeFavorite(stock.symbol)}
    className={`cursor-pointer transition ${
      favoriteSymbols.includes(stock.symbol.toUpperCase())
        ? "fill-yellow-400 text-yellow-400"
        : "text-gray-400"
    }`}
  />
</td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};
