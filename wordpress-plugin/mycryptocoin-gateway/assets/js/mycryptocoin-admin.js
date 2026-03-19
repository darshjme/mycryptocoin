/**
 * MyCryptoCoin Gateway — Admin JavaScript
 *
 * Handles API key validation, test connection, and admin UI interactions.
 *
 * @package MyCryptoCoin_Gateway
 */

/* global jQuery, mycryptocoinAdmin */

(function ($) {
	'use strict';

	var MyCryptoCoinAdmin = {

		/**
		 * Initialize.
		 */
		init: function () {
			this.bindEvents();
			this.toggleApiKeyFields();
		},

		/**
		 * Bind events.
		 */
		bindEvents: function () {
			// Test connection button.
			$('#mycryptocoin-test-connection').on('click', this.testConnection);

			// Copy webhook URL.
			$('.mycryptocoin-copy-btn').on('click', this.copyToClipboard);

			// Toggle API key fields based on test mode.
			$('#woocommerce_mycryptocoin_test_mode').on('change', this.toggleApiKeyFields);

			// Toggle password visibility.
			this.addPasswordToggles();
		},

		/**
		 * Test the API connection.
		 *
		 * @param {Event} e Click event.
		 */
		testConnection: function (e) {
			e.preventDefault();

			var $button = $(this);
			var $status = $('#mycryptocoin-connection-status');
			var isTestMode = $('#woocommerce_mycryptocoin_test_mode').is(':checked');
			var apiKey;

			if (isTestMode) {
				apiKey = $('#woocommerce_mycryptocoin_test_api_key').val();
			} else {
				apiKey = $('#woocommerce_mycryptocoin_live_api_key').val();
			}

			if (!apiKey) {
				$status
					.removeClass('success testing')
					.addClass('error')
					.text(mycryptocoinAdmin.noKeyText);
				return;
			}

			$button.prop('disabled', true);
			$status
				.removeClass('success error')
				.addClass('testing')
				.text(mycryptocoinAdmin.testingText);

			$.ajax({
				url: mycryptocoinAdmin.ajaxUrl,
				method: 'POST',
				data: {
					action: 'mycryptocoin_test_connection',
					nonce: mycryptocoinAdmin.nonce,
					api_key: apiKey,
					test_mode: isTestMode ? 'yes' : 'no'
				},
				success: function (response) {
					$button.prop('disabled', false);

					if (response.success) {
						$status
							.removeClass('error testing')
							.addClass('success')
							.text(mycryptocoinAdmin.successText);
					} else {
						var message = response.data && response.data.message
							? response.data.message
							: mycryptocoinAdmin.failText;
						$status
							.removeClass('success testing')
							.addClass('error')
							.text(message);
					}
				},
				error: function () {
					$button.prop('disabled', false);
					$status
						.removeClass('success testing')
						.addClass('error')
						.text(mycryptocoinAdmin.errorText);
				}
			});
		},

		/**
		 * Copy text to clipboard from a target element.
		 *
		 * @param {Event} e Click event.
		 */
		copyToClipboard: function (e) {
			e.preventDefault();

			var $button = $(this);
			var targetSelector = $button.data('copy-target');
			var $target = $(targetSelector);

			if (!$target.length) {
				return;
			}

			var text = $target.text().trim();

			if (navigator.clipboard && navigator.clipboard.writeText) {
				navigator.clipboard.writeText(text).then(function () {
					MyCryptoCoinAdmin.showCopyFeedback($button);
				});
			} else {
				var textarea = document.createElement('textarea');
				textarea.value = text;
				textarea.style.position = 'fixed';
				textarea.style.opacity = '0';
				document.body.appendChild(textarea);
				textarea.select();
				try {
					document.execCommand('copy');
					MyCryptoCoinAdmin.showCopyFeedback($button);
				} catch (err) {
					// Silently fail.
				}
				document.body.removeChild(textarea);
			}
		},

		/**
		 * Show copy feedback.
		 *
		 * @param {jQuery} $button Button element.
		 */
		showCopyFeedback: function ($button) {
			var originalText = $button.text();
			$button.text(mycryptocoinAdmin.copiedText);
			setTimeout(function () {
				$button.text(originalText);
			}, 2000);
		},

		/**
		 * Toggle API key field visibility based on test mode.
		 */
		toggleApiKeyFields: function () {
			var isTestMode = $('#woocommerce_mycryptocoin_test_mode').is(':checked');
			var $liveRow = $('#woocommerce_mycryptocoin_live_api_key').closest('tr');
			var $testRow = $('#woocommerce_mycryptocoin_test_api_key').closest('tr');

			if (isTestMode) {
				$liveRow.css('opacity', '0.5');
				$testRow.css('opacity', '1');
			} else {
				$liveRow.css('opacity', '1');
				$testRow.css('opacity', '0.5');
			}
		},

		/**
		 * Add password visibility toggle buttons to password fields.
		 */
		addPasswordToggles: function () {
			$('#woocommerce_mycryptocoin_live_api_key, #woocommerce_mycryptocoin_test_api_key, #woocommerce_mycryptocoin_webhook_secret').each(function () {
				var $input = $(this);

				if ($input.next('.mycryptocoin-toggle-visibility').length) {
					return;
				}

				var $wrapper = $('<span class="mycryptocoin-field-wrapper"></span>');
				$input.wrap($wrapper);

				var $toggle = $('<button type="button" class="mycryptocoin-toggle-visibility" title="Show/Hide">' +
					'<span class="dashicons dashicons-visibility"></span>' +
					'</button>');

				$input.after($toggle);

				$toggle.on('click', function (e) {
					e.preventDefault();
					var $icon = $(this).find('.dashicons');

					if ($input.attr('type') === 'password') {
						$input.attr('type', 'text');
						$icon.removeClass('dashicons-visibility').addClass('dashicons-hidden');
					} else {
						$input.attr('type', 'password');
						$icon.removeClass('dashicons-hidden').addClass('dashicons-visibility');
					}
				});
			});
		}
	};

	$(function () {
		MyCryptoCoinAdmin.init();
	});

})(jQuery);
