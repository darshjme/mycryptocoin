/**
 * MyCryptoCoin Gateway — Checkout JavaScript
 *
 * Handles crypto selection, payment status polling, and QR code display.
 *
 * @package MyCryptoCoin_Gateway
 */

/* global jQuery, mycryptocoinCheckout */

(function ($) {
	'use strict';

	var MyCryptoCoinCheckout = {

		/**
		 * Polling interval reference.
		 */
		pollInterval: null,

		/**
		 * Polling delay in milliseconds.
		 */
		pollDelay: 5000,

		/**
		 * Maximum poll attempts.
		 */
		maxPolls: 360, // 30 minutes at 5s intervals.

		/**
		 * Current poll count.
		 */
		pollCount: 0,

		/**
		 * Timer countdown reference.
		 */
		timerInterval: null,

		/**
		 * Initialize.
		 */
		init: function () {
			this.bindEvents();
			this.initPaymentPage();
		},

		/**
		 * Bind checkout events.
		 */
		bindEvents: function () {
			// Update selected crypto visual state on change.
			$(document.body).on('change', 'input[name="mycryptocoin_crypto"]', function () {
				$('.mycryptocoin-crypto-option__inner').removeClass('selected');
				$(this).closest('.mycryptocoin-crypto-option').find('.mycryptocoin-crypto-option__inner').addClass('selected');
			});

			// Re-init after WooCommerce updates checkout fragments.
			$(document.body).on('updated_checkout', function () {
				MyCryptoCoinCheckout.refreshPaymentFields();
			});

			// Copy address to clipboard.
			$(document.body).on('click', '.mycryptocoin-address__copy', function (e) {
				e.preventDefault();
				var address = $(this).siblings('code').text().trim();
				MyCryptoCoinCheckout.copyToClipboard(address, $(this));
			});
		},

		/**
		 * Refresh payment fields after checkout update.
		 */
		refreshPaymentFields: function () {
			var $selected = $('input[name="mycryptocoin_crypto"]:checked');
			if ($selected.length) {
				$selected.closest('.mycryptocoin-crypto-option').find('.mycryptocoin-crypto-option__inner').addClass('selected');
			}
		},

		/**
		 * Initialize the payment page (if on payment template).
		 */
		initPaymentPage: function () {
			var $page = $('.mycryptocoin-payment-page');
			if (!$page.length) {
				return;
			}

			var sessionId = $page.data('session-id');
			var expiresAt = $page.data('expires-at');

			if (sessionId) {
				this.startPolling(sessionId);
			}

			if (expiresAt) {
				this.startTimer(expiresAt);
			}

			this.initQRCode($page);
		},

		/**
		 * Generate a QR code for the payment address.
		 *
		 * @param {jQuery} $page Payment page container.
		 */
		initQRCode: function ($page) {
			var $container = $page.find('.mycryptocoin-qr-container');
			if (!$container.length) {
				return;
			}

			var address = $container.data('address');
			var crypto  = $container.data('crypto');
			var amount  = $container.data('amount');

			if (!address) {
				return;
			}

			// Build URI based on crypto type.
			var uri = address;
			if (crypto && amount) {
				var prefix = this.getCryptoURIPrefix(crypto);
				if (prefix) {
					uri = prefix + ':' + address + '?amount=' + amount;
				}
			}

			// Use QRCode library if available, otherwise show the address as text.
			if (typeof QRCode !== 'undefined') {
				new QRCode($container[0], {
					text: uri,
					width: 200,
					height: 200,
					colorDark: '#1a1a2e',
					colorLight: '#ffffff',
					correctLevel: QRCode.CorrectLevel.M
				});
			} else {
				// Fallback: display the address as copyable text (no external API calls).
				var qrFallback = (mycryptocoinCheckout.i18n && mycryptocoinCheckout.i18n.qrFallback) || 'QR code library not loaded. Please copy the address below.';
				$container.html('<p style="font-size:13px;color:#718096;padding:20px;">' + $('<span>').text(qrFallback).html() + '</p>');
			}
		},

		/**
		 * Get cryptocurrency URI prefix.
		 *
		 * @param {string} crypto Crypto slug.
		 * @return {string|null}
		 */
		getCryptoURIPrefix: function (crypto) {
			var prefixes = {
				'btc': 'bitcoin',
				'eth': 'ethereum',
				'ltc': 'litecoin',
				'doge': 'dogecoin',
				'xrp': 'ripple',
				'sol': 'solana',
				'bnb': 'bnb'
			};
			return prefixes[crypto] || null;
		},

		/**
		 * Start polling for payment status.
		 *
		 * @param {string} sessionId Payment session ID.
		 */
		startPolling: function (sessionId) {
			var self = this;

			this.stopPolling();
			this.pollCount = 0;

			this.pollInterval = setInterval(function () {
				self.pollCount++;

				if (self.pollCount >= self.maxPolls) {
					self.stopPolling();
					self.updateStatus('expired');
					return;
				}

				self.checkPaymentStatus(sessionId);
			}, this.pollDelay);
		},

		/**
		 * Stop polling.
		 */
		stopPolling: function () {
			if (this.pollInterval) {
				clearInterval(this.pollInterval);
				this.pollInterval = null;
			}
		},

		/**
		 * Check payment status via REST API.
		 *
		 * @param {string} sessionId Payment session ID.
		 */
		checkPaymentStatus: function (sessionId) {
			var self = this;

			$.ajax({
				url: mycryptocoinCheckout.restUrl + 'payment-status/' + sessionId,
				method: 'GET',
				beforeSend: function (xhr) {
					xhr.setRequestHeader('X-WP-Nonce', mycryptocoinCheckout.nonce);
				},
				success: function (response) {
					if (response && response.status) {
						self.updateStatus(response.status);

						if (response.status === 'confirmed') {
							self.stopPolling();
							self.stopTimer();
							if (response.redirect_url) {
								window.location.href = response.redirect_url;
							}
						} else if (response.status === 'failed' || response.status === 'expired') {
							self.stopPolling();
							self.stopTimer();
						}
					}
				},
				error: function () {
					// Silent fail, continue polling.
				}
			});
		},

		/**
		 * Update the payment status display.
		 *
		 * @param {string} status Payment status.
		 */
		updateStatus: function (status) {
			var $statusEl = $('.mycryptocoin-status');
			if (!$statusEl.length) {
				return;
			}

			// Remove all status classes.
			$statusEl.removeClass('mycryptocoin-status--pending mycryptocoin-status--confirming mycryptocoin-status--confirmed mycryptocoin-status--failed mycryptocoin-status--expired');

			var i18n = mycryptocoinCheckout.i18n || {};
			var statusLabels = {
				'pending': i18n.statusPending || 'Waiting for payment...',
				'confirming': i18n.statusConfirming || 'Payment detected, confirming...',
				'confirmed': i18n.statusConfirmed || 'Payment confirmed!',
				'failed': i18n.statusFailed || 'Payment failed',
				'expired': i18n.statusExpired || 'Payment expired'
			};

			var label = statusLabels[status] || status;
			var showSpinner = (status === 'pending' || status === 'confirming');

			$statusEl.addClass('mycryptocoin-status--' + status);
			$statusEl.html(
				(showSpinner ? '<span class="mycryptocoin-spinner"></span>' : '') +
				'<span>' + label + '</span>'
			);
		},

		/**
		 * Start the countdown timer.
		 *
		 * @param {number|string} expiresAt Expiration timestamp (Unix seconds or ISO string).
		 */
		startTimer: function (expiresAt) {
			var self = this;
			var expiryTime;

			if (typeof expiresAt === 'number') {
				expiryTime = expiresAt * 1000;
			} else {
				expiryTime = new Date(expiresAt).getTime();
			}

			this.stopTimer();

			this.updateTimerDisplay(expiryTime);

			this.timerInterval = setInterval(function () {
				self.updateTimerDisplay(expiryTime);
			}, 1000);
		},

		/**
		 * Stop the timer.
		 */
		stopTimer: function () {
			if (this.timerInterval) {
				clearInterval(this.timerInterval);
				this.timerInterval = null;
			}
		},

		/**
		 * Update the timer display.
		 *
		 * @param {number} expiryTime Expiration time in ms.
		 */
		updateTimerDisplay: function (expiryTime) {
			var $timer = $('.mycryptocoin-timer');
			if (!$timer.length) {
				return;
			}

			var now = Date.now();
			var remaining = Math.max(0, expiryTime - now);

			if (remaining <= 0) {
				$timer.addClass('expired');
				var expiredText = (mycryptocoinCheckout.i18n && mycryptocoinCheckout.i18n.timerExpired) || 'Payment window expired';
				$timer.html('<span class="mycryptocoin-timer__icon">&#9203;</span> ' + expiredText);
				this.stopTimer();
				return;
			}

			var minutes = Math.floor(remaining / 60000);
			var seconds = Math.floor((remaining % 60000) / 1000);

			var display = (minutes < 10 ? '0' : '') + minutes + ':' + (seconds < 10 ? '0' : '') + seconds;

			var timeLabel = (mycryptocoinCheckout.i18n && mycryptocoinCheckout.i18n.timeRemaining) || 'Time remaining:';
			$timer.html('<span class="mycryptocoin-timer__icon">&#9203;</span> ' + timeLabel + ' ' + display);

			// Add urgency styling when under 2 minutes.
			if (remaining < 120000) {
				$timer.addClass('urgent');
			}
		},

		/**
		 * Copy text to clipboard.
		 *
		 * @param {string} text    Text to copy.
		 * @param {jQuery} $button Button element for feedback.
		 */
		copyToClipboard: function (text, $button) {
			if (navigator.clipboard && navigator.clipboard.writeText) {
				navigator.clipboard.writeText(text).then(function () {
					MyCryptoCoinCheckout.showCopyFeedback($button);
				});
			} else {
				// Fallback for older browsers.
				var textarea = document.createElement('textarea');
				textarea.value = text;
				textarea.style.position = 'fixed';
				textarea.style.opacity = '0';
				document.body.appendChild(textarea);
				textarea.select();
				try {
					document.execCommand('copy');
					MyCryptoCoinCheckout.showCopyFeedback($button);
				} catch (e) {
					// Copy failed silently.
				}
				document.body.removeChild(textarea);
			}
		},

		/**
		 * Show copy feedback on button.
		 *
		 * @param {jQuery} $button Button element.
		 */
		showCopyFeedback: function ($button) {
			var originalText = $button.text();
			var copiedText = (mycryptocoinCheckout.i18n && mycryptocoinCheckout.i18n.copied) || 'Copied!';
			$button.text(copiedText);
			setTimeout(function () {
				$button.text(originalText);
			}, 2000);
		}
	};

	$(function () {
		MyCryptoCoinCheckout.init();
	});

})(jQuery);
