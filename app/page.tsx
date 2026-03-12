"use client";

import { useState, useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

interface User {
  id: number;
  name: string;
  email: string;
  life_path_number: number;
  is_admin?: boolean;
}

interface Hexagram {
  upper_trigram: { name: string; en: string };
  lower_trigram: { name: string; en: string };
  hexagram_name: string;
  judgment: string;
  keywords: string;
}

interface Stats {
  total_users: number;
  total_phone_numbers: number;
  total_life_paths: number;
  total_hexagrams: number;
}

const LIFE_PATH_MEANINGS: Record<number, string> = {
  1: "領導力、有主見",
  2: "設計、策劃",
  3: "聰明、智慧",
  4: "健康、規律",
  5: "財富、人群核心",
  6: "愛心、耐心",
  7: "貴人、專家",
  8: "時尚，八面玲瓏",
  9: "包容",
};

export default function Home() {
  const [view, setView] = useState<"home" | "register" | "login" | "dashboard" | "admin" | "reset-password">("home");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [birthYear, setBirthYear] = useState(1990);
  const [birthMonth, setBirthMonth] = useState(1);
  const [birthDay, setBirthDay] = useState(1);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [hexagram, setHexagram] = useState<Hexagram | null>(null);
  const [goalNumber, setGoalNumber] = useState(5);
  const [recommendation, setRecommendation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Admin states
  const [adminStats, setAdminStats] = useState<Stats | null>(null);
  const [allUsers, setAllUsers] = useState([]);
  const [allPhones, setAllPhones] = useState([]);

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
        email: email,
        life_path_number: data.life_path_number,
      });
      setIsAdmin(data.is_admin || false);
      setView(data.is_admin ? "admin" : "dashboard");
    } catch (err) {
      setError("Invalid credentials.");
    }
    
    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    
    const oldPassword = (e.target as any).oldPassword.value;
    const newPassword = (e.target as any).newPassword.value;
    
    try {
      const res = await fetch(`${API_URL}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email, 
          old_password: oldPassword,
          new_password: newPassword 
        }),
      });
      
      if (!res.ok) throw new Error("Reset failed");
      
      setSuccess("Password updated successfully!");
      setTimeout(() => setView("login"), 2000);
    } catch (err) {
      setError("Failed to reset password.");
    }
    
    setLoading(false);
  };

  const analyzePhone = async () => {
    if (!phoneNumber || !user) return;
    setLoading(true);
    setError("");
    
    try {
      const digits = phoneNumber.replace(/\D/g, "").split("").map(Number);
      const first4 = digits.slice(0, 4).reduce((a, b) => a + b, 0);
      const last4 = digits.slice(4, 8).reduce((a, b) => a + b, 0);
      const upper = first4 % 8 || 8;
      const lower = last4 % 8 || 8;
      
      const res = await fetch(`${API_URL}/hexagram/${upper}/${lower}`);
      const data = await res.json();
      setHexagram(data);
      
      // Save to backend
      await fetch(`${API_URL}/analyze-phone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone_number: phoneNumber,
          user_id: user.id
        }),
      });
    } catch (err) {
      setError("Analysis failed.");
    }
    
    setLoading(false);
  };

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

  // Admin functions
  const loadAdminStats = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/stats`);
      const data = await res.json();
      setAdminStats(data);
    } catch (err) {
      console.error("Failed to load stats");
    }
  };

  const loadAllUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/users`);
      const data = await res.json();
      setAllUsers(data.users);
    } catch (err) {
      console.error("Failed to load users");
    }
  };

  const loadAllPhones = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/phone-numbers`);
      const data = await res.json();
      setAllPhones(data.phone_numbers);
    } catch (err) {
      console.error("Failed to load phones");
    }
  };

  // Auto load admin data
  useEffect(() => {
    if (isAdmin && view === "admin") {
      loadAdminStats();
      loadAllUsers();
      loadAllPhones();
    }
  }, [isAdmin, view]);

  // Admin View
  if (isAdmin && view === "admin") {
    return (
      <main className="min-h-screen p-8 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold">🧘 MobileQ Admin 後台</h1>
            <button
              onClick={() => { setUser(null); setIsAdmin(false); setView("home"); }}
              className="bg-red-500 text-white px-4 py-2 rounded"
            >
              登出
            </button>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <button 
              onClick={() => { loadAdminStats(); loadAllUsers(); }}
              className="bg-blue-500 text-white p-6 rounded-lg text-center"
            >
              <div className="text-3xl font-bold">{adminStats?.total_users || "-"}</div>
              <div>總用戶</div>
            </button>
            <button 
              onClick={() => { loadAdminStats(); loadAllPhones(); }}
              className="bg-green-500 text-white p-6 rounded-lg text-center"
            >
              <div className="text-3xl font-bold">{adminStats?.total_phone_numbers || "-"}</div>
              <div>總號碼</div>
            </button>
            <div className="bg-purple-500 text-white p-6 rounded-lg text-center">
              <div className="text-3xl font-bold">{adminStats?.total_life_paths || "-"}</div>
              <div>生命密碼</div>
            </div>
            <div className="bg-yellow-500 text-white p-6 rounded-lg text-center">
              <div className="text-3xl font-bold">{adminStats?.total_hexagrams || "-"}</div>
              <div>卦象</div>
            </div>
          </div>
          
          {/* Users Table */}
          <div className="bg-white p-6 rounded-lg mb-8">
            <h2 className="text-2xl font-bold mb-4">用戶列表</h2>
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 text-left">ID</th>
                  <th className="p-2 text-left">Name</th>
                  <th className="p-2 text-left">Email</th>
                  <th className="p-2 text-left">生命密碼</th>
                  <th className="p-2 text-left">註冊日期</th>
                </tr>
              </thead>
              <tbody>
                {allUsers.map((u: any) => (
                  <tr key={u.id} className="border-b">
                    <td className="p-2">{u.id}</td>
                    <td className="p-2">{u.name}</td>
                    <td className="p-2">{u.email}</td>
                    <td className="p-2">{u.life_path_number}</td>
                    <td className="p-2">{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Phone Numbers Table */}
          <div className="bg-white p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">電話號碼列表</h2>
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 text-left">ID</th>
                  <th className="p-2 text-left">號碼</th>
                  <th className="p-2 text-left">用戶</th>
                  <th className="p-2 text-left">Email</th>
                  <th className="p-2 text-left">日期</th>
                </tr>
              </thead>
              <tbody>
                {allPhones.map((p: any) => (
                  <tr key={p.id} className="border-b">
                    <td className="p-2">{p.id}</td>
                    <td className="p-2">{p.phone_number}</td>
                    <td className="p-2">{p.name}</td>
                    <td className="p-2">{p.email}</td>
                    <td className="p-2">{new Date(p.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    );
  }

  // Main UI
  return (
    <main className="min-h-screen p-8 bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-md mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2">🧘 MobileQ 卦號</h1>
        <p className="text-center text-gray-600 mb-8">電話號碼運勢分析系統</p>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}
        
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
        
        {view === "login" && (
          <div className="space-y-4">
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
            </form>
            
            <button
              onClick={() => setView("reset-password")}
              className="w-full text-blue-600 py-2"
            >
              忘記密碼？
            </button>
            
            <button
              onClick={() => setView("home")}
              className="w-full text-gray-600 py-2"
            >
              返回
            </button>
          </div>
        )}
        
        {view === "reset-password" && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">重設密碼</h2>
            
            <input
              type="email"
              placeholder="電郵"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border rounded-lg"
              required
            />
            <input
              name="oldPassword"
              type="password"
              placeholder="舊密碼"
              className="w-full p-3 border rounded-lg"
              required
            />
            <input
              name="newPassword"
              type="password"
              placeholder="新密碼"
              className="w-full p-3 border rounded-lg"
              required
            />
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "處理中..." : "重設"}
            </button>
            
            <button
              type="button"
              onClick={() => setView("login")}
              className="w-full text-gray-600 py-2"
            >
              返回
            </button>
          </form>
        )}
        
        {view === "dashboard" && user && (
          <div className="space-y-6">
            <div className="bg-blue-100 p-4 rounded-lg">
              <h3 className="font-bold">歡迎, {user.name}!</h3>
              <p>生命密碼: {user.life_path_number}</p>
              <p className="text-sm text-gray-600">{LIFE_PATH_MEANINGS[user.life_path_number]}</p>
            </div>
            
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
                </div>
              )}
            </div>
            
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
