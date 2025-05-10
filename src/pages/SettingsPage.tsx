import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export default function SettingsPage() {
  const { user } = useAuth();
  const [firstName, setFirstName] = useState(user?.user_metadata?.first_name || "");
  const [lastName, setLastName] = useState(user?.user_metadata?.last_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [language, setLanguage] = useState("sv");
  const [message, setMessage] = useState<string | null>(null);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({
      data: { first_name: firstName, last_name: lastName }
    });
    setMessage(error ? error.message : "Profile updated!");
  };

  const handleEmailSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    const { error } = await supabase.auth.updateUser({ email });
    setMessage(error ? error.message : "Email updated! Check your inbox to confirm.");
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    const { error } = await supabase.auth.updateUser({ password });
    setMessage(error ? error.message : "Password updated!");
    setPassword("");
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg p-8 mt-8 shadow space-y-8">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      {message && <div className="mb-4 text-green-600">{message}</div>}
      <form onSubmit={handleProfileSave} className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Profile</h2>
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <label className="block mb-1 font-medium">First Name</label>
            <input className="border rounded px-3 py-2 w-full" value={firstName} onChange={e => setFirstName(e.target.value)} />
          </div>
          <div className="flex-1">
            <label className="block mb-1 font-medium">Last Name</label>
            <input className="border rounded px-3 py-2 w-full" value={lastName} onChange={e => setLastName(e.target.value)} />
          </div>
        </div>
        <button type="submit" className="bg-primary text-white px-4 py-2 rounded">Save Profile</button>
      </form>
      <form onSubmit={handleEmailSave} className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Change Email</h2>
        <input className="border rounded px-3 py-2 w-full mb-2" type="email" value={email} onChange={e => setEmail(e.target.value)} />
        <button type="submit" className="bg-primary text-white px-4 py-2 rounded">Update Email</button>
      </form>
      <form onSubmit={handlePasswordSave} className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Change Password</h2>
        <input className="border rounded px-3 py-2 w-full mb-2" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="New password" />
        <button type="submit" className="bg-primary text-white px-4 py-2 rounded">Update Password</button>
      </form>
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Language</h2>
        <select className="border rounded px-3 py-2 w-full" value={language} onChange={e => setLanguage(e.target.value)}>
          <option value="sv">Svenska</option>
          <option value="en">English</option>
        </select>
      </div>
    </div>
  );
} 