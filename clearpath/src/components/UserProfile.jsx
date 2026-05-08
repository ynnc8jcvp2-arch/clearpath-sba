/**
 * UserProfile Component
 *
 * Displays user profile information in header with dropdown menu.
 * Shows user's name/email and provides sign-out option.
 *
 * Usage:
 * <UserProfile />
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, LogOut } from 'lucide-react';
import { useAuth } from '../auth/useAuth';

export function UserProfile() {
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  // Get display name from user metadata or email
  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
  const email = user.email;
  const initials = displayName
    .split(' ')
    .map(n => n.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);

  const handleSignOut = async () => {
    setMenuOpen(false);
    await signOut();
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Profile Button */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center gap-2 px-2 py-1.5 hover:bg-[#1B3A6B] transition-colors duration-150 text-sm cursor-pointer"
      >
        {/* Avatar */}
        <div className="w-7 h-7 bg-white text-[#0A2540] flex items-center justify-center font-bold text-[10px]">
          {initials}
        </div>

        {/* Name */}
        <div className="text-left hidden sm:block">
          <p className="font-semibold text-white text-xs">{displayName}</p>
        </div>

        {/* Chevron */}
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-300 transition-transform duration-200 ${
            menuOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {menuOpen && (
        <div className="absolute right-0 mt-1 w-56 bg-white border border-slate-300 shadow-lg z-50 overflow-hidden">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
            <p className="font-semibold text-slate-900 text-sm">{displayName}</p>
            <p className="text-xs text-slate-600 truncate">{email}</p>
          </div>

          {/* Sign Out Button */}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-700 hover:bg-red-50 transition-colors duration-150 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

export default UserProfile;
