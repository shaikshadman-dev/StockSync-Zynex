import React, { useState } from 'react';
import './DashboardHero.css';

export default function DashboardHero(props) {
  const items = props.items || [];
  const lowStockCount = props.lowStockCount || 0;
  const restaurantName = props.restaurantName || 'Burger Hub';

  const [isPinging, setIsPinging] = useState(false);
  const [lastPingTime, setLastPingTime] = useState('38ms');

  function handlePingChannels() {
    setIsPinging(true);
    setTimeout(() => {
      setIsPinging(false);
      const randomMs = Math.floor(28 + Math.random() * 25);
      setLastPingTime(randomMs + 'ms');
    }, 600);
  }

  // Calculate stats based on actual dishes
  const totalDishes = items.length || 45;
  const activeDishes = Math.max(0, totalDishes - lowStockCount);
  const healthPercent = Math.round((activeDishes / (totalDishes || 1)) * 100);

  return (
    <div className="hero-banner-container">
      {/* 1. Top Greeting & Order Velocity Bar */}
      <div className="hero-top-row row g-3 align-items-center">
        <div className="hero-greeting-box col-12 col-lg-7 col-xl-8">
          <h2 className="hero-heading">
            Good evening, {restaurantName} <span className="wave-hand">👋</span>
          </h2>
          <p className="hero-subtext">
            Friday peak hours are active (8:34 PM IST). Order velocity is surging at{' '}
            <span className="hero-highlight-red">4.2 tickets/min</span> &mdash; monitor artisanal
            buns &amp; smash patties carefully.
          </p>
        </div>

        <div className="hero-actions-right col-12 col-lg-5 col-xl-4 d-flex flex-wrap align-items-center justify-content-start justify-content-lg-end gap-3">
          <div className="velocity-box">
            <span className="velocity-label">CURRENT SHIFT VELOCITY</span>
            <span className="velocity-value">142 Orders / hr</span>
          </div>

          <button
            type="button"
            className={'ping-channels-btn ' + (isPinging ? 'pinging' : '')}
            onClick={handlePingChannels}
            title="Ping Swiggy, Zomato, and Direct API webhooks"
          >
            <span className="ping-icon">📡</span>
            <span>{isPinging ? 'PINGING...' : 'PING CHANNELS'}</span>
          </button>
        </div>
      </div>

      {/* 2. 4-Card Telemetry Metrics Grid matching screenshot (Bootstrap Responsive Grid) */}
      <div className="hero-metrics-grid row g-3">
        {/* Card 1: Live Menu Breadth */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="metric-card h-100 d-flex flex-column justify-content-between">
            <div>
              <div className="card-top">
                <span className="card-label">LIVE MENU BREADTH</span>
                <span className="badge-healthy">
                  <span className="badge-dot"></span>
                  Healthy ({healthPercent}%)
                </span>
              </div>
              <div className="card-main-stat">
                <span className="stat-big">{activeDishes}</span>
                <span className="stat-total">/ {totalDishes} items</span>
              </div>
            </div>
            <div className="card-footer-progress">
              <div className="progress-info">
                <span>&#8599; +4 restored</span>
                <span className="prep-label">since afternoon prep</span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${Math.min(100, healthPercent)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: 86'D Pipeline (Halted SKUs) */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="metric-card h-100 d-flex flex-column justify-content-between">
            <div>
              <div className="card-top">
                <span className="card-label">86'D PIPELINE</span>
                {lowStockCount > 0 ? (
                  <span className="badge-attention">
                    <span className="badge-dot"></span>
                    Attention Required
                  </span>
                ) : (
                  <span className="badge-healthy">
                    <span className="badge-dot"></span>
                    Nominal
                  </span>
                )}
              </div>
              <div className="card-main-stat">
                <span className="stat-big">{lowStockCount}</span>
                <span className="stat-unit-text">{lowStockCount === 1 ? 'channel at risk' : 'channels at risk'}</span>
              </div>
            </div>
            <div className="card-footer-alert">
              <span>{lowStockCount > 0 ? '⚠ Automated kill-switch standing by' : '✓ Zero ghost order risk'}</span>
              <div className="alert-progress-track">
                <div
                  className="alert-progress-fill"
                  style={{ width: lowStockCount > 0 ? `${Math.min(100, lowStockCount * 25)}%` : '0%' }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Channel Status */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="metric-card h-100 d-flex flex-column justify-content-between">
            <div>
              <div className="card-top">
                <span className="card-label">CHANNEL STATUS</span>
                <span className="badge-all-online">ALL ONLINE</span>
              </div>
              <div className="card-main-stat">
                <span className="stat-big">3</span>
                <span className="stat-unit-text">platforms</span>
              </div>
              <div className="card-platforms-row">
                <span className="channel-online-item">
                  <span className="dot-green"></span> UberEats 100%
                </span>
                <span className="channel-online-item">
                  <span className="dot-green"></span> DoorDash 100%
                </span>
                <span className="channel-online-item">
                  <span className="dot-green"></span> Zomato 100%
                </span>
              </div>
            </div>
            <div className="card-response-time">
              <span>Average Response</span>
              <span className="resp-ms">{lastPingTime}</span>
            </div>
          </div>
        </div>

        {/* Card 4: Loss Avoidance */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="metric-card h-100 d-flex flex-column justify-content-between">
            <div>
              <div className="card-top">
                <span className="card-label">LOSS AVOIDANCE</span>
                <span className="badge-protected">
                  <span>&#128737;</span> Protected
                </span>
              </div>
              <div className="card-main-stat">
                <span className="stat-big-teal">&#8377;2,400</span>
                <span className="stat-risk-sub">at risk</span>
              </div>
            </div>
            <div className="card-loss-footer">
              <div className="ghost-tickets-row">
                <span>&#10003;</span>
                <span>0 ghost tickets past 60m</span>
              </div>
              <div className="penalties-saved-row">
                <span>Channel Penalties Saved</span>
                <span className="penalties-amount">&#8377;650.00</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
