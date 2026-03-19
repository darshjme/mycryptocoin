<?php
/**
 * Plugin Name: MyCryptoCoin Gateway
 * Plugin URI: https://mycrypto.co.in/woocommerce
 * Description: Accept Bitcoin, Ethereum, and 10+ cryptocurrencies on your WooCommerce store. Powered by MyCryptoCoin — the Stripe of crypto payments. Just 0.5% per transaction.
 * Version: 1.0.0
 * Author: MyCryptoCoin
 * Author URI: https://mycrypto.co.in
 * License: GPL-2.0+
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: mycryptocoin-gateway
 * Domain Path: /languages
 * Requires at least: 6.0
 * Tested up to: 6.5
 * Requires PHP: 7.4
 * WC requires at least: 7.0
 * WC tested up to: 8.5
 *
 * @package MyCryptoCoin_Gateway
 */

defined( 'ABSPATH' ) || exit;

/**
 * Plugin constants.
 */
define( 'MYCRYPTOCOIN_GATEWAY_VERSION', '1.0.0' );
define( 'MYCRYPTOCOIN_GATEWAY_PLUGIN_FILE', __FILE__ );
define( 'MYCRYPTOCOIN_GATEWAY_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'MYCRYPTOCOIN_GATEWAY_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'MYCRYPTOCOIN_GATEWAY_API_BASE', 'https://api.mycrypto.co.in/v1' );
define( 'MYCRYPTOCOIN_GATEWAY_PAY_BASE', 'https://mycrypto.co.in/pay' );

/**
 * Main plugin class.
 */
final class MyCryptoCoin_Gateway_Plugin {

	/**
	 * Single instance.
	 *
	 * @var MyCryptoCoin_Gateway_Plugin|null
	 */
	private static $instance = null;

	/**
	 * Get singleton instance.
	 *
	 * @return MyCryptoCoin_Gateway_Plugin
	 */
	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Constructor.
	 */
	private function __construct() {
		add_action( 'plugins_loaded', array( $this, 'init' ), 0 );
		register_activation_hook( __FILE__, array( $this, 'activate' ) );
		register_deactivation_hook( __FILE__, array( $this, 'deactivate' ) );
	}

	/**
	 * Initialize plugin after all plugins are loaded.
	 */
	public function init() {
		if ( ! $this->check_dependencies() ) {
			return;
		}

		$this->load_textdomain();
		$this->includes();

		add_filter( 'woocommerce_payment_gateways', array( $this, 'register_gateway' ) );
		add_filter( 'plugin_action_links_' . plugin_basename( __FILE__ ), array( $this, 'plugin_action_links' ) );

		// Declare HPOS compatibility.
		add_action( 'before_woocommerce_init', array( $this, 'declare_hpos_compatibility' ) );

		// Initialize webhook handler.
		new MyCryptoCoin_Webhook_Handler();

		// Initialize blocks support.
		if ( class_exists( 'Automattic\WooCommerce\Blocks\Payments\Integrations\AbstractPaymentMethodType' ) ) {
			add_action( 'woocommerce_blocks_loaded', array( $this, 'register_blocks_support' ) );
		}
	}

	/**
	 * Check that WooCommerce is active.
	 *
	 * @return bool
	 */
	private function check_dependencies() {
		if ( ! class_exists( 'WooCommerce' ) ) {
			add_action( 'admin_notices', array( $this, 'woocommerce_missing_notice' ) );
			return false;
		}

		if ( version_compare( WC_VERSION, '7.0', '<' ) ) {
			add_action( 'admin_notices', array( $this, 'woocommerce_version_notice' ) );
			return false;
		}

		return true;
	}

	/**
	 * Admin notice when WooCommerce is not installed.
	 */
	public function woocommerce_missing_notice() {
		?>
		<div class="notice notice-error">
			<p>
				<strong><?php esc_html_e( 'MyCryptoCoin Gateway', 'mycryptocoin-gateway' ); ?></strong>
				<?php esc_html_e( 'requires WooCommerce to be installed and active. Please install WooCommerce first.', 'mycryptocoin-gateway' ); ?>
			</p>
		</div>
		<?php
	}

	/**
	 * Admin notice when WooCommerce version is too old.
	 */
	public function woocommerce_version_notice() {
		?>
		<div class="notice notice-error">
			<p>
				<strong><?php esc_html_e( 'MyCryptoCoin Gateway', 'mycryptocoin-gateway' ); ?></strong>
				<?php
				printf(
					/* translators: %s: Required WooCommerce version */
					esc_html__( 'requires WooCommerce version %s or later. Please update WooCommerce.', 'mycryptocoin-gateway' ),
					'7.0'
				);
				?>
			</p>
		</div>
		<?php
	}

	/**
	 * Load plugin text domain.
	 */
	private function load_textdomain() {
		load_plugin_textdomain(
			'mycryptocoin-gateway',
			false,
			dirname( plugin_basename( __FILE__ ) ) . '/languages'
		);
	}

	/**
	 * Include required files.
	 */
	private function includes() {
		require_once MYCRYPTOCOIN_GATEWAY_PLUGIN_DIR . 'includes/class-mycryptocoin-logger.php';
		require_once MYCRYPTOCOIN_GATEWAY_PLUGIN_DIR . 'includes/class-mycryptocoin-api.php';
		require_once MYCRYPTOCOIN_GATEWAY_PLUGIN_DIR . 'includes/class-mycryptocoin-gateway.php';
		require_once MYCRYPTOCOIN_GATEWAY_PLUGIN_DIR . 'includes/class-mycryptocoin-webhook-handler.php';
		require_once MYCRYPTOCOIN_GATEWAY_PLUGIN_DIR . 'includes/class-mycryptocoin-blocks.php';
	}

	/**
	 * Register gateway with WooCommerce.
	 *
	 * @param array $gateways Existing gateways.
	 * @return array
	 */
	public function register_gateway( $gateways ) {
		$gateways[] = 'MyCryptoCoin_Gateway';
		return $gateways;
	}

	/**
	 * Add settings link to plugins page.
	 *
	 * @param array $links Existing links.
	 * @return array
	 */
	public function plugin_action_links( $links ) {
		$settings_url = admin_url( 'admin.php?page=wc-settings&tab=checkout&section=mycryptocoin' );
		$plugin_links = array(
			'<a href="' . esc_url( $settings_url ) . '">' . esc_html__( 'Settings', 'mycryptocoin-gateway' ) . '</a>',
			'<a href="https://mycrypto.co.in/docs" target="_blank">' . esc_html__( 'Docs', 'mycryptocoin-gateway' ) . '</a>',
			'<a href="https://mycrypto.co.in/support" target="_blank">' . esc_html__( 'Support', 'mycryptocoin-gateway' ) . '</a>',
		);
		return array_merge( $plugin_links, $links );
	}

	/**
	 * Declare High-Performance Order Storage compatibility.
	 */
	public function declare_hpos_compatibility() {
		if ( class_exists( '\Automattic\WooCommerce\Utilities\FeaturesUtil' ) ) {
			\Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility( 'custom_order_tables', __FILE__, true );
		}
	}

	/**
	 * Register WooCommerce Blocks integration.
	 */
	public function register_blocks_support() {
		if ( class_exists( 'Automattic\WooCommerce\Blocks\Payments\PaymentMethodRegistry' ) ) {
			add_action(
				'woocommerce_blocks_payment_method_type_registration',
				function( $payment_method_registry ) {
					$payment_method_registry->register( new MyCryptoCoin_Blocks_Support() );
				}
			);
		}
	}

	/**
	 * Plugin activation.
	 */
	public function activate() {
		if ( ! class_exists( 'WooCommerce' ) ) {
			deactivate_plugins( plugin_basename( __FILE__ ) );
			wp_die(
				esc_html__( 'MyCryptoCoin Gateway requires WooCommerce to be installed and active.', 'mycryptocoin-gateway' ),
				esc_html__( 'Plugin Activation Error', 'mycryptocoin-gateway' ),
				array( 'back_link' => true )
			);
		}

		// Set default options.
		$defaults = array(
			'mycryptocoin_gateway_version' => MYCRYPTOCOIN_GATEWAY_VERSION,
			'mycryptocoin_gateway_installed' => time(),
		);

		foreach ( $defaults as $key => $value ) {
			if ( false === get_option( $key ) ) {
				add_option( $key, $value );
			}
		}

		// Flush rewrite rules for REST API endpoint.
		flush_rewrite_rules();
	}

	/**
	 * Plugin deactivation.
	 */
	public function deactivate() {
		flush_rewrite_rules();
	}
}

/**
 * Initialize the plugin.
 *
 * @return MyCryptoCoin_Gateway_Plugin
 */
function mycryptocoin_gateway() {
	return MyCryptoCoin_Gateway_Plugin::instance();
}

mycryptocoin_gateway();
