<?php
/**
 * WooCommerce Blocks integration for MyCryptoCoin Gateway.
 *
 * @package MyCryptoCoin_Gateway
 */

defined( 'ABSPATH' ) || exit;

use Automattic\WooCommerce\Blocks\Payments\Integrations\AbstractPaymentMethodType;

/**
 * MyCryptoCoin Blocks Support.
 */
final class MyCryptoCoin_Blocks_Support extends AbstractPaymentMethodType {

	/**
	 * Payment method name/id/slug.
	 *
	 * @var string
	 */
	protected $name = 'mycryptocoin';

	/**
	 * Gateway instance.
	 *
	 * @var MyCryptoCoin_Gateway|null
	 */
	private $gateway = null;

	/**
	 * Initializes the payment method type.
	 */
	public function initialize() {
		$this->settings = get_option( 'woocommerce_mycryptocoin_settings', array() );

		$gateways = WC()->payment_gateways->payment_gateways();
		if ( isset( $gateways['mycryptocoin'] ) ) {
			$this->gateway = $gateways['mycryptocoin'];
		}
	}

	/**
	 * Returns if this payment method should be active. If false, the scripts will not be enqueued.
	 *
	 * @return bool
	 */
	public function is_active() {
		if ( null === $this->gateway ) {
			return false;
		}
		return $this->gateway->is_available();
	}

	/**
	 * Returns an array of scripts/handles to be registered for this payment method.
	 *
	 * @return array
	 */
	public function get_payment_method_script_handles() {
		$asset_path = MYCRYPTOCOIN_GATEWAY_PLUGIN_DIR . 'assets/js/mycryptocoin-blocks.asset.php';
		$version    = MYCRYPTOCOIN_GATEWAY_VERSION;
		$deps       = array();

		if ( file_exists( $asset_path ) ) {
			$asset   = require $asset_path;
			$version = isset( $asset['version'] ) ? $asset['version'] : $version;
			$deps    = isset( $asset['dependencies'] ) ? $asset['dependencies'] : $deps;
		}

		wp_register_script(
			'mycryptocoin-blocks',
			MYCRYPTOCOIN_GATEWAY_PLUGIN_URL . 'assets/js/mycryptocoin-blocks.js',
			$deps,
			$version,
			true
		);

		wp_set_script_translations(
			'mycryptocoin-blocks',
			'mycryptocoin-gateway',
			MYCRYPTOCOIN_GATEWAY_PLUGIN_DIR . 'languages'
		);

		return array( 'mycryptocoin-blocks' );
	}

	/**
	 * Returns an array of key=>value pairs of data made available to the payment methods script.
	 *
	 * @return array
	 */
	public function get_payment_method_data() {
		$all_cryptos       = MyCryptoCoin_Gateway::get_all_cryptos();
		$supported_cryptos = isset( $this->settings['supported_cryptos'] ) ? $this->settings['supported_cryptos'] : array( 'btc', 'eth', 'usdt' );

		$crypto_options = array();
		foreach ( $supported_cryptos as $crypto ) {
			if ( isset( $all_cryptos[ $crypto ] ) ) {
				$crypto_options[] = array(
					'value' => $crypto,
					'label' => $all_cryptos[ $crypto ],
				);
			}
		}

		$test_mode = isset( $this->settings['test_mode'] ) && 'yes' === $this->settings['test_mode'];

		return array(
			'title'       => isset( $this->settings['title'] ) ? $this->settings['title'] : __( 'Pay with Crypto', 'mycryptocoin-gateway' ),
			'description' => isset( $this->settings['description'] ) ? $this->settings['description'] : '',
			'supports'    => $this->get_supported_features(),
			'cryptos'     => $crypto_options,
			'testMode'    => $test_mode,
			'icons'       => $this->get_crypto_icons( $supported_cryptos ),
			'pluginUrl'   => MYCRYPTOCOIN_GATEWAY_PLUGIN_URL,
		);
	}

	/**
	 * Returns an array of supported features.
	 *
	 * @return array
	 */
	public function get_supported_features() {
		if ( null === $this->gateway ) {
			return array( 'products' );
		}
		return $this->gateway->supports;
	}

	/**
	 * Get crypto icon URLs.
	 *
	 * @param array $cryptos List of crypto slugs.
	 * @return array
	 */
	private function get_crypto_icons( $cryptos ) {
		$icons = array();
		foreach ( $cryptos as $crypto ) {
			$icons[ $crypto ] = MYCRYPTOCOIN_GATEWAY_PLUGIN_URL . 'assets/images/crypto-' . $crypto . '.svg';
		}
		return $icons;
	}
}
