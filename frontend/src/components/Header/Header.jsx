import React, { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import './Header.css';

export default function Header({
  lowStockCount = 0,
  activeTab = 'master-dashboard',
  onSelectTab
}) {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Helper to check if a tab is active
  const isDashboardActive = activeTab === 'master-dashboard' || location.pathname === '/';
  const isInventoryActive = activeTab === 'live-kitchen-inventory' || location.pathname === '/inventory';
  const isChannelsActive = activeTab === 'customer-view' || location.pathname === '/customer';
  const isRoiActive = activeTab === 'roi' || location.pathname === '/roi';
  const isActivityLogsActive = activeTab === 'audit-log' || location.pathname === '/audit-log';

  function handleNav(tabId) {
    if (onSelectTab) {
      onSelectTab(tabId);
    }
    setIsMobileMenuOpen(false);
  }

  return (
    <header className="stocksync-header sticky-top" id="mainHeader">
      <div className="stocksync-header-container">
        {/* Left: Brand with Blue "S" Icon, StockSync Title & Subtitle */}
        <Link
          to="/"
          className="stocksync-brand-wrap text-decoration-none"
          onClick={() => handleNav('master-dashboard')}
          id="header-brand-logo"
        >
          <div className="stocksync-logo-badge">
            <span className="stocksync-logo-letter">S</span>
          </div>
          <div className="stocksync-brand-text">
            <div className="stocksync-brand-name">StockSync</div>
            <div className="stocksync-brand-tagline">One update. Every channel.</div>
          </div>
        </Link>

        {/* Center: Desktop Navigation Bar using Sidebar labels */}
        <nav className="stocksync-center-nav d-none d-md-flex" aria-label="Main Navigation">
          <NavLink
            to="/"
            className={`stocksync-nav-link ${isDashboardActive ? 'active' : ''}`}
            onClick={() => handleNav('master-dashboard')}
            id="nav-link-dashboard"
          >
            Master Dashboard
          </NavLink>

          <NavLink
            to="/inventory"
            className={`stocksync-nav-link ${isInventoryActive ? 'active' : ''}`}
            onClick={() => handleNav('live-kitchen-inventory')}
            id="nav-link-inventory"
          >
            Kitchen Inventory
          </NavLink>

          <NavLink
            to="/customer"
            className={`stocksync-nav-link ${isChannelsActive ? 'active' : ''}`}
            onClick={() => handleNav('customer-view')}
            id="nav-link-channels"
          >
            Customer View
          </NavLink>

          <NavLink
            to="/roi"
            className={`stocksync-nav-link ${isRoiActive ? 'active' : ''}`}
            onClick={() => handleNav('roi')}
            id="nav-link-roi"
          >
            Risk &amp; Penalty ROI
          </NavLink>

          <NavLink
            to="/audit-log"
            className={`stocksync-nav-link ${isActivityLogsActive ? 'active' : ''}`}
            onClick={() => handleNav('audit-log')}
            id="nav-link-activity-logs"
          >
            Activity Audit Log
          </NavLink>
        </nav>

        {/* Right Section: Desktop Status Pill vs Mobile Hamburger Button */}
        <div className="stocksync-header-right d-flex align-items-center">
          {/* Desktop Status Badge: "System Live" with light mint background and green dot */}
          <div className="stocksync-system-live-pill d-none d-md-inline-flex" title="All delivery channels synchronizing live">
            <span className="system-live-dot"></span>
            <span className="system-live-text">System Live</span>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            className={`stocksync-mobile-hamburger d-flex d-md-none ${isMobileMenuOpen ? 'active' : ''}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={isMobileMenuOpen}
            id="mobileNavbarToggle"
          >
            {isMobileMenuOpen ? (
              <X size={22} className="stocksync-hamburger-icon" />
            ) : (
              <Menu size={22} className="stocksync-hamburger-icon" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="stocksync-mobile-menu d-md-none" id="mobileNavDropdown">
          <div className="stocksync-mobile-menu-inner">
            <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom border-secondary border-opacity-25">
              <span className="text-secondary small fw-bold text-uppercase">Navigation</span>
              <div className="stocksync-system-live-pill" style={{ padding: '3px 10px', fontSize: '11.5px' }}>
                <span className="system-live-dot"></span>
                <span className="system-live-text">System Live</span>
              </div>
            </div>

            <NavLink
              to="/"
              className={`stocksync-mobile-nav-item ${isDashboardActive ? 'active' : ''}`}
              onClick={() => handleNav('master-dashboard')}
              id="mobile-nav-dashboard"
            >
              Master Dashboard
            </NavLink>

            <NavLink
              to="/inventory"
              className={`stocksync-mobile-nav-item ${isInventoryActive ? 'active' : ''}`}
              onClick={() => handleNav('live-kitchen-inventory')}
              id="mobile-nav-inventory"
            >
              Kitchen Inventory
            </NavLink>

            <NavLink
              to="/customer"
              className={`stocksync-mobile-nav-item ${isChannelsActive ? 'active' : ''}`}
              onClick={() => handleNav('customer-view')}
              id="mobile-nav-channels"
            >
              Customer View
            </NavLink>

            <NavLink
              to="/roi"
              className={`stocksync-mobile-nav-item ${isRoiActive ? 'active' : ''}`}
              onClick={() => handleNav('roi')}
              id="mobile-nav-roi"
            >
              Risk &amp; Penalty ROI
            </NavLink>

            <NavLink
              to="/audit-log"
              className={`stocksync-mobile-nav-item ${isActivityLogsActive ? 'active' : ''}`}
              onClick={() => handleNav('audit-log')}
              id="mobile-nav-activity-logs"
            >
              Activity Audit Log
            </NavLink>
          </div>
        </div>
      )}
    </header>
  );
}
