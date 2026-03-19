/**
 * MyCryptoCoin Gateway — WooCommerce Blocks Integration
 *
 * Registers the MyCryptoCoin payment method with the WooCommerce Blocks checkout.
 *
 * @package MyCryptoCoin_Gateway
 */

/* global wc, mycryptocoinBlocksData */

( function () {
	'use strict';

	var settings = wc.wcSettings.getSetting( 'mycryptocoin_data', {} );
	var label    = settings.title || 'Pay with Crypto';

	/**
	 * Label component for the payment method.
	 *
	 * @param {Object} props Component props.
	 * @return {Object} React element.
	 */
	var Label = function ( props ) {
		var components = props.components;
		var PaymentMethodLabel = components.PaymentMethodLabel;

		return wp.element.createElement(
			PaymentMethodLabel,
			{
				text: label,
				icon: settings.pluginUrl ? settings.pluginUrl + 'assets/images/mycryptocoin-logo.svg' : ''
			}
		);
	};

	/**
	 * Content component — displays crypto selection on checkout.
	 *
	 * @param {Object} props Component props.
	 * @return {Object} React element.
	 */
	var Content = function ( props ) {
		var eventRegistration = props.eventRegistration;
		var emitResponse      = props.emitResponse;
		var onPaymentSetup    = eventRegistration.onPaymentSetup;

		var cryptos       = settings.cryptos || [];
		var description   = settings.description || '';
		var testMode      = settings.testMode || false;

		var selectedCrypto = wp.element.useState( cryptos.length > 0 ? cryptos[0].value : '' );
		var selected       = selectedCrypto[0];
		var setSelected    = selectedCrypto[1];

		// Register payment data on setup.
		wp.element.useEffect( function () {
			var unsubscribe = onPaymentSetup( function () {
				return {
					type: emitResponse.responseTypes.SUCCESS,
					meta: {
						paymentMethodData: {
							mycryptocoin_crypto: selected,
							mycryptocoin_nonce: '' // Nonce handled server-side for blocks.
						}
					}
				};
			} );
			return unsubscribe;
		}, [ onPaymentSetup, emitResponse.responseTypes.SUCCESS, selected ] );

		var descText = description;
		if ( testMode ) {
			descText += ' ' + wp.i18n.__( '(TEST MODE — no real crypto will be charged)', 'mycryptocoin-gateway' );
		}

		return wp.element.createElement(
			'div',
			{ className: 'mycryptocoin-payment-fields' },
			wp.element.createElement( 'p', null, descText ),
			wp.element.createElement(
				'p',
				{ className: 'mycryptocoin-select-label' },
				wp.i18n.__( 'Select your preferred cryptocurrency:', 'mycryptocoin-gateway' )
			),
			wp.element.createElement(
				'div',
				{ className: 'mycryptocoin-crypto-options' },
				cryptos.map( function ( crypto ) {
					return wp.element.createElement(
						'label',
						{
							key: crypto.value,
							className: 'mycryptocoin-crypto-option'
						},
						wp.element.createElement( 'input', {
							type: 'radio',
							name: 'mycryptocoin_crypto_block',
							value: crypto.value,
							checked: selected === crypto.value,
							onChange: function () { setSelected( crypto.value ); }
						} ),
						wp.element.createElement(
							'span',
							{ className: 'mycryptocoin-crypto-option__inner' },
							wp.element.createElement(
								'span',
								{ className: 'mycryptocoin-crypto-option__icon mycryptocoin-icon-' + crypto.value },
								crypto.value.toUpperCase()
							),
							wp.element.createElement(
								'span',
								{ className: 'mycryptocoin-crypto-option__name' },
								crypto.label
							)
						)
					);
				} )
			)
		);
	};

	/**
	 * Register the payment method with WooCommerce Blocks.
	 */
	var registerPaymentMethod = wc.wcBlocksRegistry.registerPaymentMethod;

	registerPaymentMethod( {
		name: 'mycryptocoin',
		label: wp.element.createElement( Label, null ),
		content: wp.element.createElement( Content, null ),
		edit: wp.element.createElement( Content, null ),
		canMakePayment: function () {
			return true;
		},
		ariaLabel: label,
		supports: {
			features: settings.supports || [ 'products' ]
		}
	} );

} )();
