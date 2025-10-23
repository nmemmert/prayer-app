'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
}

interface AdminConfig {
  adminEmails: string[];
}

export default function Admin() {
  const { user, isAdmin } = useAuth();
  const [config, setConfig] = useState<SMTPConfig>({
    host: '',
    port: 587,
    secure: false,
    user: '',
    pass: '',
    from: '',
  });
  const [adminConfig, setAdminConfig] = useState<AdminConfig>({
    adminEmails: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    totalPrayers: 0,
    totalSharedPrayers: 0,
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      // Load SMTP config
      const smtpDoc = await getDoc(doc(db, 'config', 'smtp'));
      if (smtpDoc.exists()) {
        setConfig(smtpDoc.data() as SMTPConfig);
      }
      
      // Load admin config
      const adminDoc = await getDoc(doc(db, 'config', 'admin'));
      if (adminDoc.exists()) {
        setAdminConfig(adminDoc.data() as AdminConfig);
      } else {
        // Default admin config
        setAdminConfig({ adminEmails: ['your-admin-email@example.com'] });
      }
      
      // Load metrics
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const prayersSnapshot = await getDocs(collection(db, 'prayers'));
      const sharedPrayersSnapshot = await getDocs(collection(db, 'sharedPrayers'));
      
      setMetrics({
        totalUsers: usersSnapshot.size,
        totalPrayers: prayersSnapshot.size,
        totalSharedPrayers: sharedPrayersSnapshot.size,
      });
      
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    // Validate required fields
    if (!config.host.trim()) {
      setMessage('SMTP host is required.');
      return;
    }
    if (!config.user.trim()) {
      setMessage('SMTP username is required.');
      return;
    }
    if (!config.pass.trim()) {
      setMessage('SMTP password is required.');
      return;
    }
    if (!config.from.trim()) {
      setMessage('From email is required.');
      return;
    }
    if (isNaN(config.port) || config.port < 1 || config.port > 65535) {
      setMessage('Port must be a valid number between 1 and 65535.');
      return;
    }

    setSaving(true);
    setMessage('');
    try {
      await setDoc(doc(db, 'config', 'smtp'), config);
      setMessage('SMTP configuration saved successfully!');
    } catch (error: unknown) {
      console.error('Error saving config:', error);
      const err = error as { code?: string; message?: string };
      if (err.code === 'permission-denied') {
        setMessage('Permission denied. Please check your authentication and Firestore security rules.');
      } else if (err.code === 'unavailable') {
        setMessage('Firestore is currently unavailable. Please try again later.');
      } else {
        setMessage(`Error saving configuration: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const saveAdminConfig = async () => {
    setSaving(true);
    setMessage('');
    try {
      await setDoc(doc(db, 'config', 'admin'), adminConfig);
      setMessage('Admin configuration saved successfully!');
    } catch (error) {
      console.error('Error saving admin config:', error);
      setMessage('Error saving admin configuration.');
    } finally {
      setSaving(false);
    }
  };

  const addAdminEmail = async () => {
    if (!newAdminEmail.trim()) return;
    
    const updatedEmails = [...adminConfig.adminEmails, newAdminEmail.trim()];
    const updatedConfig = { ...adminConfig, adminEmails: updatedEmails };
    
    try {
      await setDoc(doc(db, 'config', 'admin'), updatedConfig);
      setAdminConfig(updatedConfig);
      setNewAdminEmail('');
      setMessage('Admin email added successfully!');
    } catch (error) {
      console.error('Error adding admin email:', error);
      setMessage('Error adding admin email.');
    }
  };

  const removeAdminEmail = async (email: string) => {
    const updatedEmails = adminConfig.adminEmails.filter(e => e !== email);
    const updatedConfig = { ...adminConfig, adminEmails: updatedEmails };
    
    try {
      await setDoc(doc(db, 'config', 'admin'), updatedConfig);
      setAdminConfig(updatedConfig);
      setMessage('Admin email removed successfully!');
    } catch (error) {
      console.error('Error removing admin email:', error);
      setMessage('Error removing admin email.');
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-red-900 border border-red-700 rounded-lg">
        <h2 className="text-xl font-bold text-red-100 mb-2">Access Denied</h2>
        <p className="text-red-200">You don&apos;t have permission to access the admin panel.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="p-4">Loading admin settings...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-gray-800 rounded-lg">
      <h2 className="text-2xl font-bold mb-6 text-white">Admin Settings</h2>
      
      <div className="mb-6 p-4 bg-gray-700 rounded">
        <h3 className="text-xl font-semibold text-white mb-4">Analytics Dashboard</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{metrics.totalUsers}</div>
            <div className="text-sm text-gray-300">Total Users</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{metrics.totalPrayers}</div>
            <div className="text-sm text-gray-300">Total Prayers</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">{metrics.totalSharedPrayers}</div>
            <div className="text-sm text-gray-300">Shared Prayers</div>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-white mb-4">SMTP Configuration</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">SMTP Host</label>
            <input
              type="text"
              value={config.host}
              onChange={(e) => setConfig(prev => ({ ...prev, host: e.target.value }))}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
              placeholder="smtp.gmail.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Port</label>
            <input
              type="number"
              value={config.port}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                setConfig(prev => ({ ...prev, port: isNaN(value) ? 587 : value }));
              }}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
              min="1"
              max="65535"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Username</label>
            <input
              type="text"
              value={config.user}
              onChange={(e) => setConfig(prev => ({ ...prev, user: e.target.value }))}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
              placeholder="your-email@gmail.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
            <input
              type="password"
              value={config.pass}
              onChange={(e) => setConfig(prev => ({ ...prev, pass: e.target.value }))}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
              placeholder="your-app-password"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">From Email</label>
            <input
              type="email"
              value={config.from}
              onChange={(e) => setConfig(prev => ({ ...prev, from: e.target.value }))}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
              placeholder="noreply@yourapp.com"
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="secure"
              checked={config.secure}
              onChange={(e) => setConfig(prev => ({ ...prev, secure: e.target.checked }))}
              className="mr-2"
            />
            <label htmlFor="secure" className="text-sm font-medium text-gray-300">Use SSL/TLS</label>
          </div>
        </div>
        
        <div className="pt-4">
          <button
            onClick={saveConfig}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded text-white font-medium"
          >
            {saving ? 'Saving...' : 'Save SMTP Settings'}
          </button>
          
          {message && (
            <p className={`mt-2 text-sm ${message.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>
              {message}
            </p>
          )}
        </div>
        
        <h3 className="text-xl font-semibold text-white mb-4">Admin Configuration</h3>
        
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Admin Emails</label>
            <input
              type="text"
              value={adminConfig.adminEmails.join(', ')}
              onChange={(e) => setAdminConfig(prev => ({ ...prev, adminEmails: e.target.value.split(',').map(email => email.trim()) }))}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
              placeholder="admin1@example.com, admin2@example.com"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={newAdminEmail}
            onChange={(e) => setNewAdminEmail(e.target.value)}
            className="flex-1 p-2 bg-gray-700 border border-gray-600 rounded text-white"
            placeholder="new-admin@example.com"
          />
          
          <button
            onClick={addAdminEmail}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white font-medium"
          >
            Add Email
          </button>
        </div>
        
        <div className="pt-4">
          <button
            onClick={saveAdminConfig}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded text-white font-medium"
          >
            {saving ? 'Saving...' : 'Save Admin Settings'}
          </button>
        </div>
        
        <div className="border-t border-gray-600 pt-6 mt-6">
          <h3 className="text-xl font-semibold text-white mb-4">Admin Email Management</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">Current Admin Emails</label>
            <div className="space-y-2">
              {adminConfig.adminEmails.map((email, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-700 p-2 rounded">
                  <span className="text-gray-200">{email}</span>
                  <button
                    onClick={() => removeAdminEmail(email)}
                    className="text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex gap-2">
            <input
              type="email"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              placeholder="new-admin@example.com"
              className="flex-1 p-2 bg-gray-700 border border-gray-600 rounded text-white"
            />
            <button
              onClick={addAdminEmail}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white"
            >
              Add Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}