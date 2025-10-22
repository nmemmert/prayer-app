'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Login from '@/components/Login';
import Admin from '@/components/Admin';
import { db } from '@/lib/firebase';
import { doc, setDoc, collection, addDoc, getDocs, updateDoc, query, where } from 'firebase/firestore';
import emailjs from '@emailjs/browser';

interface Prayer {
  id: string;
  userId?: string;
  date: string;
  type: 'prayer' | 'praise';
  text: string;
  journal: string;
  email: string;
  prayFor: string;
  archived?: boolean;
  reminderFrequency?: 'daily' | 'weekly' | 'monthly' | 'never';
  includeActiveSummary?: boolean;
}

export default function Home() {
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'prayer' as 'prayer' | 'praise',
    text: '',
    journal: '',
    email: '',
    prayFor: '',
    reminderFrequency: 'never' as 'daily' | 'weekly' | 'monthly' | 'never',
    includeActiveSummary: false,
  });
  const [showAdmin, setShowAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'add' | 'active' | 'archived' | 'search'>('add');
  const itemsPerPage = 10;
  const { user, loading, logout, isAdmin } = useAuth();
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);

  // Ensure loading screen shows for at least 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoadingScreen(false);
    }, 5000); // 5 seconds minimum

    return () => clearTimeout(timer);
  }, []);

  // Load prayers from Firestore
  const loadPrayers = async () => {
    if (!user) return;
    
    try {
      const prayersRef = collection(db, 'prayers');
      const q = query(prayersRef, where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      
      const loadedPrayers: Prayer[] = [];
      querySnapshot.forEach((doc) => {
        loadedPrayers.push({ id: doc.id, ...doc.data() } as Prayer);
      });
      
      setPrayers(loadedPrayers);
    } catch (error) {
      console.error('Error loading prayers:', error);
    }
  };

  // Load prayers when user changes
  useEffect(() => {
    if (user) {
      loadPrayers();
    } else {
      setPrayers([]); // Clear prayers when user logs out
    }
  }, [user]);

  // Auto-populate email field with user's email
  useEffect(() => {
    if (user?.email) {
      setForm(prev => ({ ...prev, email: user.email! }));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert('Please log in to save prayers');
      return;
    }
    
    try {
      const newPrayerData = {
        userId: user.uid,
        date: form.date,
        type: form.type,
        text: form.text,
        journal: form.journal,
        email: form.email,
        prayFor: form.prayFor,
        reminderFrequency: form.reminderFrequency,
        includeActiveSummary: form.includeActiveSummary,
        archived: false,
      };
      
      // Save to Firestore
      const docRef = await addDoc(collection(db, 'prayers'), newPrayerData);
      
      // Add to local state with Firestore ID
      const newPrayer: Prayer = {
        id: docRef.id,
        ...newPrayerData,
      };
      setPrayers(prev => [...prev, newPrayer]);
      
      // Store user reminder preferences in Firestore
      if (form.reminderFrequency !== 'never') {
        await setDoc(doc(db, 'users', user.uid), {
          email: form.email,
          reminderFrequency: form.reminderFrequency,
          includeActiveSummary: form.includeActiveSummary,
          lastEmailSent: null,
        }, { merge: true });
        
        console.log('✅ Reminder preferences saved');
      }
      
      // Send immediate email using EmailJS if reminder frequency is set
      if (form.reminderFrequency !== 'never' && form.email) {
        try {
          // EmailJS configuration - you'll need to set these up at emailjs.com
          const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || 'your_service_id';
          const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || 'your_template_id';
          const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || 'your_public_key';
          
          const templateParams = {
            to_email: form.email,
            from_name: 'Prayer App',
            to_name: user.displayName || user.email?.split('@')[0] || 'Prayer User',
            subject: `New ${form.type} added - ${form.reminderFrequency} reminders enabled`,
            message: `Date: ${form.date}\n\n${form.text}\n\nJournal: ${form.journal || 'None'}${form.prayFor ? `\n\nPraying for: ${form.prayFor}` : ''}`,
            prayer_type: form.type,
            prayer_date: form.date,
            prayer_text: form.text,
            prayer_journal: form.journal || 'None',
            praying_for: form.prayFor || 'Not specified',
            reminder_frequency: form.reminderFrequency,
          };

          // Only send if EmailJS is properly configured
          if (serviceId !== 'your_service_id' && templateId !== 'your_template_id' && publicKey !== 'your_public_key') {
            await emailjs.send(serviceId, templateId, templateParams, publicKey);
            console.log('✅ Email sent via EmailJS');
          } else {
            console.log('ℹ️ EmailJS not configured - email sending skipped (this is normal)');
          }
        } catch (emailError) {
          console.error('❌ EmailJS error:', emailError);
          // Don't fail the prayer submission if email fails
        }
      }
      
      // Reset form
      setForm({
        date: new Date().toISOString().split('T')[0],
        type: 'prayer',
        text: '',
        journal: '',
        email: user.email || '',
        prayFor: '',
        reminderFrequency: 'never',
        includeActiveSummary: false,
      });
    } catch (error) {
      console.error('Error saving prayer:', error);
      alert('Failed to save prayer. Please try again.');
    }
  };

  const activePrayers = prayers.filter(prayer => !prayer.archived);
  const archivedPrayers = prayers.filter(prayer => prayer.archived);

  // Filter prayers based on search term
  const filteredActivePrayers = activePrayers.filter(prayer =>
    prayer.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prayer.journal.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prayer.type.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredArchivedPrayers = archivedPrayers.filter(prayer =>
    prayer.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prayer.journal.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prayer.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // For search tab, combine all filtered prayers
  const allPrayers = [...activePrayers, ...archivedPrayers];
  const filteredSearchPrayers = allPrayers.filter(prayer =>
    prayer.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prayer.journal.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prayer.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const totalActivePages = Math.ceil(filteredActivePrayers.length / itemsPerPage);
  const totalArchivedPages = Math.ceil(filteredArchivedPrayers.length / itemsPerPage);
  const totalSearchPages = Math.ceil(filteredSearchPrayers.length / itemsPerPage);
  
  const paginatedActivePrayers = filteredActivePrayers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  const paginatedArchivedPrayers = filteredArchivedPrayers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const paginatedSearchPrayers = filteredSearchPrayers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const currentPrayers = activeTab === 'active' ? paginatedActivePrayers : 
                         activeTab === 'archived' ? paginatedArchivedPrayers : 
                         paginatedSearchPrayers;
  const currentTotalPages = activeTab === 'active' ? totalActivePages : 
                           activeTab === 'archived' ? totalArchivedPages : 
                           totalSearchPages;

  const groupedPrayers = currentPrayers.reduce((acc, prayer) => {
    if (!acc[prayer.date]) acc[prayer.date] = [];
    acc[prayer.date].push(prayer);
    return acc;
  }, {} as Record<string, Prayer[]>);

  const sharePrayer = async (prayer: Prayer) => {
    const shareText = `${prayer.type.toUpperCase()}: ${prayer.text}${prayer.journal ? `\n\nJournal: ${prayer.journal}` : ''}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Shared ${prayer.type}`,
          text: shareText,
        });
        // Show success feedback
        const button = document.activeElement as HTMLElement;
        if (button) {
          const originalText = button.textContent;
          button.textContent = '✅ Shared!';
          button.classList.add('bg-green-600', 'hover:bg-green-700');
          setTimeout(() => {
            button.textContent = originalText;
            button.classList.remove('bg-green-600', 'hover:bg-green-700');
          }, 2000);
        }
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareText);
        // Show success feedback
        const button = document.activeElement as HTMLElement;
        if (button) {
          const originalText = button.textContent;
          button.textContent = '📋 Copied!';
          button.classList.add('bg-green-600', 'hover:bg-green-700');
          setTimeout(() => {
            button.textContent = originalText;
            button.classList.remove('bg-green-600', 'hover:bg-green-700');
          }, 2000);
        }
      } catch (clipboardErr) {
        alert('Prayer copied to clipboard!');
      }
    }
  };

  // Archive/unarchive prayers in Firestore
  const toggleArchivePrayer = async (prayerId: string, archived: boolean) => {
    try {
      await updateDoc(doc(db, 'prayers', prayerId), {
        archived: archived
      });
      
      // Update local state
      setPrayers(prev => prev.map(p => 
        p.id === prayerId ? { ...p, archived: archived } : p
      ));
    } catch (error) {
      console.error('Error updating prayer archive status:', error);
      alert('Failed to update prayer. Please try again.');
    }
  };

  if (loading || showLoadingScreen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center p-4">
        <div className="text-center">
          {/* Animated prayer icon */}
          <div className="mb-8 relative">
            <div className="w-24 h-24 mx-auto relative">
              {/* Outer ring */}
              <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full animate-spin"></div>
              {/* Inner ring */}
              <div className="absolute inset-2 border-4 border-transparent border-t-blue-400 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
              {/* Center icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-3xl animate-pulse">🙏</div>
              </div>
            </div>
            {/* Floating particles */}
            <div className="absolute -top-2 -right-2 w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
            <div className="absolute -bottom-1 -left-3 w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.5s'}}></div>
            <div className="absolute top-1/2 -right-4 w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{animationDelay: '1s'}}></div>
          </div>
          
          {/* Loading text */}
          <h1 className="text-2xl font-bold text-white mb-2 animate-pulse">
            Prayer App
          </h1>
          <p className="text-gray-400 text-lg mb-4">
            Preparing your spiritual journey...
          </p>
          
          {/* Inspirational quote */}
          <div className="max-w-xs mx-auto">
            <blockquote className="text-gray-300 italic text-sm leading-relaxed">
              "Be anxious for nothing, but in everything by prayer and supplication, with thanksgiving, let your requests be made known to God."
            </blockquote>
            <cite className="text-gray-500 text-xs mt-2 block">
              — Philippians 4:6
            </cite>
          </div>
          
          {/* Progress dots */}
          <div className="flex justify-center space-x-2 mt-8">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0s'}}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Prayer App</h1>
          <p className="text-gray-400 text-sm mt-1">
            {activeTab === 'add' ? 'Add New Prayer or Praise' : 
             activeTab === 'search' ? 'Search Results' : 
             `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Prayers`}
          </p>
        </div>
        <div className="flex gap-4">
          {isAdmin && (
            <button
              onClick={() => setShowAdmin(!showAdmin)}
              className="px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded text-base font-medium"
            >
              {showAdmin ? 'Hide Admin' : 'Admin'}
            </button>
          )}
          <button onClick={() => logout()} className="px-4 py-3 bg-red-600 hover:bg-red-700 rounded text-base font-medium">
            Logout
          </button>
        </div>
      </div>
      
      {showAdmin && <Admin />}
      
      {activeTab === 'add' && (
        <form onSubmit={handleSubmit} className="max-w-md mx-auto mb-8 space-y-6">
          <div>
            <label className="block mb-2 text-lg">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={e => setForm(prev => ({ ...prev, date: e.target.value }))}
              className="w-full p-3 bg-gray-800 border border-gray-600 rounded text-base"
              required
            />
          </div>
          
          <div>
            <label className="block mb-2 text-lg">Type</label>
            <select
              value={form.type}
              onChange={e => setForm(prev => ({ ...prev, type: e.target.value as 'prayer' | 'praise' }))}
              className="w-full p-3 bg-gray-800 border border-gray-600 rounded text-base"
            >
              <option value="prayer">Prayer</option>
              <option value="praise">Praise</option>
            </select>
          </div>

          <div>
            <label className="block mb-2 text-lg">Pray For (Person)</label>
            <input
              type="text"
              value={form.prayFor}
              onChange={e => setForm(prev => ({ ...prev, prayFor: e.target.value }))}
              className="w-full p-3 bg-gray-800 border border-gray-600 rounded text-base"
              placeholder="Name of person to pray for..."
            />
          </div>
          
          <div>
            <label className="block mb-2 text-lg">Text</label>
            <textarea
              value={form.text}
              onChange={e => setForm(prev => ({ ...prev, text: e.target.value }))}
              className="w-full p-3 bg-gray-800 border border-gray-600 rounded text-base min-h-[100px]"
              placeholder="Enter your prayer or praise..."
              required
            />
          </div>
          
          <div>
            <label className="block mb-2 text-lg">Journal</label>
            <textarea
              value={form.journal}
              onChange={e => setForm(prev => ({ ...prev, journal: e.target.value }))}
              className="w-full p-3 bg-gray-800 border border-gray-600 rounded text-base min-h-[100px]"
              placeholder="Optional journal entry..."
            />
          </div>

          <div>
            <label className="block mb-2 text-lg">Email (for reminders)</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
              className="w-full p-3 bg-gray-800 border border-gray-600 rounded text-base"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block mb-2 text-lg">Reminder Frequency</label>
            <select
              value={form.reminderFrequency}
              onChange={e => setForm(prev => ({ ...prev, reminderFrequency: e.target.value as 'daily' | 'weekly' | 'monthly' | 'never' }))}
              className="w-full p-3 bg-gray-800 border border-gray-600 rounded text-base"
            >
              <option value="never">Never</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              checked={form.includeActiveSummary}
              onChange={e => setForm(prev => ({ ...prev, includeActiveSummary: e.target.checked }))}
              className="w-6 h-6 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label className="ml-3 text-base font-medium" onClick={() => setForm(prev => ({ ...prev, includeActiveSummary: !prev.includeActiveSummary }))}>
              Include active prayers summary in reminders
            </label>
          </div>
          
          <button type="submit" className="w-full p-4 bg-blue-600 hover:bg-blue-700 rounded text-lg font-semibold mt-6">
            Add Entry
          </button>
        </form>
      )}

      {activeTab !== 'add' && (
        <div className="max-w-4xl mx-auto">
          {activeTab === 'search' && (
            <div className="mb-6">
              <input
                type="text"
                placeholder="Search all prayers..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to first page when searching
                }}
                className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              {searchTerm && (
                <p className="text-gray-400 text-sm mt-2">
                  Found {filteredSearchPrayers.length} prayer{filteredSearchPrayers.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}

          {currentPrayers.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {activeTab === 'search' && searchTerm ? 'No prayers found matching your search.' : 'No prayers or praises found.'}
              </p>
            </div>
          )}

          {Object.keys(groupedPrayers).sort().reverse().map(date => (
            <div key={date} className="mb-8">
              <h2 className="text-xl font-semibold mb-4">{new Date(date).toLocaleDateString()}</h2>
              {groupedPrayers[date].map(prayer => (
                <div key={prayer.id} className={`bg-gray-800 p-4 rounded mb-4 ${prayer.archived || activeTab === 'search' ? 'opacity-75 border border-gray-600' : ''}`}>
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-medium capitalize text-lg">{prayer.type}</span>
                    <button
                      onClick={() => sharePrayer(prayer)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg"
                      title="Share this prayer"
                    >
                      📤 Share
                    </button>
                  </div>
                  <p className="mb-2">{prayer.text}</p>
                  {prayer.journal && (
                    <div className="border-t border-gray-600 pt-2">
                      <p className="text-sm text-gray-400">Journal: {prayer.journal}</p>
                    </div>
                  )}
                  {prayer.prayFor && (
                    <div className="border-t border-gray-600 pt-2">
                      <p className="text-sm text-gray-400">Pray For: {prayer.prayFor}</p>
                    </div>
                  )}
                  {activeTab !== 'search' && (
                    <div className="flex justify-end mt-3 pt-2 border-t border-gray-600">
                      {prayer.archived ? (
                        <button
                          onClick={() => toggleArchivePrayer(prayer.id, false)}
                          className="px-3 py-1 text-green-500 hover:text-green-400 text-sm font-medium hover:bg-gray-700 rounded transition-colors"
                          title="Restore prayer"
                        >
                          ↩️ Restore
                        </button>
                      ) : (
                        <button
                          onClick={() => toggleArchivePrayer(prayer.id, true)}
                          className="px-3 py-1 text-red-500 hover:text-red-400 text-sm font-medium hover:bg-gray-700 rounded transition-colors"
                          title="Archive prayer"
                        >
                          📂 Archive
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
          
          {/* Pagination */}
          {currentTotalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8 mb-6">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed rounded text-white"
              >
                Previous
              </button>
              
              <span className="text-gray-300">
                Page {currentPage} of {currentTotalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(currentTotalPages, prev + 1))}
                disabled={currentPage === currentTotalPages}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed rounded text-white"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Bottom Navigation Tabs */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 via-gray-900 to-gray-800 border-t border-gray-700 shadow-2xl">
        <div className="grid grid-cols-4 px-2 py-2">
          <button
            onClick={() => {
              setActiveTab('add');
              setCurrentPage(1);
            }}
            className={`mx-1 py-3 px-2 rounded-xl text-center transition-all duration-200 text-sm font-semibold flex flex-col items-center justify-center min-h-[60px] ${
              activeTab === 'add' 
                ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg transform scale-105' 
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50 active:bg-gray-700/50'
            }`}
          >
            <span className="text-lg mb-1">➕</span>
            <span className="text-xs leading-tight">Add</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('active');
              setCurrentPage(1);
              setSearchTerm(''); // Clear search when switching to active
            }}
            className={`mx-1 py-3 px-2 rounded-xl text-center transition-all duration-200 text-sm font-semibold flex flex-col items-center justify-center min-h-[60px] ${
              activeTab === 'active' 
                ? 'bg-gradient-to-br from-green-600 to-green-700 text-white shadow-lg transform scale-105' 
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50 active:bg-gray-700/50'
            }`}
          >
            <span className="text-lg mb-1">📖</span>
            <span className="text-xs leading-tight">Active</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('archived');
              setCurrentPage(1);
              setSearchTerm(''); // Clear search when switching to archived
            }}
            className={`mx-1 py-3 px-2 rounded-xl text-center transition-all duration-200 text-sm font-semibold flex flex-col items-center justify-center min-h-[60px] ${
              activeTab === 'archived' 
                ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white shadow-lg transform scale-105' 
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50 active:bg-gray-700/50'
            }`}
          >
            <span className="text-lg mb-1">📂</span>
            <span className="text-xs leading-tight">Archived</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('search');
              setCurrentPage(1);
            }}
            className={`mx-1 py-3 px-2 rounded-xl text-center transition-all duration-200 text-sm font-semibold flex flex-col items-center justify-center min-h-[60px] ${
              activeTab === 'search' 
                ? 'bg-gradient-to-br from-orange-600 to-orange-700 text-white shadow-lg transform scale-105' 
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50 active:bg-gray-700/50'
            }`}
          >
            <span className="text-lg mb-1">🔍</span>
            <span className="text-xs leading-tight">Search</span>
          </button>
        </div>
      </div>
      
      {/* Add padding to account for fixed bottom nav */}
      <div className="pb-20"></div>
    </div>
  );
}
