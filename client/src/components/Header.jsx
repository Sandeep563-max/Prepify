import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import './header.scss';

export default function Header() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const avatarRef = useRef(null);
  const navigate = useNavigate();

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

  const handleSignOut = () => {
    localStorage.removeItem('token');
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
            S
          </button>

          {/* Dropdown Card */}
          {isDropdownOpen && (
            <div ref={dropdownRef} className="profile-dropdown">
              <div className="dropdown-user-info">
                <div className="user-name">Sandeep Kumar</div>
                <div className="user-email">sandeep16285uk@gmail.com</div>
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
