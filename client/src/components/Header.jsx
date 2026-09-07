import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../features/auth/hooks/useAuth.js';
import './header.scss';

export default function Header() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const avatarRef = useRef(null);
  const navigate = useNavigate();
  const { user, handleLogout } = useAuth();

  const usernameInitial = user?.username ? user.username.charAt(0).toUpperCase() : '';

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !avatarRef.current.contains(event.target)
      ) {
        setIsDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleSignOut = async () => {
    await handleLogout();
    setIsDropdownOpen(false);
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-container">
        {/* Logo */}
        <Link to="/" className="header-logo">
          Prepify
        </Link>

        {/* Avatar & Dropdown */}
        <div className="header-profile">
          <button
            ref={avatarRef}
            className="avatar-button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            aria-label="Toggle profile menu"
          >
            {usernameInitial}
          </button>

          {/* Dropdown Card */}
          {isDropdownOpen && (
            <div ref={dropdownRef} className="profile-dropdown">
              <div className="dropdown-user-info">
                <div className="user-name">{user?.username || ''}</div>
                <div className="user-email">{user?.email || ''}</div>
              </div>

              <div className="dropdown-divider"></div>

              <button
                className="dropdown-signout-button"
                onClick={handleSignOut}
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
