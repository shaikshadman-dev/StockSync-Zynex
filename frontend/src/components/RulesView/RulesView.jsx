import React, { useState } from 'react';
import { RotateCcw, Shield, Sliders, CheckCircle2, AlertOctagon } from 'lucide-react';

export default function RulesView() {
  const [autoDelistEnabled, setAutoDelistEnabled] = useState(true);
  const [autoRestoreEnabled, setAutoRestoreEnabled] = useState(true);
  const [bufferThreshold, setBufferThreshold] = useState(2);
  const [lockOnManual, setLockOnManual] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  function handleSave() {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  }

  return (
    <div className="rules-page container-fluid px-0 py-2">
      <div className="card bg-dark border-secondary border-opacity-25 shadow-lg p-3 p-md-4 mb-4">
        <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 pb-3 border-bottom border-secondary border-opacity-25 mb-4">
          <div className="d-flex align-items-center gap-3">
            <div className="p-3 bg-primary bg-opacity-10 border border-primary border-opacity-25 rounded-3 text-primary">
              <RotateCcw size={28} />
            </div>
            <div>
              <div className="badge bg-primary bg-opacity-15 text-primary font-monospace mb-1" style={{ fontSize: '10px', letterSpacing: '0.8px' }}>
                AUTOMATION POLICIES
              </div>
              <h2 className="h4 fw-bold text-light mb-1">Auto-Restore &amp; Shield Rules</h2>
              <p className="text-secondary small mb-0">
                Configure safety margins and automated re-listing rules when kitchen inventory gets replenished.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-sm px-3 fw-bold"
            onClick={handleSave}
          >
            {savedSuccess ? '✓ Rules Saved!' : 'Save Rule Policy'}
          </button>
        </div>

        {/* Rules Grid */}
        <div className="row g-4">
          {/* Rule 1 */}
          <div className="col-12 col-md-6">
            <div className="p-3 rounded-3 bg-secondary bg-opacity-10 border border-secondary border-opacity-25 h-100 d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="badge bg-danger bg-opacity-20 text-danger border border-danger border-opacity-25 font-monospace">
                    RULE #1 &bull; SHIELD TRIGGER
                  </span>
                  <div className="form-check form-switch mb-0">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      role="switch"
                      id="switchRule1"
                      checked={autoDelistEnabled}
                      onChange={(e) => setAutoDelistEnabled(e.target.checked)}
                    />
                  </div>
                </div>
                <h3 className="h6 fw-bold text-light mb-1">Critical Zero-Stock Delisting</h3>
                <p className="text-secondary small mb-3">
                  Instantly broadcasts a delist command to Swiggy and Zomato the moment kitchen portions hit &le; 1 unit.
                </p>
              </div>
              <div className="p-2 rounded bg-dark border border-secondary border-opacity-25 small font-monospace text-success d-flex align-items-center gap-2">
                <CheckCircle2 size={16} />
                <span>Status: {autoDelistEnabled ? 'Active (Zero Ghost Orders)' : 'Disabled'}</span>
              </div>
            </div>
          </div>

          {/* Rule 2 */}
          <div className="col-12 col-md-6">
            <div className="p-3 rounded-3 bg-secondary bg-opacity-10 border border-secondary border-opacity-25 h-100 d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="badge bg-success bg-opacity-20 text-success border border-success border-opacity-25 font-monospace">
                    RULE #2 &bull; RESTORATION BUFFER
                  </span>
                  <div className="form-check form-switch mb-0">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      role="switch"
                      id="switchRule2"
                      checked={autoRestoreEnabled}
                      onChange={(e) => setAutoRestoreEnabled(e.target.checked)}
                    />
                  </div>
                </div>
                <h3 className="h6 fw-bold text-light mb-1">Automated Channel Restock Recovery</h3>
                <p className="text-secondary small mb-3">
                  When new portions are prepped and added to stock, automatically re-list the item across all delivery aggregators once buffer is met.
                </p>
              </div>

              <div className="d-flex align-items-center justify-content-between p-2 rounded bg-dark border border-secondary border-opacity-25">
                <span className="text-secondary small">Re-list buffer threshold:</span>
                <div className="d-flex align-items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm py-0 px-2"
                    onClick={() => setBufferThreshold(Math.max(1, bufferThreshold - 1))}
                  >
                    -
                  </button>
                  <span className="badge bg-primary font-monospace">&ge; {bufferThreshold} units</span>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm py-0 px-2"
                    onClick={() => setBufferThreshold(bufferThreshold + 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Rule 3 */}
          <div className="col-12 col-md-6">
            <div className="p-3 rounded-3 bg-secondary bg-opacity-10 border border-secondary border-opacity-25 h-100 d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="badge bg-warning bg-opacity-20 text-warning border border-warning border-opacity-25 font-monospace">
                    RULE #3 &bull; CHEF OVERRIDE GUARD
                  </span>
                  <div className="form-check form-switch mb-0">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      role="switch"
                      id="switchRule3"
                      checked={lockOnManual}
                      onChange={(e) => setLockOnManual(e.target.checked)}
                    />
                  </div>
                </div>
                <h3 className="h6 fw-bold text-light mb-1">Kitchen Master Toggle Priority</h3>
                <p className="text-secondary small mb-3">
                  If kitchen staff manually turns off a dish master switch (e.g. ingredient spoiled), do not auto-restore until chef explicitly turns it on.
                </p>
              </div>
              <div className="p-2 rounded bg-dark border border-secondary border-opacity-25 small font-monospace text-secondary">
                Manual Kitchen overrides supersede automated triggers
              </div>
            </div>
          </div>

          {/* Rule 4 */}
          <div className="col-12 col-md-6">
            <div className="p-3 rounded-3 bg-secondary bg-opacity-10 border border-secondary border-opacity-25 h-100 d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="badge bg-info bg-opacity-20 text-info border border-info border-opacity-25 font-monospace">
                    RULE #4 &bull; DISPATCH LATENCY
                  </span>
                  <span className="badge bg-dark border border-secondary border-opacity-50 text-light font-monospace">
                    &lt; 150ms
                  </span>
                </div>
                <h3 className="h6 fw-bold text-light mb-1">Synchronous Webhook Broadcast</h3>
                <p className="text-secondary small mb-3">
                  All availability switches trigger parallel edge webhooks to Swiggy API, Zomato Order Partner API, and POS simultaneously.
                </p>
              </div>
              <div className="p-2 rounded bg-dark border border-secondary border-opacity-25 small font-monospace text-info">
                Parallel HTTP/2 multiplexing active
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
