'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { storage, db } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useTheme } from 'next-themes';

interface UserProfile {
  avatarUrl?: string;
  theme?: string;
  categories?: string[];
}

export default function Profile() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [profile, setProfile] = useState<UserProfile>({});
  const [uploading, setUploading] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    try {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProfile(docSnap.data() as UserProfile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const storageRef = ref(storage, `avatars/${user.uid}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await updateDoc(doc(db, 'users', user.uid), { avatarUrl: url });
      setProfile(prev => ({ ...prev, avatarUrl: url }));
    } catch (error) {
      console.error('Error uploading avatar:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleThemeChange = async (newTheme: string) => {
    setTheme(newTheme);
    if (user) {
      await updateDoc(doc(db, 'users', user.uid), { theme: newTheme });
      setProfile(prev => ({ ...prev, theme: newTheme }));
    }
  };

  const addCategory = async () => {
    if (!newCategory.trim() || !user) return;
    const updatedCategories = [...(profile.categories || []), newCategory.trim()];
    await updateDoc(doc(db, 'users', user.uid), { categories: updatedCategories });
    setProfile(prev => ({ ...prev, categories: updatedCategories }));
    setNewCategory('');
  };

  const removeCategory = async (category: string) => {
    if (!user) return;
    const updatedCategories = (profile.categories || []).filter(c => c !== category);
    await updateDoc(doc(db, 'users', user.uid), { categories: updatedCategories });
    setProfile(prev => ({ ...prev, categories: updatedCategories }));
  };

  return (
    <div className="max-w-md mx-auto mb-8 p-6 bg-gray-800 rounded-lg">
      <h2 className="text-2xl font-bold mb-6">Profile</h2>

      {/* Avatar */}
      <div className="mb-6">
        <label className="block mb-2 text-lg">Avatar</label>
        {profile.avatarUrl && (
          <img src={profile.avatarUrl} alt="Avatar" className="w-20 h-20 rounded-full mb-2" />
        )}
        <input
          type="file"
          accept="image/*"
          onChange={handleAvatarUpload}
          disabled={uploading}
          className="w-full p-3 bg-gray-700 border border-gray-600 rounded"
        />
        {uploading && <p className="text-sm text-gray-400 mt-1">Uploading...</p>}
      </div>

      {/* Theme */}
      <div className="mb-6">
        <label className="block mb-2 text-lg">Theme</label>
        <select
          value={theme}
          onChange={(e) => handleThemeChange(e.target.value)}
          className="w-full p-3 bg-gray-700 border border-gray-600 rounded"
        >
          <option value="dark">Dark</option>
          <option value="light">Light</option>
          <option value="system">System</option>
        </select>
      </div>

      {/* Categories */}
      <div className="mb-6">
        <label className="block mb-2 text-lg">Prayer Categories</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Add category"
            className="flex-1 p-3 bg-gray-700 border border-gray-600 rounded"
          />
          <button
            onClick={addCategory}
            className="px-4 py-3 bg-green-600 hover:bg-green-700 rounded"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(profile.categories || []).map(category => (
            <span key={category} className="bg-gray-700 px-3 py-1 rounded flex items-center gap-2">
              {category}
              <button
                onClick={() => removeCategory(category)}
                className="text-red-400 hover:text-red-300"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}