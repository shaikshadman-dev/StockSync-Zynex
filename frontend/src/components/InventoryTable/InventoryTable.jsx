import React, { useState, useEffect } from 'react';
import { Table, LayoutGrid } from 'lucide-react';
import { getDishImage } from '../../utils/foodImages.js';
import './InventoryTable.css';

export default function InventoryTable(props) {
  const items = props.items || [];
  const enabledItems = props.enabledItems || {};
  const disabledChannels = props.disabledChannels || {};
  const onToggleMaster = props.onToggleMaster;
  const onToggleChannel = props.onToggleChannel;
  const onAdjustPortions = props.onAdjustPortions;
  const onOpenAddDish = props.onOpenAddDish;
  const onDelistDishAll = props.onDelistDishAll;

  // Track responsive view mode: 'table' or 'cards'
  const [viewMode, setViewMode] = useState(function() {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      return 'cards';
    }
    return 'table';
  });

  // Automatically switch default view if window resizes across breakpoint, unless user explicitly toggles
  const [userOverridden, setUserOverridden] = useState(false);

  useEffect(function() {
    function handleResize() {
      if (!userOverridden) {
        if (window.innerWidth <= 768) {
          setViewMode('cards');
        } else {
          setViewMode('table');
        }
      }
    }
    window.addEventListener('resize', handleResize);
    return function() {
      window.removeEventListener('resize', handleResize);
    };
  }, [userOverridden]);

  // Check if an item is master-enabled (default is true)
  function isItemMasterEnabled(itemId) {
    if (enabledItems[itemId] === undefined) {
      return true;
    }
    return enabledItems[itemId];
  }

  // Render cell content for Platform A, B, or C
  function renderPlatformCell(item, channelKey, channelName) {
    const isMasterOn = isItemMasterEnabled(item.id);
    const channelDisableKey = item.id + '_' + channelKey;
    const isChannelDelisted = disabledChannels[channelDisableKey];
    const units = item[channelKey];

    // Rule 1: If master item toggle is OFF, item is hidden from all platforms
    if (!isMasterOn) {
      return (
        <span className="channel-global-off-badge" title="Master item toggle is OFF. Hidden from all platforms.">
          Hidden (Item Off)
        </span>
      );
    }

    return (
      <div className="channel-cell-box">
        <div className="channel-cell-top">
          {/* Status view: Delisted vs Out of Stock vs Low Stock vs Normal */}
          {isChannelDelisted ? (
            <button
              type="button"
              className="channel-delisted-tag clickable"
              onClick={function() {
                if (onToggleChannel) {
                  onToggleChannel(item.id, channelKey);
                }
              }}
              title={'Currently delisted on ' + channelName + ' (Ghost-proof). Click to re-list.'}
            >
              <span className="delist-dot"></span>
              Delisted (Click to Re-list)
            </button>
          ) : units === 0 ? (
            <button
              type="button"
              className="low-stock-action-button out-of-stock-button"
              onClick={function() {
                if (onToggleChannel) {
                  onToggleChannel(item.id, channelKey);
                }
              }}
              title={'Out of Stock on ' + channelName + '! Click to delist and protect against ghost penalties.'}
            >
              <span className="out-of-stock-dot"></span>
              Out of Stock (Click to Delist)
            </button>
          ) : units <= 1 ? (
            <button
              type="button"
              className="low-stock-action-button"
              onClick={function() {
                if (onToggleChannel) {
                  onToggleChannel(item.id, channelKey);
                }
              }}
              title={'Critical low stock (' + units + ' left) on ' + channelName + '! Click to delist.'}
            >
              <span className="low-stock-dot"></span>
              {units} left (Click to Delist)
            </button>
          ) : (
            <span className="channel-pill">{units} portions</span>
          )}

          {/* Portion adjuster (+ / -) to test stock increase / restoration */}
          <div className="portion-controls" title="Adjust portions (Restores if increased)">
            <button
              type="button"
              className="portion-btn"
              aria-label="Decrease portion"
              onClick={function() {
                if (onAdjustPortions) {
                  onAdjustPortions(item.id, channelKey, -1);
                }
              }}
            >
              -
            </button>
            <button
              type="button"
              className="portion-btn portion-btn-add"
              aria-label="Increase portion"
              onClick={function() {
                if (onAdjustPortions) {
                  onAdjustPortions(item.id, channelKey, +1);
                }
              }}
            >
              +
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render unified status badge (Table and Card views)
  function renderStatusBadge(item, isMasterOn) {
    if (!isMasterOn) {
      return (
        <span className="status-badge-offline">
          <span className="status-dot-red"></span>
          Offline
        </span>
      );
    }

    const channelList = [
      { key: 'platformA', units: item.platformA, name: 'Platform A (Swiggy)' },
      { key: 'platformB', units: item.platformB, name: 'Platform B (Zomato)' },
      { key: 'platformC', units: item.platformC, name: 'Platform C (Direct)' }
    ];

    const lowOrOutChannels = channelList.filter(function(ch) {
      return ch.units <= 1;
    });
    const unhandledCriticalChannels = channelList.filter(function(ch) {
      return ch.units <= 1 && !disabledChannels[item.id + '_' + ch.key];
    });
    const isAllCriticalDelisted = lowOrOutChannels.length > 0 && unhandledCriticalChannels.length === 0;

    if (unhandledCriticalChannels.length > 0) {
      const hasZero = unhandledCriticalChannels.some(function(c) {
        return c.units === 0;
      }) || item.totalStock === 0;

      return (
        <button
          type="button"
          className={'status-badge-action-btn ' + (hasZero ? 'status-badge-out' : 'status-badge-low')}
          onClick={function() {
            if (onDelistDishAll) {
              onDelistDishAll(item.id);
            }
          }}
          title="Click to delist all at-risk channels for this dish and reflect on dashboard alert"
        >
          <span className={hasZero ? 'status-dot-red' : 'status-dot-amber'}></span>
          <span>{hasZero ? 'Out of Stock (Click to Delist)' : 'Low Stock (Click to Delist)'}</span>
        </button>
      );
    }

    if (isAllCriticalDelisted) {
      return (
        <span className="status-badge-protected" title="All critical channels delisted and protected against ghost orders">
          <span className="status-dot-green"></span>
          Delisted (Safe)
        </span>
      );
    }

    return (
      <span className="status-badge-synced">
        <span className="status-dot-green"></span>
        Synced
      </span>
    );
  }

  return (
    <div id="inventory-table" className="inventory-container container-fluid px-0">
      <div className="inventory-header row g-3 align-items-center mb-3">
        <div className="col-12 col-lg-6">
          <div className="inventory-title-group">
            <h3 className="inventory-heading">Live Kitchen Inventory &amp; Channel Stock</h3>
            <p className="inventory-subheading mb-2">
              Live multi-platform stock &bull; Auto-restores when portions increase (&gt;1)
            </p>
          </div>

          <div className="legend-items-group d-flex flex-wrap align-items-center gap-3">
            <span className="legend-item d-inline-flex align-items-center gap-2">
              <span className="status-dot-green"></span> Live on channels
            </span>
            <span className="legend-item d-inline-flex align-items-center gap-2">
              <span className="low-stock-dot"></span> Low stock action button
            </span>
          </div>
        </div>

        <div className="col-12 col-lg-6 d-flex flex-wrap align-items-center justify-content-start justify-content-lg-end gap-2">
          {/* View Mode Toggle: Table vs Cards */}
          <div className="view-mode-toggle d-inline-flex" role="group" aria-label="Switch Table and Card Views">
            <button
              type="button"
              className={'view-mode-btn ' + (viewMode === 'table' ? 'active' : '')}
              onClick={function() {
                setViewMode('table');
                setUserOverridden(true);
              }}
              title="Switch to Table View"
            >
              <Table size={14} />
              <span className="view-mode-label">Table</span>
            </button>
            <button
              type="button"
              className={'view-mode-btn ' + (viewMode === 'cards' ? 'active' : '')}
              onClick={function() {
                setViewMode('cards');
                setUserOverridden(true);
              }}
              title="Switch to Card View (Mobile Optimized)"
            >
              <LayoutGrid size={14} />
              <span className="view-mode-label">Cards</span>
            </button>
          </div>

          <button
            type="button"
            className="add-dish-btn"
            onClick={onOpenAddDish}
            title="Add a new dish to kitchen inventory"
          >
            + Add Dish
          </button>
          <span className="inventory-count-badge">
            {items.length} Menu Dishes
          </span>
        </div>
      </div>

      {viewMode === 'table' ? (
        <div className="table-wrapper table-responsive">
          <div className="table-scroll-hint d-md-none">
            <span>&larr; Swipe or scroll horizontally to view all channels &rarr;</span>
          </div>
          <table className="stock-table">
            <thead>
              <tr>
                <th className="th-sticky-col">Dish &amp; SKU</th>
                <th>Category</th>
                <th>Live Status</th>
                <th>Total Stock</th>
                <th>Platform A (Swiggy)</th>
                <th>Platform B (Zomato)</th>
                <th>Platform C (Direct)</th>
                <th>Channel Sync</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan="8" className="table-loading-cell">
                    Loading dishes from backend...
                  </td>
                </tr>
              ) : (
                items.map(function(item) {
                  const isMasterOn = isItemMasterEnabled(item.id);

                  return (
                    <tr key={item.id} className={!isMasterOn ? 'row-disabled' : ''}>
                      <td className="td-sticky-col">
                        <div className="d-flex align-items-center gap-2">
                          <img
                            src={getDishImage(item)}
                            alt={item.name}
                            className="dish-table-thumbnail rounded border border-secondary flex-shrink-0"
                            style={{ width: '38px', height: '38px', objectFit: 'cover' }}
                            referrerPolicy="no-referrer"
                            loading="lazy"
                          />
                          <div>
                            <div className="product-name">{item.name}</div>
                            <div className="product-sku">{item.sku}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="category-tag">{item.category}</span>
                      </td>
                      <td>
                        <label
                          className="item-toggle-wrapper"
                          title={isMasterOn ? 'Turn OFF to stop displaying on ALL platforms' : 'Turn ON to display on platforms'}
                        >
                          <input
                            type="checkbox"
                            className="item-toggle-input"
                            checked={isMasterOn}
                            onChange={function() {
                              if (onToggleMaster) {
                                onToggleMaster(item.id);
                              }
                            }}
                          />
                          <span className="item-toggle-track"></span>
                          <span className={'toggle-status-text ' + (isMasterOn ? 'text-live' : 'text-off')}>
                            {isMasterOn ? 'Active' : 'Off'}
                          </span>
                        </label>
                      </td>
                      <td>
                        <span className="stock-pill">{item.totalStock}</span>
                      </td>
                      <td>
                        {renderPlatformCell(item, 'platformA', 'Platform A (Swiggy)')}
                      </td>
                      <td>
                        {renderPlatformCell(item, 'platformB', 'Platform B (Zomato)')}
                      </td>
                      <td>
                        {renderPlatformCell(item, 'platformC', 'Platform C (Direct)')}
                      </td>
                      <td>
                        {renderStatusBadge(item, isMasterOn)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Mobile-Optimized Responsive Card View */
        <div className="inventory-cards-container">
          {items.length === 0 ? (
            <div className="table-loading-cell">Loading dishes from backend...</div>
          ) : (
            <div className="inventory-cards-grid row g-3">
              {items.map(function(item) {
                const isMasterOn = isItemMasterEnabled(item.id);

                return (
                  <div key={item.id} className="col-12 col-md-6 col-xl-4">
                    <div
                      className={'inventory-dish-card h-100 d-flex flex-column justify-content-between ' + (!isMasterOn ? 'row-disabled' : '')}
                    >
                      <div>
                        {/* Food Item Image Banner */}
                        <div className="position-relative rounded overflow-hidden mb-3 border border-secondary" style={{ height: '110px' }}>
                          <img
                            src={getDishImage(item)}
                            alt={item.name}
                            className="w-100 h-100 object-fit-cover"
                            referrerPolicy="no-referrer"
                            loading="lazy"
                          />
                          <div className="position-absolute top-0 start-0 m-2">
                            <span className="badge bg-dark bg-opacity-75 text-light border border-secondary">
                              {item.category}
                            </span>
                          </div>
                          <div className="position-absolute top-0 end-0 m-2">
                            <span className="badge bg-dark bg-opacity-75 text-secondary border border-secondary font-monospace" style={{ fontSize: '10px' }}>
                              {item.sku}
                            </span>
                          </div>
                        </div>

                        {/* Card Top: Name, SKU, Category, and Master Active Switch */}
                        <div className="card-top-row">
                          <div className="card-dish-info">
                            <div className="card-dish-title-row">
                              <span className="product-name">{item.name}</span>
                            </div>
                          </div>

                          <div className="card-dish-toggle">
                            <label
                              className="item-toggle-wrapper"
                              title={isMasterOn ? 'Turn OFF to stop displaying on ALL platforms' : 'Turn ON to display on platforms'}
                            >
                              <input
                                type="checkbox"
                                className="item-toggle-input"
                                checked={isMasterOn}
                                onChange={function() {
                                  if (onToggleMaster) {
                                    onToggleMaster(item.id);
                                  }
                                }}
                              />
                              <span className="item-toggle-track"></span>
                              <span className={'toggle-status-text ' + (isMasterOn ? 'text-live' : 'text-off')}>
                                {isMasterOn ? 'Active' : 'Off'}
                              </span>
                            </label>
                          </div>
                        </div>

                        {/* Card Stats Summary */}
                        <div className="card-summary-bar">
                          <div className="card-stat-box">
                            <span className="card-stat-label">Total Stock</span>
                            <span className="stock-pill">{item.totalStock} portions</span>
                          </div>

                          <div className="card-sync-box">
                            <span className="card-stat-label">Sync Status</span>
                            {renderStatusBadge(item, isMasterOn)}
                          </div>
                        </div>
                      </div>

                      {/* Channels Section: Swiggy, Zomato, Direct with touch-friendly controls */}
                      <div className="card-channels-section mt-3">
                        <div className="card-channels-label">Platforms &amp; Portions</div>
                        <div className="card-channels-list">
                          <div className="card-channel-row">
                            <div className="card-channel-name">
                              <span className="channel-dot-swiggy"></span>
                              <span>Swiggy</span>
                            </div>
                            <div className="card-channel-action">
                              {renderPlatformCell(item, 'platformA', 'Platform A (Swiggy)')}
                            </div>
                          </div>

                          <div className="card-channel-row">
                            <div className="card-channel-name">
                              <span className="channel-dot-zomato"></span>
                              <span>Zomato</span>
                            </div>
                            <div className="card-channel-action">
                              {renderPlatformCell(item, 'platformB', 'Platform B (Zomato)')}
                            </div>
                          </div>

                          <div className="card-channel-row">
                            <div className="card-channel-name">
                              <span className="channel-dot-direct"></span>
                              <span>Direct</span>
                            </div>
                            <div className="card-channel-action">
                              {renderPlatformCell(item, 'platformC', 'Platform C (Direct)')}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
