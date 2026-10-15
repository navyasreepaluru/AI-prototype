import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import api from "../services/api";

const COLORS = ["#10b981", "#f59e0b", "#ef4444"];

export default function HomePage() {
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/dashboard/summary")
      .then(res => {
        setSummary(res.data);
        return api.get("/dashboard/trends?days=7");
      })
      .then(res => {
        setTrends(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Dashboard fetch error:", err);
        // DEMO DATA for Vercel - works without backend
        setSummary({
          total_scans: 1247,
          safe_count: 850,
          suspicious_count: 220,
          malicious_count: 177,
          risk_distribution: { Low: 68, Medium: 18, High: 14 }
        });
        setTrends([
          { date: 'Mon', total: 20, threats: 5 },
          { date: 'Tue', total: 35, threats: 12 },
          { date: 'Wed', total: 30, threats: 8 },
          { date: 'Thu', total: 50, threats: 20 },
          { date: 'Fri', total: 45, threats: 15 },
          { date: 'Sat', total: 65, threats: 28 },
          { date: 'Sun', total: 80, threats: 35 },
        ]);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8 text-white">Loading dashboard...</div>;
  if (!summary) return <div className="p-8 text-white">No data</div>;

  const pieData = [
    { name: "Low", value: summary.risk_distribution?.Low || 0 },
    { name: "Medium", value: summary.risk_distribution?.Medium || 0 },
    { name: "High", value: summary.risk_distribution?.High || 0 },
  ];

  return (
    <div className="p-6 space-y-6 bg-[#0a0f1e] min-h-screen text-white">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#111827] p-4 rounded-xl"><p className="text-gray-400">Total Scans</p><p className="text-2xl font-bold">{summary.total_scans}</p></div>
        <div className="bg-[#111827] p-4 rounded-xl"><p className="text-gray-400">Safe</p><p className="text-2xl font-bold text-green-400">{summary.safe_count}</p></div>
        <div className="bg-[#111827] p-4 rounded-xl"><p className="text-gray-400">Suspicious</p><p className="text-2xl font-bold text-yellow-400">{summary.suspicious_count}</p></div>
        <div className="bg-[#111827] p-4 rounded-xl"><p className="text-gray-400">Malicious</p><p className="text-2xl font-bold text-red-400">{summary.malicious_count}</p></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#111827] p-4 rounded-xl">
          <h3 className="font-bold mb-4">Scan Trends (7 Days)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="date" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="#3b82f6" />
              <Line type="monotone" dataKey="threats" stroke="#ef4444" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-[#111827] p-4 rounded-xl">
          <h3 className="font-bold mb-4">Risk Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex gap-4">
        <Link to="/scan/url" className="bg-blue-600 px-6 py-2 rounded-lg">Scan URL</Link>
        <Link to="/scan/message" className="bg-purple-600 px-6 py-2 rounded-lg">Scan Message</Link>
      </div>
    </div>
  );
}