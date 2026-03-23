import React from 'react';
import { BorderBeam } from './BorderBeam';

export default {
  default: (
    <div style={{ padding: 24, background: '#f6f7f9', minHeight: 360 }}>
      <BorderBeam className="bg-white shadow-xl p-6 md:p-8 max-w-sm">
        <h2 className="text-xl font-semibold mb-1">Login</h2>
        <p className="text-gray-500 mb-6">Enter your credentials to access your account.</p>

        <label className="block text-sm font-medium">Email</label>
        <input
          className="mt-1 mb-4 w-full rounded-xl border border-gray-200 px-4 py-3 shadow-sm"
          placeholder="Enter your email"
        />

        <label className="block text-sm font-medium">Password</label>
        <input
          type="password"
          className="mt-1 mb-6 w-full rounded-xl border border-gray-200 px-4 py-3 shadow-sm"
          placeholder="Enter your password"
        />

        <div className="flex items-center justify-between">
          <button className="rounded-xl border px-5 py-3 shadow-sm">Register</button>
          <button className="rounded-xl bg-black px-5 py-3 text-white">Login</button>
        </div>
      </BorderBeam>
    </div>
  ),
};
