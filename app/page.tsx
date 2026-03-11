"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface User {
  id: number;
  name: string;
  life_path_number: number;
}

interface Hexagram {
  upper_trigram: { name: string; en: string };
  lower_trigram: { name: string; en: string };
  hexagram_name: string;
  judgment: string;
  keywords: string;
}

const LIFE_PATH_MEANINGS: Record<number, string> = {
  1: "領導力、有主見",
  2: "設計、策劃",
  3: "聰明、智慧",
  4: "健康、規律",
  5: "財富、人群核心",
  6: "愛心、耐心",
  7: "貴人、專家",
  8: "時尚、八面玲瓏",
  9: "包容",
};

export default function Home() {
  // States
  const [view, setView] = useState<"home" | "register" | "login" | "dashboard">("home");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [birthYear, setBirthYear] = useState(1990);
  const [birthMonth, setBirthMonth] = useState(1);
  const [birthDay, setBirthDay] = useState(1);
  const [user, setUser] = useState<User | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [hexagram, setHexagram] = useState<Hexagram | null>(null);
  const [goalNumber, setGoalNumber] = useState(5);
  const [recommendation, setRecommendation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Calculate Life Path
  const calculateLifePath = (year: number, month: number, day: number): number => {
    const total = year + month + day;
    while (total >= 10) {
      const str = total.toString();
      let sum = 0;
      for (const char of str) {
        sum += parseInt(char);
      }
      return sum;
    }
    return total;
  };

  // Handle Register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const lifePath = calculateLifePath(birthYear, birthMonth, birthDay);
      
      const res = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          name,
          birth_year: birthYear,
          birth_month: birthMonth,
          birth_day: birthDay,
        }),
      });
      
      if (!res.ok) throw new Error("Registration failed");
      
      const data = await res.json();
      setUser(data.user);
      setView("dashboard");
    } catch (err) {
      setError("Registration failed. Please try again.");
    }
    
    setLoading(false);
  };

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      
      if (!res.ok) throw new Error("Login failed");
      
      const data = await res.json();
      setUser({
        id: data.user_id,
        name: data.name,
        life_path_number: data.life_path_number,
      });
      setView("dashboard");
    } catch (err) {
      setError("Invalid credentials.");
    }
    
    setLoading(false);
  };

  // Analyze Phone
  const analyzePhone = async () => {
    if (!phoneNumber || !user) return;
    setLoading(true);
    setError("");
    
    try {
      // Calculate hexagram
      const digits = phoneNumber.replace(/\D/g, "").split("").map(Number);
      const first4 = digits.slice(0, 4).reduce((a, b) => a + b, 0);
      const last4 = digits.slice(4, 8).reduce((a, b) => a + b, 0);
      const upper = first4 % 8 || 8;
      const lower = last4 % 8 || 8;
      
      const res = await fetch(`${API_URL}/hexagram/${upper}/${lower}`);
      const data = await res.json();
      setHexagram(data);
    } catch (err) {
      setError("Analysis failed.");
    }
    
    setLoading(false);
  };

  // Get Recommendation
  const getRecommendation = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      const res = await fetch(`${API_URL}/recommend-numbers/${user.id}/${goalNumber}`);
      const data = await res.json();
      setRecommendation(data.message);
    } catch (err) {
      setError("Failed to get recommendation.");
    }
    
    setLoading(false);
  };

  return (
    <main className="min-h-screen p-8 bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <h1 className="text-4xl font-bold text-center mb-2">🧘 MobileQ 卦號</h1>
        <p className="text-center text-gray-600 mb-8">電話號碼運勢分析系統</p>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {/* Home View */}
        {view === "home" && (
          <div className="space-y-4">
            <button
              onClick={() => setView("register")}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
            >
              開始使用
            </button>
            <button
              onClick={() => setView("login")}
              className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300"
            >
              登入
            </button>
          </div>
        )}
        
        {/* Register View */}
        {view === "register" && (
          <form onSubmit={handleRegister} className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">用戶登記</h2>
            
            <input
              type="text"
              placeholder="姓名"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border rounded-lg"
              required
            />
            <input
              type="email"
              placeholder="電郵"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border rounded-lg"
              required
            />
            <input
              type="password"
              placeholder="密碼"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border rounded-lg"
              required
            />
            
            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                placeholder="年份"
                value={birthYear}
                onChange={(e) => setBirthYear(parseInt(e.target.value))}
                className="p-3 border rounded-lg"
                required
              />
              <input
                type="number"
                placeholder="月份"
                value={birthMonth}
                onChange={(e) => setBirthMonth(parseInt(e.target.value))}
                className="p-3 border rounded-lg"
                required
              />
              <input
                type="number"
                placeholder="日期"
                value={birthDay}
                onChange={(e) => setBirthDay(parseInt(e.target.value))}
                className="p-3 border rounded-lg"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "處理中..." : "登記"}
            </button>
            
            <button
              type="button"
              onClick={() => setView("home")}
              className="w-full text-gray-600 py-2"
            >
              返回
            </button>
          </form>
        )}
        
        {/* Login View */}
        {view === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">登入</h2>
            
            <input
              type="email"
              placeholder="電郵"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border rounded-lg"
              required
            />
            <input
              type="password"
              placeholder="密碼"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border rounded-lg"
              required
            />
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "處理中..." : "登入"}
            </button>
            
            <button
              type="button"
              onClick={() => setView("home")}
              className="w-full text-gray-600 py-2"
            >
              返回
            </button>
          </form>
        )}
        
        {/* Dashboard View */}
        {view === "dashboard" && user && (
          <div className="space-y-6">
            <div className="bg-blue-100 p-4 rounded-lg">
              <h3 className="font-bold">歡迎, {user.name}!</h3>
              <p>生命密碼: {user.life_path_number}</p>
              <p className="text-sm text-gray-600">{LIFE_PATH_MEANINGS[user.life_path_number]}</p>
            </div>
            
            {/* Phone Analysis */}
            <div className="border p-4 rounded-lg">
              <h3 className="text-xl font-bold mb-4">電話號碼分析</h3>
              <input
                type="text"
                placeholder="輸入電話號碼 (8位數字)"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full p-3 border rounded-lg mb-4"
              />
              <button
                onClick={analyzePhone}
                disabled={loading || phoneNumber.length < 8}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? "分析中..." : "分析"}
              </button>
              
              {hexagram && (
                <div className="mt-4 bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-bold text-lg">卦象結果</h4>
                  <p className="text-2xl my-2">{hexagram.upper_trigram.name}{hexagram.lower_trigram.name}</p>
                  <p>{hexagram.hexagram_name}</p>
                  <p className="text-sm text-gray-600">{hexagram.judgment}</p>
                  <p className="text-sm">{hexagram.keywords}</p>
                </div>
              )}
            </div>
            
            {/* Recommendation */}
            <div className="border p-4 rounded-lg">
              <h3 className="text-xl font-bold mb-4">號碼推薦</h3>
              
              <select
                value={goalNumber}
                onChange={(e) => setGoalNumber(parseInt(e.target.value))}
                className="w-full p-3 border rounded-lg mb-4"
              >
                <option value={1}>事業發展 (1)</option>
                <option value={2}>創意工作 (2)</option>
                <option value={3}>學習考試 (3)</option>
                <option value={4}>健康生活 (4)</option>
                <option value={5}>財運 (5)</option>
                <option value={6}>人際關係 (6)</option>
                <option value={7}>貴人相助 (7)</option>
                <option value={8}>社交 (8)</option>
                <option value={9}>家庭 (9)</option>
              </select>
              
              <button
                onClick={getRecommendation}
                disabled={loading}
                className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {loading ? "處理中..." : "獲取推薦"}
              </button>
              
              {recommendation && (
                <div className="mt-4 bg-green-50 p-4 rounded-lg">
                  <p>{recommendation}</p>
                </div>
              )}
            </div>
            
            <button
              onClick={() => { setUser(null); setView("home"); }}
              className="w-full text-gray-600 py-2"
            >
              登出
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
