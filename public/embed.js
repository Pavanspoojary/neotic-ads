/**
 * SponsorSlot Embeddable Client SDK (embed.js)
 * Lightweight, zero-dependency in-app native ad rendering script.
 *
 * Usage:
 * <script src="https://cdn.sponsorslot.com/embed.js" data-slot="20000000-0000-0000-0000-000000000001" async></script>
 * Or place a container:
 * <div data-sponsorslot="20000000-0000-0000-0000-000000000001" data-theme="dark"></div>
 */

(function () {
  'use strict';

  if (window.__SPONSORSLOT_LOADED__) return;
  window.__SPONSORSLOT_LOADED__ = true;

  var SCRIPT_SRC = (document.currentScript && document.currentScript.src) || '';
  var BASE_HOST = (function () {
    try {
      if (SCRIPT_SRC && SCRIPT_SRC.indexOf('http') === 0) {
        var url = new URL(SCRIPT_SRC);
        return url.origin;
      }
    } catch (e) {}
    return window.location.origin;
  })();

  // Inject scoped styles once
  var STYLE_ID = 'sponsorslot-styles';
  if (!document.getElementById(STYLE_ID)) {
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .sponsorslot-root {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        box-sizing: border-box;
        line-height: 1.4;
      }
      .sponsorslot-root * {
        box-sizing: border-box;
      }
      /* Format: Header Pill */
      .sponsorslot-pill {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 6px 12px;
        border-radius: 9999px;
        font-size: 12px;
        text-decoration: none;
        transition: all 0.15s ease-in-out;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        color: #334155;
      }
      .sponsorslot-pill:hover {
        background: #f1f5f9;
        border-color: #cbd5e1;
        color: #0f172a;
      }
      .sponsorslot-tag {
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        padding: 2px 6px;
        border-radius: 4px;
        background: #e0e7ff;
        color: #4338ca;
      }
      /* Format: Empty State Card */
      .sponsorslot-card {
        display: block;
        max-width: 360px;
        padding: 16px;
        border-radius: 12px;
        text-decoration: none;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        color: #1e293b;
        box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
        transition: transform 0.15s ease, box-shadow 0.15s ease;
      }
      .sponsorslot-card:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.08);
        border-color: #cbd5e1;
      }
      .sponsorslot-card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
      }
      .sponsorslot-card-title {
        font-size: 13px;
        font-weight: 500;
        color: #0f172a;
      }
      /* Format: Footer Badge */
      .sponsorslot-footer {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: #64748b;
        text-decoration: none;
        padding: 4px 8px;
        border-radius: 6px;
      }
      .sponsorslot-footer:hover {
        color: #0f172a;
        background: #f1f5f9;
      }
      /* Dark mode support */
      .sponsorslot-dark .sponsorslot-pill {
        background: #1e293b;
        border-color: #334155;
        color: #e2e8f0;
      }
      .sponsorslot-dark .sponsorslot-pill:hover {
        background: #334155;
        color: #ffffff;
      }
      .sponsorslot-dark .sponsorslot-tag {
        background: #312e81;
        color: #a5b4fc;
      }
      .sponsorslot-dark .sponsorslot-card {
        background: #0f172a;
        border-color: #1e293b;
        color: #f8fafc;
      }
      .sponsorslot-dark .sponsorslot-footer {
        color: #94a3b8;
      }
    `;
    document.head.appendChild(style);
  }

  function sendTelemetry(endpoint, slotId, event) {
    var url = endpoint.indexOf('http') === 0 ? endpoint : BASE_HOST + endpoint;
    var payload = JSON.stringify({ slot_id: slotId, event: event });

    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, payload);
    } else {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(function () {});
    }
  }

  function renderSlot(container, slotId, theme) {
    var apiUrl = BASE_HOST + '/api/v1/slot/' + slotId;

    fetch(apiUrl)
      .then(function (res) {
        if (!res.ok) throw new Error('Slot HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        var slotType = (data.slot && data.slot.type) || 'header_pill';
        var creative = data.creative || {};
        var beacon = data.beacon || { endpoint: '/api/v1/telemetry/beacon', slot_id: slotId };
        var text = creative.text || 'Place your product here via SponsorSlot';
        var targetUrl = creative.target_url || '#';
        var isFallback = data.fallback || false;

        var wrapper = document.createElement('div');
        wrapper.className = 'sponsorslot-root' + (theme === 'dark' ? ' sponsorslot-dark' : '');

        var link = document.createElement('a');
        link.href = targetUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer sponsored';

        if (slotType === 'empty_state') {
          link.className = 'sponsorslot-card';
          link.innerHTML =
            '<div class="sponsorslot-card-header">' +
            '<span class="sponsorslot-tag">' + (isFallback ? 'Sponsor' : 'Featured') + '</span>' +
            '<span style="font-size:10px;color:#94a3b8;">' + (creative.disclaimer_text || 'Sponsored') + '</span>' +
            '</div>' +
            '<div class="sponsorslot-card-title">' + escapeHtml(text) + '</div>';
        } else if (slotType === 'footer_badge') {
          link.className = 'sponsorslot-footer';
          link.innerHTML =
            '<span style="font-weight:600;">Partner:</span> ' +
            '<span>' + escapeHtml(text) + '</span>';
        } else {
          // Default header_pill
          link.className = 'sponsorslot-pill';
          link.innerHTML =
            '<span class="sponsorslot-tag">' + (isFallback ? '⚡ Sponsor' : 'Ad') + '</span>' +
            '<span>' + escapeHtml(text) + '</span>';
        }

        // Click telemetry
        link.addEventListener('click', function () {
          sendTelemetry(beacon.endpoint, beacon.slot_id, 'click');
        });

        wrapper.appendChild(link);
        container.innerHTML = '';
        container.appendChild(wrapper);

        // Impression telemetry via IntersectionObserver
        if ('IntersectionObserver' in window) {
          var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
              if (entry.isIntersecting) {
                sendTelemetry(beacon.endpoint, beacon.slot_id, 'impression');
                observer.unobserve(entry.target);
              }
            });
          }, { threshold: 0.5 });
          observer.observe(wrapper);
        } else {
          sendTelemetry(beacon.endpoint, beacon.slot_id, 'impression');
        }
      })
      .catch(function (err) {
        console.warn('[SponsorSlot] Failed to load slot ' + slotId + ':', err);
      });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Scan document for slots
  function init() {
    // 1. Check currentScript data-slot
    if (document.currentScript) {
      var slotId = document.currentScript.getAttribute('data-slot');
      if (slotId) {
        var theme = document.currentScript.getAttribute('data-theme') || 'light';
        var container = document.createElement('div');
        document.currentScript.parentNode.insertBefore(container, document.currentScript);
        renderSlot(container, slotId, theme);
      }
    }

    // 2. Check all container elements
    var elements = document.querySelectorAll('[data-sponsorslot], [data-slot]');
    elements.forEach(function (el) {
      if (el.tagName.toLowerCase() === 'script') return;
      var id = el.getAttribute('data-sponsorslot') || el.getAttribute('data-slot');
      var theme = el.getAttribute('data-theme') || 'light';
      if (id) renderSlot(el, id, theme);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
