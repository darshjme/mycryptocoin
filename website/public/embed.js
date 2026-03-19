/**
 * MyCryptoCoin — Embeddable Checkout Widget
 * Lightweight (<5KB) checkout integration for merchant websites.
 *
 * Usage:
 *   <script src="https://mycrypto.co.in/embed.js"></script>
 *   <script>
 *     MyCryptoCoin.checkout({ paymentId: 'xxx', mode: 'popup' });
 *     // or
 *     MyCryptoCoin.createCheckout({ amount: '100', currency: 'USD', apiKey: 'mcc_live_...' });
 *     // or
 *     MyCryptoCoin.renderInline(document.getElementById('checkout'), { amount: '100', currency: 'USD', apiKey: 'mcc_live_...' });
 *   </script>
 */
(function(window, document) {
  'use strict';

  var API_BASE = 'https://mycrypto.co.in/api/v1';
  var CHECKOUT_BASE = 'https://mycrypto.co.in/pay';

  var MyCryptoCoin = {
    _version: '2.0.0',
    _overlayEl: null,
    _iframeEl: null,
    _callbacks: {},

    /**
     * Open checkout for an existing payment/session.
     * @param {Object} opts - { paymentId | sessionId, mode: 'popup'|'page'|'inline', theme: {} }
     */
    checkout: function(opts) {
      opts = opts || {};
      var id = opts.paymentId || opts.sessionId;
      if (!id) {
        console.error('[MyCryptoCoin] paymentId or sessionId is required');
        return;
      }

      var mode = opts.mode || 'popup';
      var url = CHECKOUT_BASE + '/' + id;

      if (opts.theme) {
        var params = [];
        if (opts.theme.primaryColor) params.push('pc=' + encodeURIComponent(opts.theme.primaryColor));
        if (opts.theme.secondaryColor) params.push('sc=' + encodeURIComponent(opts.theme.secondaryColor));
        if (params.length) url += '?' + params.join('&');
      }

      if (mode === 'page') {
        window.location.href = url;
      } else if (mode === 'popup') {
        this._openPopup(url, opts);
      } else if (mode === 'inline' && opts.element) {
        this._renderInline(opts.element, url);
      }
    },

    /**
     * Create a new checkout session and open it.
     * @param {Object} opts - { amount, currency, apiKey, mode, onSuccess, onError, onClose }
     */
    createCheckout: function(opts) {
      opts = opts || {};
      if (!opts.amount || !opts.apiKey) {
        console.error('[MyCryptoCoin] amount and apiKey are required');
        return;
      }

      var self = this;
      var mode = opts.mode || 'popup';

      // Store callbacks
      this._callbacks = {
        onSuccess: opts.onSuccess || function() {},
        onError: opts.onError || function() {},
        onClose: opts.onClose || function() {},
      };

      // Create checkout session via API
      var xhr = new XMLHttpRequest();
      xhr.open('POST', API_BASE + '/checkout/session');
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Authorization', 'Bearer ' + opts.apiKey);

      xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
          var data = JSON.parse(xhr.responseText);
          if (data.success && data.data.sessionId) {
            self.checkout({
              sessionId: data.data.sessionId,
              mode: mode,
              element: opts.element,
              theme: opts.theme,
            });
          } else {
            self._callbacks.onError({ message: 'Failed to create checkout session' });
          }
        } else {
          self._callbacks.onError({ status: xhr.status, message: xhr.responseText });
        }
      };

      xhr.onerror = function() {
        self._callbacks.onError({ message: 'Network error' });
      };

      xhr.send(JSON.stringify({
        amount: opts.amount,
        currency: opts.currency || 'USD',
        displayMode: mode,
        customerEmail: opts.customerEmail,
        metadata: opts.metadata,
        successUrl: opts.successUrl,
        cancelUrl: opts.cancelUrl,
      }));
    },

    /**
     * Render checkout inline in a specific DOM element.
     * @param {HTMLElement} element - Container element
     * @param {Object} opts - Same as createCheckout
     */
    renderInline: function(element, opts) {
      if (!element) {
        console.error('[MyCryptoCoin] Container element is required');
        return;
      }
      opts = opts || {};
      opts.mode = 'inline';
      opts.element = element;
      this.createCheckout(opts);
    },

    /**
     * Close the popup if one is open.
     */
    close: function() {
      if (this._overlayEl) {
        document.body.removeChild(this._overlayEl);
        this._overlayEl = null;
        this._iframeEl = null;
        if (this._callbacks.onClose) this._callbacks.onClose();
      }
    },

    // ── Internal Methods ───────────────────────

    _openPopup: function(url, opts) {
      var self = this;

      // Create overlay
      var overlay = document.createElement('div');
      overlay.id = 'mcc-checkout-overlay';
      overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:999999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);';

      // Close on overlay click
      overlay.addEventListener('click', function(e) {
        if (e.target === overlay) self.close();
      });

      // Create iframe container
      var container = document.createElement('div');
      container.style.cssText = 'position:relative;width:90%;max-width:480px;height:90%;max-height:700px;border-radius:16px;overflow:hidden;box-shadow:0 25px 50px rgba(0,0,0,0.3);';

      // Close button
      var closeBtn = document.createElement('button');
      closeBtn.innerHTML = '&times;';
      closeBtn.style.cssText = 'position:absolute;top:8px;right:12px;z-index:10;background:none;border:none;color:white;font-size:28px;cursor:pointer;line-height:1;opacity:0.7;';
      closeBtn.addEventListener('click', function() { self.close(); });
      closeBtn.addEventListener('mouseenter', function() { this.style.opacity = '1'; });
      closeBtn.addEventListener('mouseleave', function() { this.style.opacity = '0.7'; });

      // Iframe
      var iframe = document.createElement('iframe');
      iframe.src = url + (url.indexOf('?') >= 0 ? '&' : '?') + 'embed=1&mode=popup';
      iframe.style.cssText = 'width:100%;height:100%;border:none;';
      iframe.setAttribute('allow', 'clipboard-write');

      container.appendChild(closeBtn);
      container.appendChild(iframe);
      overlay.appendChild(container);
      document.body.appendChild(overlay);

      this._overlayEl = overlay;
      this._iframeEl = iframe;

      // Listen for postMessage from iframe
      window.addEventListener('message', function handler(event) {
        if (!event.data || !event.data.type) return;
        if (event.data.type === 'mcc:payment:success') {
          if (self._callbacks.onSuccess) self._callbacks.onSuccess(event.data.payload);
          self.close();
          window.removeEventListener('message', handler);
        } else if (event.data.type === 'mcc:payment:error') {
          if (self._callbacks.onError) self._callbacks.onError(event.data.payload);
        } else if (event.data.type === 'mcc:checkout:close') {
          self.close();
          window.removeEventListener('message', handler);
        }
      });
    },

    _renderInline: function(element, url) {
      element.innerHTML = '';
      var iframe = document.createElement('iframe');
      iframe.src = url + (url.indexOf('?') >= 0 ? '&' : '?') + 'embed=1&mode=inline';
      iframe.style.cssText = 'width:100%;min-height:500px;border:none;border-radius:12px;';
      iframe.setAttribute('allow', 'clipboard-write');
      element.appendChild(iframe);
      this._iframeEl = iframe;

      var self = this;
      window.addEventListener('message', function handler(event) {
        if (!event.data || !event.data.type) return;
        if (event.data.type === 'mcc:payment:success') {
          if (self._callbacks.onSuccess) self._callbacks.onSuccess(event.data.payload);
          window.removeEventListener('message', handler);
        } else if (event.data.type === 'mcc:payment:error') {
          if (self._callbacks.onError) self._callbacks.onError(event.data.payload);
        }
      });
    },
  };

  // Export globally
  window.MyCryptoCoin = MyCryptoCoin;

})(window, document);
