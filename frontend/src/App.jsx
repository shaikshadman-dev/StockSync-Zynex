import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from './components/Header/Header.jsx';
import DashboardHero from './components/DashboardHero/DashboardHero.jsx';
import InventoryTable from './components/InventoryTable/InventoryTable.jsx';
import AddDishModal from './components/AddDishModal/AddDishModal.jsx';
import CustomerView from './components/CustomerView/CustomerView.jsx';
import RoiView from './components/RoiView/RoiView.jsx';
import AuditLogView from './components/AuditLogView/AuditLogView.jsx';
import './App.css';

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  // 1. Navigation Active Tab ('master-dashboard' is primary)
  const [activeTab, setActiveTab] = useState(function() {
    if (typeof window !== 'undefined') {
      if (window.location.pathname === '/inventory') return 'live-kitchen-inventory';
      if (window.location.pathname === '/customer') return 'customer-view';
      if (window.location.pathname === '/roi') return 'roi';
      if (window.location.pathname === '/audit-log') return 'audit-log';
      if (window.location.pathname === '/alerts') return 'alerts';
    }
    return 'master-dashboard';
  });

  // Keep route pathname and activeTab state in sync
  useEffect(function() {
    const path = location.pathname;
    if (path === '/inventory') {
      setActiveTab('live-kitchen-inventory');
    } else if (path === '/customer') {
      setActiveTab('customer-view');
    } else if (path === '/roi') {
      setActiveTab('roi');
    } else if (path === '/audit-log') {
      setActiveTab('audit-log');
    } else if (path === '/alerts') {
      setActiveTab('alerts');
    } else {
      // Default fallback: whenever root or any other path is loaded, Master Dashboard page opens
      setActiveTab('master-dashboard');
    }
  }, [location.pathname]);

  function handleSelectTab(tabId) {
    setActiveTab(tabId);

    // Reset scroll to top so the requested page opens cleanly at the top
    try {
      window.scrollTo({ top: 0, behavior: 'instant' });
    } catch (e) {
      // ignore
    }

    if (tabId === 'master-dashboard') {
      if (location.pathname !== '/') {
        navigate('/');
      }
    } else if (tabId === 'live-kitchen-inventory') {
      if (location.pathname !== '/inventory') {
        navigate('/inventory');
      }
    } else if (tabId === 'customer-view') {
      if (location.pathname !== '/customer') {
        navigate('/customer');
      }
    } else if (tabId === 'roi') {
      if (location.pathname !== '/roi') {
        navigate('/roi');
      }
    } else if (tabId === 'audit-log') {
      if (location.pathname !== '/audit-log') {
        navigate('/audit-log');
      }
    } else if (tabId === 'alerts') {
      if (location.pathname !== '/alerts') {
        navigate('/alerts');
      }
    }
  }

  // 2. Backend health status
  const [backendMsg, setBackendMsg] = useState('Connecting to backend...');
  const [serverTime, setServerTime] = useState('');

  // 2. Dishes fetched from the backend API
  const [dishes, setDishes] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  // 3. Add Dish Modal visibility state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // 3. Master per-dish toggle state: { [itemId]: boolean }
  const [enabledItems, setEnabledItems] = useState({});

  // 4. Per-channel delist map: { [`${itemId}_${channelKey}`]: boolean }
  const [disabledChannels, setDisabledChannels] = useState(function() {
    try {
      return JSON.parse(window.localStorage.getItem('stocksync:disabledChannels') || '{}');
    } catch {
      return {};
    }
  });

  // Persist browser-only UI toggles. Inventory itself is persisted in Firebase through the API.
  useEffect(function() {
    try {
      const savedEnabled = window.localStorage.getItem('stocksync:enabledItems');
      if (savedEnabled) setEnabledItems(JSON.parse(savedEnabled));
    } catch {
      // Ignore malformed localStorage data.
    }
  }, []);

  useEffect(function() {
    try {
      window.localStorage.setItem('stocksync:enabledItems', JSON.stringify(enabledItems));
    } catch {
      // Ignore storage failures.
    }
  }, [enabledItems]);

  useEffect(function() {
    try {
      window.localStorage.setItem('stocksync:disabledChannels', JSON.stringify(disabledChannels));
    } catch {
      // Ignore storage failures.
    }
  }, [disabledChannels]);

  // 5. Fetch initial data from backend on page load
  useEffect(function() {
    fetch('/api/health')
      .then(function(res) {
        return res.json();
      })
      .then(function(data) {
        setBackendMsg(data.database ? data.message + ' • ' + data.database : data.message);
        setServerTime(data.timestamp);
      })
      .catch(function() {
        setBackendMsg('Backend offline');
      });

    fetch('/api/inventory')
      .then(function(res) {
        if (!res.ok) {
          throw new Error('Failed to fetch inventory');
        }
        return res.json();
      })
      .then(function(data) {
        setDishes(data.dishes);
      })
      .catch(function() {
        setErrorMessage('Could not load inventory from backend.');
      });
  }, []);

  // 6. Master item toggle handler
  function handleToggleMaster(itemId) {
    setEnabledItems(function(prev) {
      const currentVal = prev[itemId] === undefined ? true : prev[itemId];
      return {
        ...prev,
        [itemId]: !currentVal
      };
    });
  }

  // 7. Single channel toggle handler
  function handleToggleChannel(itemId, channelKey) {
    const key = itemId + '_' + channelKey;
    setDisabledChannels(function(prev) {
      return {
        ...prev,
        [key]: !prev[key]
      };
    });
  }

  // 8. Adjust portions (+ or -).
  // CRITICAL REQUIREMENT: "the delisted items should be restored if the portions increase"
  async function handleAdjustPortions(itemId, channelKey, delta) {
    const currentDish = dishes.find(function(dish) {
      return dish.id === itemId;
    });
    if (!currentDish) return;

    const currentUnits = Math.max(0, Number(currentDish[channelKey]) || 0);
    const newUnits = Math.max(0, currentUnits + delta);
    const updatedDish = {
      ...currentDish,
      [channelKey]: newUnits
    };
    updatedDish.totalStock =
      (channelKey === 'platformA' ? newUnits : Number(currentDish.platformA) || 0) +
      (channelKey === 'platformB' ? newUnits : Number(currentDish.platformB) || 0) +
      (channelKey === 'platformC' ? newUnits : Number(currentDish.platformC) || 0);
    updatedDish.status = updatedDish.totalStock === 0
      ? 'out_of_stock'
      : updatedDish.totalStock <= 10
        ? 'low'
        : 'synced';

    // Optimistic UI update.
    setDishes(function(prevDishes) {
      return prevDishes.map(function(dish) {
        return dish.id === itemId ? updatedDish : dish;
      });
    });

    const key = itemId + '_' + channelKey;
    if (newUnits <= 0) {
      setDisabledChannels(function(prev) {
        return { ...prev, [key]: true };
      });
    } else if (newUnits > 1) {
      setDisabledChannels(function(prev) {
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }

    try {
      const response = await fetch('/api/inventory/' + encodeURIComponent(itemId), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedDish)
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update inventory');
      }
      setDishes(function(prevDishes) {
        return prevDishes.map(function(dish) {
          return dish.id === itemId ? data.dish : dish;
        });
      });
    } catch (error) {
      console.error('Failed to persist portion change:', error);
      setDishes(function(prevDishes) {
        return prevDishes.map(function(dish) {
          return dish.id === itemId ? currentDish : dish;
        });
      });
    }
  }

  // 9. Scan for unhandled low-stock & out-of-stock channels (stock <= 1 and not yet delisted)
  const unhandledCriticalAlerts = [];
  const delistedProtectedList = [];

  dishes.forEach(function(item) {
    const channelList = [
      { key: 'platformA', name: 'Platform A (Swiggy)', units: item.platformA },
      { key: 'platformB', name: 'Platform B (Zomato)', units: item.platformB },
      { key: 'platformC', name: 'Platform C (Direct)', units: item.platformC }
    ];

    channelList.forEach(function(ch) {
      const disableKey = item.id + '_' + ch.key;
      // If stock <= 1 and NOT yet delisted, it generates an alert with item name and platform name!
      if (ch.units <= 1 && !disabledChannels[disableKey]) {
        unhandledCriticalAlerts.push({
          itemId: item.id,
          dishName: item.name,
          category: item.category,
          channelKey: ch.key,
          channelName: ch.name,
          units: ch.units
        });
      }

      // If delisted, track in protected channels list
      if (disabledChannels[disableKey]) {
        delistedProtectedList.push({
          itemId: item.id,
          dishName: item.name,
          category: item.category,
          channelKey: ch.key,
          channelName: ch.name,
          units: ch.units
        });
      }
    });
  });

  // 10. Delist all critical alerts at once
  function handleDelistAllCritical() {
    setDisabledChannels(function(prev) {
      const updated = { ...prev };
      unhandledCriticalAlerts.forEach(function(alert) {
        const key = alert.itemId + '_' + alert.channelKey;
        updated[key] = true;
      });
      return updated;
    });
  }

  // Delist all low-stock / out-of-stock channels for a specific dish
  function handleDelistDishAll(dishId) {
    const dish = dishes.find(function(d) {
      return d.id === dishId;
    });
    if (!dish) return;

    setDisabledChannels(function(prev) {
      const updated = { ...prev };
      ['platformA', 'platformB', 'platformC'].forEach(function(chKey) {
        if (dish[chKey] <= 1) {
          updated[dishId + '_' + chKey] = true;
        }
      });
      return updated;
    });
  }

  // 11. Add new dish handler: sends to backend POST /api/inventory and updates local state
  async function handleAddDish(newDish) {
    try {
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDish)
      });
      const data = await response.json();
      if (!response.ok || !data.success || !data.dish) {
        throw new Error(data.error || 'Failed to add dish');
      }
      setDishes(function(prev) {
        return [data.dish, ...prev.filter(function(dish) { return dish.id !== data.dish.id; })];
      });
    } catch (error) {
      console.error('Failed to add dish to backend:', error);
      setErrorMessage(error.message || 'Could not add dish.');
    }
  }

  // Calculate live channel totals for Live Kitchen Inventory & Channel Stock tab
  const totalKitchenPortions = dishes.reduce(function(acc, d) {
    return acc + (Number(d.totalStock) || 0);
  }, 0);

  const totalSwiggyPortions = dishes.reduce(function(acc, d) {
    const isChannelOff = disabledChannels[d.id + '_platformA'];
    const isMasterOff = enabledItems[d.id] === false;
    if (isChannelOff || isMasterOff) return acc;
    return acc + (Number(d.platformA) || 0);
  }, 0);

  const totalZomatoPortions = dishes.reduce(function(acc, d) {
    const isChannelOff = disabledChannels[d.id + '_platformB'];
    const isMasterOff = enabledItems[d.id] === false;
    if (isChannelOff || isMasterOff) return acc;
    return acc + (Number(d.platformB) || 0);
  }, 0);

  const totalDirectPortions = dishes.reduce(function(acc, d) {
    const isChannelOff = disabledChannels[d.id + '_platformC'];
    const isMasterOff = enabledItems[d.id] === false;
    if (isChannelOff || isMasterOff) return acc;
    return acc + (Number(d.platformC) || 0);
  }, 0);

  return (
    <div className="app-root d-flex flex-column min-vh-100 w-100 bg-dark text-light">
      {/* Top Navbar */}
      <Header
        lowStockCount={unhandledCriticalAlerts.length}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
      />

      <main className="main-content flex-grow-1 w-100">
        <div className="dashboard-content container-fluid px-2 px-sm-3 px-md-4 py-3">
          {/* Master Dashboard View (Primary) */}
          {activeTab === 'master-dashboard' && (
              <div id="master-dashboard" className="master-dashboard-tab-content">
                {/* 1. Hero Telemetry & Velocity Banner matching user screenshot */}
                <div id="telemetry-metrics">
                  <DashboardHero
                    items={dishes}
                    lowStockCount={unhandledCriticalAlerts.length}
                    restaurantName="Burger Hub"
                  />
                </div>

                {/* 2. Low Stock & Out-of-Stock Alarm Banner Section */}
                {unhandledCriticalAlerts.length > 0 ? (
                  <div id="critical-alerts" className="alarm-banner card border-danger bg-dark p-3 p-md-4 mb-4">
                    <div className="row g-3 align-items-center mb-3">
                      <div className="col-12 col-lg-7 d-flex align-items-center gap-3">
                        <div className="alarm-banner-icon-bubble flex-shrink-0">
                          🚨
                        </div>
                        <div>
                          <h4 className="alarm-banner-title mb-1">
                            Critical Alert: {unhandledCriticalAlerts.length} Actionable Channel(s)
                          </h4>
                          <p className="alarm-banner-desc mb-0">
                            Out of stock or &le; 1 portion remaining. Delist to immediately reflect protection and prevent ghost order penalties.
                          </p>
                        </div>
                      </div>

                      <div className="col-12 col-lg-5 d-flex flex-wrap align-items-center justify-content-start justify-content-lg-end gap-2">
                        <button
                          type="button"
                          className="alarm-action-btn"
                          onClick={handleDelistAllCritical}
                          title="Click to automatically delist all low-stock & out-of-stock channels"
                        >
                          ⚡ Delist All ({unhandledCriticalAlerts.length})
                        </button>
                        <button
                          type="button"
                          className="alarm-view-tab-btn text-nowrap"
                          onClick={function() {
                            handleSelectTab('live-kitchen-inventory');
                          }}
                        >
                          Manage in Kitchen Inventory &rarr;
                        </button>
                      </div>
                    </div>

                    {/* Active Unhandled Alerts: Item Name + Platform Name */}
                    <div className="alarm-items-list d-flex flex-wrap gap-2 pt-1">
                      {unhandledCriticalAlerts.map(function(alert, idx) {
                        const isZero = alert.units === 0;
                        return (
                          <div
                            key={idx}
                            className={'alarm-item-chip d-inline-flex align-items-center ' + (isZero ? 'chip-out-of-stock' : '')}
                          >
                            <span className="alarm-chip-dish">{alert.dishName}</span>
                            <span className="alarm-chip-platform">{alert.channelName}</span>
                            <span className={'alarm-chip-qty ' + (isZero ? 'text-danger fw-bold' : '')}>
                              {isZero ? 'Out of Stock' : alert.units + ' left'}
                            </span>
                            <button
                              type="button"
                              className="alarm-chip-delist-btn"
                              onClick={function() {
                                handleToggleChannel(alert.itemId, alert.channelKey);
                              }}
                              title={'Delist ' + alert.dishName + ' on ' + alert.channelName}
                            >
                              Delist
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {/* Delisted & Protected Reflection Area in Dashboard Alert */}
                    {delistedProtectedList.length > 0 && (
                      <div className="delisted-feedback-bar pt-3 mt-3 border-top border-secondary border-opacity-25 d-flex flex-wrap align-items-center gap-2">
                        <span className="delisted-feedback-label text-success small fw-bold d-flex align-items-center gap-1">
                          <span>✓ Delisted &amp; Defended ({delistedProtectedList.length}):</span>
                        </span>
                        {delistedProtectedList.map(function(alert, idx) {
                          return (
                            <span
                              key={idx}
                              className="badge bg-success bg-opacity-15 text-success border border-success border-opacity-30 d-inline-flex align-items-center gap-1.5 py-1 px-2"
                              title="Delisted from channel to prevent ghost order cancellation penalties"
                            >
                              <span>{alert.dishName}</span>
                              <span className="opacity-75">({alert.channelName})</span>
                              <span className="badge bg-dark text-success-emphasis border border-success border-opacity-25">
                                {alert.units === 0 ? '0 portions' : alert.units + ' left'}
                              </span>
                              <button
                                type="button"
                                className="btn btn-link text-success p-0 ms-1 text-decoration-underline"
                                style={{ fontSize: '11px' }}
                                onClick={function() {
                                  handleToggleChannel(alert.itemId, alert.channelKey);
                                }}
                                title="Click to re-list channel"
                              >
                                Re-list
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <div id="critical-alerts" className="alarm-safe-banner d-flex flex-column gap-3 p-3 p-md-4 rounded mb-4">
                    <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-2">
                      <div className="alarm-safe-left d-flex align-items-center gap-2">
                        <span className="safe-icon fs-4">🛡️</span>
                        <div>
                          <strong className="text-success d-block">Zero Ghost Order Risks Active</strong>
                          <span className="text-secondary small">
                            All critical &amp; out-of-stock channels are delisted and protected against aggregator cancellation fees.
                          </span>
                        </div>
                      </div>
                      <span className="restored-info-badge">
                        Auto-Restore Active: Increasing portions (&gt;1) restores channel display
                      </span>
                    </div>

                    {delistedProtectedList.length > 0 && (
                      <div className="delisted-feedback-bar pt-2 border-top border-success border-opacity-20 d-flex flex-wrap align-items-center gap-2">
                        <span className="text-success small fw-bold">
                          Protected Delisted Items ({delistedProtectedList.length}):
                        </span>
                        {delistedProtectedList.map(function(alert, idx) {
                          return (
                            <span
                              key={idx}
                              className="badge bg-success bg-opacity-15 text-success border border-success border-opacity-30 d-inline-flex align-items-center gap-1.5 py-1 px-2"
                            >
                              <span>{alert.dishName}</span>
                              <span className="opacity-75">({alert.channelName})</span>
                              <span className="badge bg-dark text-success-emphasis border border-success border-opacity-25">
                                {alert.units === 0 ? 'Out of Stock' : alert.units + ' left'}
                              </span>
                              <button
                                type="button"
                                className="btn btn-link text-success p-0 ms-1 text-decoration-underline"
                                style={{ fontSize: '11px' }}
                                onClick={function() {
                                  handleToggleChannel(alert.itemId, alert.channelKey);
                                }}
                                title="Click to re-list channel"
                              >
                                Re-list
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Live Backend Connection Status Pill */}
                <div id="backend-status" className="backend-banner d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-2 mb-4">
                  <div className="banner-left d-flex align-items-center gap-2">
                    <span className="live-indicator"></span>
                    <span className="banner-text">
                      Backend Status: <strong>{backendMsg}</strong> &bull; API Route: <code>GET /api/inventory</code>
                    </span>
                  </div>
                  {serverTime && (
                    <span className="banner-time">
                      Synced at {new Date(serverTime).toLocaleTimeString()}
                    </span>
                  )}
                </div>

                {/* Error notice if backend fails */}
                {errorMessage && (
                  <div className="error-banner alert alert-danger mb-4">
                    {errorMessage}
                  </div>
                )}

                {/* 3. Kitchen Inventory & Channel Stock Station Launcher */}
                <div id="kitchen-inventory-launcher" className="master-inventory-launch-card card bg-dark border-secondary p-3 p-md-4 mb-4">
                  <div className="row g-3 align-items-center">
                    <div className="col-12 col-xl-7 d-flex align-items-start align-items-sm-center gap-3">
                      <div className="launch-card-icon-box flex-shrink-0">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m7.5 4.27 9 5.15"></path>
                          <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path>
                          <path d="m3.3 7 8.7 5 8.7-5"></path>
                          <path d="M12 22V12"></path>
                        </svg>
                      </div>
                      <div>
                        <div className="launch-card-badge mb-1">CHANNEL DISPATCH READY</div>
                        <h3 className="launch-card-title mb-1">Live Kitchen Inventory &amp; Channel Stock</h3>
                        <p className="launch-card-desc mb-0">
                          Manage individual dish portions, view Swiggy, Zomato, and Direct channel statuses, or add new kitchen SKUs in the dedicated inventory tab.
                        </p>
                      </div>
                    </div>

                    <div className="col-12 col-xl-5 d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center justify-content-xl-end gap-3">
                      <div className="launch-card-stats d-flex justify-content-around flex-grow-1 gap-2">
                        <div className="launch-mini-stat">
                          <span className="launch-stat-val">{dishes.length}</span>
                          <span className="launch-stat-lbl">Dishes</span>
                        </div>
                        <div className="launch-mini-stat">
                          <span className="launch-stat-val">{totalKitchenPortions}</span>
                          <span className="launch-stat-lbl">Portions</span>
                        </div>
                        <div className="launch-mini-stat">
                          <span className="launch-stat-val" style={{ color: '#34d399' }}>3/3</span>
                          <span className="launch-stat-lbl">Channels Live</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="btn-open-inventory-tab text-nowrap"
                        onClick={function() {
                          handleSelectTab('live-kitchen-inventory');
                        }}
                      >
                        Open Live Inventory Tab &rarr;
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Live Kitchen Inventory & Channel Stock View */}
            {activeTab === 'live-kitchen-inventory' && (
              <div id="kitchen-inventory" className="kitchen-inventory-tab-content">
                {/* Dedicated Kitchen & Channel Stock Station Header */}
                <div className="kitchen-inventory-header-card card bg-dark border-secondary p-3 p-md-4 mb-4">
                  <div className="row g-3 align-items-center">
                    <div className="col-12 col-xl-5">
                      <div className="kitchen-inv-badge mb-2">
                        <span className="live-pulsing-dot"></span>
                        <span>REAL-TIME CHANNEL DISPATCH</span>
                      </div>
                      <h2 className="kitchen-inv-title">Live Kitchen Inventory &amp; Channel Stock</h2>
                      <p className="kitchen-inv-desc mb-0">
                        Real-time multi-channel station for managing live kitchen portions across Swiggy, Zomato, and Direct delivery channels. Adjust portions with automated zero-stock protection.
                      </p>
                    </div>

                    {/* Channel Quick Summary Grid */}
                    <div id="channel-breakdown" className="col-12 col-xl-7">
                      <div className="row g-2 g-md-3">
                        <div className="col-6 col-sm-3">
                          <div className="channel-stat-card stat-card-total h-100">
                            <span className="channel-stat-label">Total Stock</span>
                            <span className="channel-stat-value">{totalKitchenPortions}</span>
                            <span className="channel-stat-sub">{dishes.length} menu items</span>
                          </div>
                        </div>

                        <div className="col-6 col-sm-3">
                          <div className="channel-stat-card stat-card-swiggy h-100">
                            <div className="channel-stat-top">
                              <span className="channel-dot-swiggy"></span>
                              <span className="channel-stat-label">Swiggy Live</span>
                            </div>
                            <span className="channel-stat-value">{totalSwiggyPortions}</span>
                            <span className="channel-stat-sub">portions</span>
                          </div>
                        </div>

                        <div className="col-6 col-sm-3">
                          <div className="channel-stat-card stat-card-zomato h-100">
                            <div className="channel-stat-top">
                              <span className="channel-dot-zomato"></span>
                              <span className="channel-stat-label">Zomato Live</span>
                            </div>
                            <span className="channel-stat-value">{totalZomatoPortions}</span>
                            <span className="channel-stat-sub">portions</span>
                          </div>
                        </div>

                        <div className="col-6 col-sm-3">
                          <div className="channel-stat-card stat-card-direct h-100">
                            <div className="channel-stat-top">
                              <span className="channel-dot-direct"></span>
                              <span className="channel-stat-label">Direct</span>
                            </div>
                            <span className="channel-stat-value">{totalDirectPortions}</span>
                            <span className="channel-stat-sub">portions</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live Backend Connection Status Pill */}
                <div className="backend-banner d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-2 mb-4">
                  <div className="banner-left d-flex align-items-center gap-2">
                    <span className="live-indicator"></span>
                    <span className="banner-text">
                      Backend Status: <strong>{backendMsg}</strong> &bull; API Route: <code>GET /api/inventory</code>
                    </span>
                  </div>
                  {serverTime && (
                    <span className="banner-time">
                      Synced at {new Date(serverTime).toLocaleTimeString()}
                    </span>
                  )}
                </div>

                {/* Error notice if backend fails */}
                {errorMessage && (
                  <div className="error-banner alert alert-danger mb-4">
                    {errorMessage}
                  </div>
                )}

                {/* Multi-Channel Inventory Table */}
                <InventoryTable
                  items={dishes}
                  enabledItems={enabledItems}
                  disabledChannels={disabledChannels}
                  onToggleMaster={handleToggleMaster}
                  onToggleChannel={handleToggleChannel}
                  onAdjustPortions={handleAdjustPortions}
                  onDelistDishAll={handleDelistDishAll}
                  onOpenAddDish={function() {
                    setIsAddModalOpen(true);
                  }}
                />
              </div>
            )}

            {/* Customer View (Mock Delivery) */}
            {activeTab === 'customer-view' && (
              <div id="customer-view" className="customer-view-tab-content">
                <CustomerView
                  items={dishes}
                  enabledItems={enabledItems}
                  disabledChannels={disabledChannels}
                  onAdjustPortions={handleAdjustPortions}
                  onNavigateToInventory={function() {
                    handleSelectTab('live-kitchen-inventory');
                  }}
                />
              </div>
            )}

            {/* Critical Alerts Page */}
            {activeTab === 'alerts' && (
              <div id="alerts-page" className="alerts-page-tab-content">
                <div className="card bg-dark border-secondary border-opacity-25 shadow-lg p-3 p-md-4 mb-4">
                  <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 pb-3 border-bottom border-secondary border-opacity-25 mb-4">
                    <div className="d-flex align-items-center gap-3">
                      <div className="p-3 bg-danger bg-opacity-10 border border-danger border-opacity-25 rounded-circle fs-3 text-danger">
                        🚨
                      </div>
                      <div>
                        <h2 className="h4 fw-bold text-light mb-1">
                          Critical Low-Stock Alerts &amp; Channel Shield
                        </h2>
                        <p className="text-secondary small mb-0">
                          Central telemetry monitoring menu items with &le; 1 portion remaining to prevent ghost orders on third-party aggregators.
                        </p>
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={function() {
                          handleSelectTab('master-dashboard');
                        }}
                      >
                        📊 Dashboard
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-warning btn-sm"
                        onClick={function() {
                          handleSelectTab('live-kitchen-inventory');
                        }}
                      >
                        📦 Kitchen Inventory
                      </button>
                    </div>
                  </div>

                  {unhandledCriticalAlerts.length > 0 ? (
                    <div>
                      <div className="alert alert-danger d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-2 mb-4">
                        <div className="d-flex align-items-center gap-2">
                          <span className="fs-5">⚠️</span>
                          <span>
                            <strong>{unhandledCriticalAlerts.length} channel(s)</strong> have critical stock (&le; 1 portion). Take action now to avoid cancellation penalties.
                          </span>
                        </div>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm text-nowrap fw-bold shadow-sm"
                          onClick={handleDelistAllCritical}
                        >
                          ⚡ Auto-Delist All ({unhandledCriticalAlerts.length})
                        </button>
                      </div>

                      <div className="row g-3">
                        {unhandledCriticalAlerts.map(function(alert, idx) {
                          return (
                            <div key={idx} className="col-12 col-md-6 col-xl-4">
                              <div className="p-3 rounded bg-secondary bg-opacity-10 border border-danger border-opacity-50 h-100 d-flex flex-column justify-content-between">
                                <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
                                  <div>
                                    <span className="badge bg-danger text-uppercase mb-1" style={{ fontSize: '10px' }}>
                                      {alert.channelName}
                                    </span>
                                    <h5 className="h6 fw-bold text-light mb-0">{alert.dishName}</h5>
                                  </div>
                                  <span className="badge bg-danger bg-opacity-25 text-danger border border-danger border-opacity-50 py-1 px-2 font-monospace">
                                    {alert.units} portion left
                                  </span>
                                </div>

                                <div className="d-flex align-items-center justify-content-between pt-2 border-top border-secondary border-opacity-25 mt-2">
                                  <span className="text-secondary small font-monospace">
                                    Ghost risk: High
                                  </span>
                                  <div className="d-flex gap-2">
                                    <button
                                      type="button"
                                      className="btn btn-outline-danger btn-sm py-1 px-2.5"
                                      onClick={function() {
                                        handleToggleChannel(alert.itemId, alert.channelKey);
                                      }}
                                    >
                                      Delist on {alert.channelName}
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-outline-success btn-sm py-1 px-2"
                                      onClick={function() {
                                        handleAdjustPortions(alert.itemId, alert.channelKey, 5);
                                      }}
                                      title="Add +5 portions to restock safely"
                                    >
                                      +5 Stock
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded bg-success bg-opacity-10 border border-success border-opacity-25 text-center my-3">
                      <div className="fs-1 mb-2">🛡️</div>
                      <h4 className="h5 fw-bold text-success mb-2">
                        All Connected Delivery Channels Protected
                      </h4>
                      <p className="text-secondary small max-w-lg mx-auto mb-3">
                        Zero ghost order risks detected across Swiggy, Zomato, and Direct channels. All dishes have adequate stock buffers.
                      </p>
                      <button
                        type="button"
                        className="btn btn-outline-success btn-sm"
                        onClick={function() {
                          handleSelectTab('live-kitchen-inventory');
                        }}
                      >
                        Go to Kitchen Inventory &rarr;
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Risk & Penalty ROI View */}
            {activeTab === 'roi' && (
              <RoiView dishes={dishes} lowStockCount={unhandledCriticalAlerts.length} />
            )}

            {/* Activity Audit Log View */}
            {activeTab === 'audit-log' && (
              <AuditLogView dishes={dishes} />
            )}

            {/* 4. Add New Dish Modal Dialog */}
            <AddDishModal
              isOpen={isAddModalOpen}
              onClose={function() {
                setIsAddModalOpen(false);
              }}
              onAddDish={handleAddDish}
            />
          </div>
        </main>
    </div>
  );
}
