import React, { useState } from 'react';
import axios from 'axios';
import { API_URL } from './api';

function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}token/`, { username, password });
      localStorage.setItem('access', res.data.access);
      localStorage.setItem('refresh', res.data.refresh);
      // Set the global axios header for future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.access}`;
      onLoginSuccess();
    } catch (err) {
      alert("Login Failed: Check your credentials.");
    }
  };

  return (
    <div className="min-h-screen bg-append-navy flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
           <h1 className="text-3xl font-black italic uppercase">Append <span className="text-append-orange">One</span></h1>
           <p className="text-[10px] font-bold text-slate-400 tracking-[0.3em] uppercase mt-2">Inspector Portal</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold focus:border-append-orange outline-none"
            placeholder="USERNAME"
            onChange={(e) => setUsername(e.target.value)}
          />
          <input 
            type="password"
            className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold focus:border-append-orange outline-none"
            placeholder="PASSWORD"
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" className="w-full bg-append-orange text-black py-5 rounded-full font-black text-lg shadow-xl shadow-orange-100 active:scale-95 transition-all">
            SIGN IN
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;