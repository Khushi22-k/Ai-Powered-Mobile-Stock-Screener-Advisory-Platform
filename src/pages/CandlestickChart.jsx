import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Chart as ChartJS,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  Filler,
  CategoryScale,
} from "chart.js";
import "chartjs-adapter-date-fns";
import { Chart } from "react-chartjs-2";

ChartJS.register(
  LinearScale,
  TimeScale,
  CategoryScale,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  Filler
);

const TIME_RANGES = [
  { label: "1 Minute", value: "1m", limit: 60, interval: "1minute" },
  { label: "1 Week", value: "1w", limit: 7, interval: "hourly" },
  { label: "3 Weeks", value: "3w", limit: 21, interval: "hourly" },
  { label: "1 Month", value: "1M", limit: 30, interval: "daily" },
  { label: "3 Months", value: "3M", limit: 90, interval: "daily" },
  { label: "6 Months", value: "6M", limit: 180, interval: "daily" },
  { label: "1 Year", value: "1Y", limit: 365, interval: "weekly" },
  { label: "3 Years", value: "3Y", limit: 1095, interval: "monthly" },
  { label: "5 Years", value: "5Y", limit: 1825, interval: "monthly" },
];

const popularStocks = [
  "AAPL", "GOOGL", "MSFT", "TSLA", "NVDA", "META", "AMZN", "NFLX", "AMD", "BABA","INFY"
];

function StockChart() {
  const { symbol: urlSymbol } = useParams();
  const [symbol, setSymbol] = useState(urlSymbol || "AAPL");
  const [range, setRange] = useState(TIME_RANGES[6]); // Default 1Y
  const [chartType, setChartType] = useState("line");
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (urlSymbol) {
      setSymbol(urlSymbol);
    }
  }, [urlSymbol]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("access_token");

        const res = await fetch("http://localhost:5000/auth/api/chart", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            symbol,
            type: "eod",
            limit: range.limit,
            interval: range.interval,
          }),
        });

        const json = await res.json();
        const eod = json?.data?.eod;
        
        if (!eod || !eod.length) {
          throw new Error("No data found");
        }

        const closePrices = eod
          .reverse()
          .map((d) => ({
            x: new Date(d.date),
            y: Number(d.close),
          }));

        setChartData({
          datasets: [
            {
              label: `${symbol} Close Price`,
              data: closePrices,
              borderColor: "#00d4aa",
              backgroundColor: chartType === "area" 
                ? "rgba(0, 212, 170, 0.2)" 
                : "transparent",
              fill: chartType === "area",
              tension: 0.3,
              pointRadius: 0,
              pointHoverRadius: 4,
              lineWidth: 2,
            },
          ],
        });
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [symbol, range]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: "index",
        intersect: false,
        backgroundColor: "rgba(0,0,0,0.9)",
        titleColor: "#fff",
        bodyColor: "#fff",
        borderColor: "#334158",
        callbacks: {
          title: (ctx) => new Date(ctx[0].parsed.x).toLocaleDateString(),
          label: (ctx) => `Close: $${ctx.raw.y.toFixed(2)}`,
        },
      },
    },
    scales: {
      x: {
        type: "time",
        time: {
          unit: range.value === "1m" ? "minute" :
                range.value === "1w" || range.value === "3w" ? "hour" :
                range.value === "1M" || range.value === "3M" || range.value === "6M" ? "day" :
                range.value === "1Y" ? "week" : "month",
          displayFormats: {
            minute: "HH:mm",
            hour: "MMM dd HH:mm",
            day: "MMM dd",
            week: "MMM dd",
            month: "MMM 'YY",
          },
        },
        grid: { 
          color: "rgba(51,65,88,0.3)",
          drawBorder: false,
        },
        ticks: { 
          color: "#9CA3AF",
          maxRotation: 45,
        },
        border: { color: "transparent" },
      },
      y: {
        position: "right",
        grid: { 
          color: "rgba(51,65,88,0.3)",
          drawBorder: false,
        },
        ticks: {
          color: "#9CA3AF",
          callback: (value) => `$${value.toFixed(2)}`,
        },
        border: { color: "transparent" },
      },
    },
    elements: {
      line: {
        borderWidth: 2,
        tension: 0.3,
      },
      point: {
        radius: 0,
        hoverRadius: 4,
      },
    },
    layout: {
      backgroundColor: "#0a0e17",
      padding: {
        left: 10,
        right: 10,
        top: 10,
        bottom: 10,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* 🔥 HEADER */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8 justify-between items-start lg:items-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Stock Price Charts
          </h1>
          
          {/* 🔥 STOCK SELECTOR */}
          <div className="flex gap-4 items-center">
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="bg-slate-700/50 text-white px-4 py-3 rounded-xl border border-slate-600 focus:border-cyan-500 focus:outline-none text-lg font-medium"
            >
              {urlSymbol && !popularStocks.includes(urlSymbol) && (
                <option key={urlSymbol} value={urlSymbol}>
                  {urlSymbol}
                </option>
              )}
              {popularStocks.map((stock) => (
                <option key={stock} value={stock}>
                  {stock}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 🔥 CONTROLS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 p-6 bg-slate-800/50 rounded-2xl border border-slate-700">
          <div>
            <label className="block text-slate-300 mb-2 font-medium">Chart Type</label>
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
              className="bg-slate-700/50 text-white px-6 py-3 rounded-xl border border-slate-600 focus:border-cyan-500 focus:outline-none w-full font-medium"
            >
              <option value="line">Line Chart</option>
              <option value="area">Area Chart</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 mb-2 font-medium">Time Range</label>
            <div className="flex flex-wrap gap-2">
              {TIME_RANGES.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setRange(r)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    r.value === range.value
                      ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25"
                      : "bg-slate-700/50 hover:bg-slate-600 text-slate-300 hover:text-white"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 🔥 CHART */}
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-8 shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              {symbol} - {range.label}
            </h2>
            <div className="text-slate-400 text-sm">
              {chartType === "line" ? "Line Chart" : "Area Chart"}
            </div>
          </div>

          <div className="relative h-[600px] w-full">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 rounded-xl">
                <div className="text-white text-xl font-medium">
                  Loading {range.label} data for {symbol}...
                </div>
              </div>
            )}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-red-900/80 rounded-xl">
                <div className="text-red-300 text-lg">Error: {error}</div>
              </div>
            )}
            {!loading && !error && chartData && (
              <Chart 
                type="line" 
                data={chartData} 
                options={options} 
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StockChart;
