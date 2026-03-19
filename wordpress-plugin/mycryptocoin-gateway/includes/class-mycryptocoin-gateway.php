<?php
/**
 * MyCryptoCoin Payment Gateway class.
 *
 * @package MyCryptoCoin_Gateway
 */

defined( 'ABSPATH' ) || exit;

/**
 * WooCommerce Payment Gateway for MyCryptoCoin.
 */
class MyCryptoCoin_Gateway extends WC_Payment_Gateway {

	/**
	 * API instance.
	 *
	 * @var MyCryptoCoin_API|null
	 */
	private $api = null;

	/**
	 * Whether test mode is active.
	 *
	 * @var bool
	 */
	private $test_mode;

	/**
	 * Live API key.
	 *
	 * @var string
	 */
	private $live_api_key;

	/**
	 * Test API key.
	 *
	 * @var string
	 */
	private $test_api_key;

	/**
	 * Webhook secret.
	 *
	 * @var string
	 */
	private $webhook_secret;

	/**
	 * Supported cryptocurrencies.
	 *
	 * @var array
	 */
	private $supported_cryptos;

	/**
	 * Order status after payment.
	 *
	 * @var string
	 */
	private $order_status;

	/**
	 * Debug logging enabled.
	 *
	 * @var bool
	 */
	private $debug;

	/**
	 * All available cryptocurrencies.
	 *
	 * @var array
	 */
	private static $all_cryptos = array(
		'btc'  => 'Bitcoin (BTC)',
		'eth'  => 'Ethereum (ETH)',
		'usdt' => 'Tether (USDT)',
		'usdc' => 'USD Coin (USDC)',
		'bnb'  => 'BNB (BNB)',
		'sol'  => 'Solana (SOL)',
		'xrp'  => 'XRP (XRP)',
		'ada'  => 'Cardano (ADA)',
		'doge' => 'Dogecoin (DOGE)',
		'matic' => 'Polygon (MATIC)',
		'ltc'  => 'Litecoin (LTC)',
		'trx'  => 'TRON (TRX)',
		'avax' => 'Avalanche (AVAX)',
	);

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->id                 = 'mycryptocoin';
		$this->icon               = MYCRYPTOCOIN_GATEWAY_PLUGIN_URL . 'assets/images/mycryptocoin-logo.svg';
		$this->has_fields         = true;
		$this->method_title       = __( 'MyCryptoCoin', 'mycryptocoin-gateway' );
		$this->method_description = __( 'Accept Bitcoin, Ethereum, and 10+ cryptocurrencies. Powered by MyCryptoCoin — the Stripe of crypto payments.', 'mycryptocoin-gateway' );
		$this->supports           = array(
			'products',
			'refunds',
		);

		// Load settings.
		$this->init_form_fields();
		$this->init_settings();

		// Read settings.
		$this->title             = $this->get_option( 'title' );
		$this->description       = $this->get_option( 'description' );
		$this->test_mode         = 'yes' === $this->get_option( 'test_mode' );
		$this->live_api_key      = $this->get_option( 'live_api_key' );
		$this->test_api_key      = $this->get_option( 'test_api_key' );
		$this->webhook_secret    = $this->get_option( 'webhook_secret' );
		$this->supported_cryptos = $this->get_option( 'supported_cryptos', array( 'btc', 'eth', 'usdt' ) );
		$this->order_status      = $this->get_option( 'order_status', 'processing' );
		$this->debug             = 'yes' === $this->get_option( 'debug' );
		$this->enabled           = $this->get_option( 'enabled' );

		// Hooks.
		add_action( 'woocommerce_update_options_payment_gateways_' . $this->id, array( $this, 'process_admin_options' ) );
		add_action( 'woocommerce_update_options_payment_gateways_' . $this->id, array( $this, 'clear_crypto_cache' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'admin_scripts' ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'frontend_scripts' ) );

		// AJAX handlers for admin.
		add_action( 'wp_ajax_mycryptocoin_test_connection', array( $this, 'ajax_test_connection' ) );
	}

	/**
	 * Initialize gateway settings form fields.
	 */
	public function init_form_fields() {
		$this->form_fields = array(
			'enabled'           => array(
				'title'   => __( 'Enable/Disable', 'mycryptocoin-gateway' ),
				'type'    => 'checkbox',
				'label'   => __( 'Enable MyCryptoCoin Gateway', 'mycryptocoin-gateway' ),
				'default' => 'no',
			),
			'title'             => array(
				'title'       => __( 'Title', 'mycryptocoin-gateway' ),
				'type'        => 'text',
				'description' => __( 'Payment method title that the customer sees during checkout.', 'mycryptocoin-gateway' ),
				'default'     => __( 'Pay with Crypto', 'mycryptocoin-gateway' ),
				'desc_tip'    => true,
			),
			'description'       => array(
				'title'       => __( 'Description', 'mycryptocoin-gateway' ),
				'type'        => 'textarea',
				'description' => __( 'Payment method description displayed during checkout.', 'mycryptocoin-gateway' ),
				'default'     => __( 'Pay securely with Bitcoin, Ethereum, or other cryptocurrencies. Powered by MyCryptoCoin.', 'mycryptocoin-gateway' ),
				'desc_tip'    => true,
			),
			'test_mode'         => array(
				'title'       => __( 'Test Mode', 'mycryptocoin-gateway' ),
				'type'        => 'checkbox',
				'label'       => __( 'Enable test mode', 'mycryptocoin-gateway' ),
				'description' => __( 'Use test API keys to simulate transactions. No real crypto is processed.', 'mycryptocoin-gateway' ),
				'default'     => 'yes',
				'desc_tip'    => true,
			),
			'live_api_key'      => array(
				'title'       => __( 'Live API Key', 'mycryptocoin-gateway' ),
				'type'        => 'password',
				'description' => __( 'Get your live API key from your MyCryptoCoin dashboard at mycrypto.co.in/dashboard/api-keys', 'mycryptocoin-gateway' ),
				'default'     => '',
				'desc_tip'    => true,
			),
			'test_api_key'      => array(
				'title'       => __( 'Test API Key', 'mycryptocoin-gateway' ),
				'type'        => 'password',
				'description' => __( 'Get your test API key from your MyCryptoCoin dashboard.', 'mycryptocoin-gateway' ),
				'default'     => '',
				'desc_tip'    => true,
			),
			'webhook_secret'    => array(
				'title'       => __( 'Webhook Secret', 'mycryptocoin-gateway' ),
				'type'        => 'password',
				'description' => sprintf(
					/* translators: %s: Webhook URL */
					__( 'Webhook signing secret from your MyCryptoCoin dashboard. Set your webhook URL to: %s', 'mycryptocoin-gateway' ),
					'<code>' . esc_url( rest_url( 'mycryptocoin/v1/webhook' ) ) . '</code>'
				),
				'default'     => '',
			),
			'supported_cryptos' => array(
				'title'       => __( 'Supported Cryptocurrencies', 'mycryptocoin-gateway' ),
				'type'        => 'multiselect',
				'description' => __( 'Select which cryptocurrencies to accept. Customers will choose from these during checkout.', 'mycryptocoin-gateway' ),
				'default'     => array( 'btc', 'eth', 'usdt' ),
				'desc_tip'    => true,
				'options'     => self::$all_cryptos,
				'class'       => 'wc-enhanced-select',
				'css'         => 'min-width: 350px;',
			),
			'order_status'      => array(
				'title'       => __( 'Order Status After Payment', 'mycryptocoin-gateway' ),
				'type'        => 'select',
				'description' => __( 'Order status to set when crypto payment is confirmed.', 'mycryptocoin-gateway' ),
				'default'     => 'processing',
				'desc_tip'    => true,
				'options'     => array(
					'processing' => __( 'Processing', 'mycryptocoin-gateway' ),
					'completed'  => __( 'Completed', 'mycryptocoin-gateway' ),
					'on-hold'    => __( 'On Hold', 'mycryptocoin-gateway' ),
				),
			),
			'debug'             => array(
				'title'       => __( 'Debug Logging', 'mycryptocoin-gateway' ),
				'type'        => 'checkbox',
				'label'       => __( 'Enable debug logging', 'mycryptocoin-gateway' ),
				'description' => sprintf(
					/* translators: %s: Log file URL */
					__( 'Log API requests and webhook events. View logs at %s.', 'mycryptocoin-gateway' ),
					'<a href="' . esc_url( admin_url( 'admin.php?page=wc-status&tab=logs' ) ) . '">' . esc_html__( 'WooCommerce > Status > Logs', 'mycryptocoin-gateway' ) . '</a>'
				),
				'default'     => 'no',
			),
		);
	}

	/**
	 * Custom admin options output with branding.
	 */
	public function admin_options() {
		?>
		<div class="mycryptocoin-admin-header">
			<div class="mycryptocoin-admin-header__logo">
				<h2><?php esc_html_e( 'MyCryptoCoin Gateway', 'mycryptocoin-gateway' ); ?></h2>
				<span class="mycryptocoin-admin-header__version">v<?php echo esc_html( MYCRYPTOCOIN_GATEWAY_VERSION ); ?></span>
			</div>
			<div class="mycryptocoin-admin-header__links">
				<a href="https://mycrypto.co.in/dashboard" target="_blank" class="button">
					<?php esc_html_e( 'Dashboard', 'mycryptocoin-gateway' ); ?>
				</a>
				<a href="https://mycrypto.co.in/docs" target="_blank" class="button">
					<?php esc_html_e( 'Documentation', 'mycryptocoin-gateway' ); ?>
				</a>
			</div>
		</div>

		<?php if ( $this->test_mode ) : ?>
			<div class="mycryptocoin-admin-notice mycryptocoin-admin-notice--test">
				<p>
					<strong><?php esc_html_e( 'Test Mode is Active', 'mycryptocoin-gateway' ); ?></strong> &mdash;
					<?php esc_html_e( 'No real transactions will be processed. Use test API keys from your MyCryptoCoin dashboard.', 'mycryptocoin-gateway' ); ?>
				</p>
			</div>
		<?php endif; ?>

		<div class="mycryptocoin-admin-info">
			<div class="mycryptocoin-admin-info__item">
				<h4><?php esc_html_e( 'Webhook URL', 'mycryptocoin-gateway' ); ?></h4>
				<code id="mycryptocoin-webhook-url"><?php echo esc_url( rest_url( 'mycryptocoin/v1/webhook' ) ); ?></code>
				<button type="button" class="button button-small mycryptocoin-copy-btn" data-copy-target="#mycryptocoin-webhook-url">
					<?php esc_html_e( 'Copy', 'mycryptocoin-gateway' ); ?>
				</button>
			</div>
			<div class="mycryptocoin-admin-info__item">
				<button type="button" class="button button-secondary" id="mycryptocoin-test-connection">
					<?php esc_html_e( 'Test Connection', 'mycryptocoin-gateway' ); ?>
				</button>
				<span id="mycryptocoin-connection-status"></span>
			</div>
		</div>

		<table class="form-table">
			<?php $this->generate_settings_html(); ?>
		</table>
		<?php
	}

	/**
	 * Payment fields displayed during checkout.
	 */
	public function payment_fields() {
		if ( $this->description ) {
			$description = $this->description;
			if ( $this->test_mode ) {
				$description .= ' ' . __( '(TEST MODE — no real crypto will be charged)', 'mycryptocoin-gateway' );
			}
			echo '<p>' . wp_kses_post( $description ) . '</p>';
		}

		$cryptos = is_array( $this->supported_cryptos ) ? $this->supported_cryptos : array( 'btc', 'eth', 'usdt' );

		if ( empty( $cryptos ) ) {
			echo '<p class="mycryptocoin-error">' . esc_html__( 'No cryptocurrencies are currently available for payment.', 'mycryptocoin-gateway' ) . '</p>';
			return;
		}

		$crypto_labels = self::$all_cryptos;
		$crypto_icons  = array(
			'btc'   => 'bitcoin',
			'eth'   => 'ethereum',
			'usdt'  => 'tether',
			'usdc'  => 'usd-coin',
			'bnb'   => 'bnb',
			'sol'   => 'solana',
			'xrp'   => 'xrp',
			'ada'   => 'cardano',
			'doge'  => 'dogecoin',
			'matic' => 'polygon',
			'ltc'   => 'litecoin',
			'trx'   => 'tron',
			'avax'  => 'avalanche',
		);
		?>
		<div class="mycryptocoin-payment-fields">
			<p class="mycryptocoin-select-label">
				<?php esc_html_e( 'Select your preferred cryptocurrency:', 'mycryptocoin-gateway' ); ?>
			</p>
			<div class="mycryptocoin-crypto-options">
				<?php foreach ( $cryptos as $index => $crypto ) : ?>
					<?php
					$label = isset( $crypto_labels[ $crypto ] ) ? $crypto_labels[ $crypto ] : strtoupper( $crypto );
					$icon  = isset( $crypto_icons[ $crypto ] ) ? $crypto_icons[ $crypto ] : $crypto;
					?>
					<label class="mycryptocoin-crypto-option" for="mycryptocoin_crypto_<?php echo esc_attr( $crypto ); ?>">
						<input
							type="radio"
							id="mycryptocoin_crypto_<?php echo esc_attr( $crypto ); ?>"
							name="mycryptocoin_crypto"
							value="<?php echo esc_attr( $crypto ); ?>"
							<?php checked( 0, $index ); ?>
						/>
						<span class="mycryptocoin-crypto-option__inner">
							<span class="mycryptocoin-crypto-option__icon mycryptocoin-icon-<?php echo esc_attr( $icon ); ?>">
								<?php echo esc_html( strtoupper( $crypto ) ); ?>
							</span>
							<span class="mycryptocoin-crypto-option__name">
								<?php echo esc_html( $label ); ?>
							</span>
						</span>
					</label>
				<?php endforeach; ?>
			</div>
			<?php wp_nonce_field( 'mycryptocoin_process_payment', 'mycryptocoin_nonce' ); ?>
		</div>
		<?php
	}

	/**
	 * Validate payment fields on checkout.
	 *
	 * @return bool
	 */
	public function validate_fields() {
		if ( empty( $_POST['mycryptocoin_nonce'] ) || ! wp_verify_nonce(
			sanitize_text_field( wp_unslash( $_POST['mycryptocoin_nonce'] ) ),
			'mycryptocoin_process_payment'
		) ) {
			wc_add_notice( __( 'Security verification failed. Please try again.', 'mycryptocoin-gateway' ), 'error' );
			return false;
		}

		if ( empty( $_POST['mycryptocoin_crypto'] ) ) {
			wc_add_notice( __( 'Please select a cryptocurrency for payment.', 'mycryptocoin-gateway' ), 'error' );
			return false;
		}

		$selected_crypto = sanitize_text_field( wp_unslash( $_POST['mycryptocoin_crypto'] ) );
		$allowed         = is_array( $this->supported_cryptos ) ? $this->supported_cryptos : array();

		if ( ! in_array( $selected_crypto, $allowed, true ) ) {
			wc_add_notice( __( 'The selected cryptocurrency is not supported.', 'mycryptocoin-gateway' ), 'error' );
			return false;
		}

		return true;
	}

	/**
	 * Process the payment.
	 *
	 * @param int $order_id WooCommerce order ID.
	 * @return array Redirect result.
	 */
	public function process_payment( $order_id ) {
		$order = wc_get_order( $order_id );

		if ( ! $order ) {
			MyCryptoCoin_Logger::error( 'Order not found: ' . $order_id );
			wc_add_notice( __( 'Order not found. Please try again.', 'mycryptocoin-gateway' ), 'error' );
			return array( 'result' => 'fail' );
		}

		$selected_crypto = isset( $_POST['mycryptocoin_crypto'] )
			? sanitize_text_field( wp_unslash( $_POST['mycryptocoin_crypto'] ) )
			: 'btc';

		$api = $this->get_api();

		$callback_url = rest_url( 'mycryptocoin/v1/webhook' );
		$return_url   = $this->get_return_url( $order );
		$cancel_url   = wc_get_checkout_url();

		$metadata = array(
			'crypto'          => $selected_crypto,
			'customer_email'  => $order->get_billing_email(),
			'return_url'      => $return_url,
			'order_id'        => (string) $order_id,
			'order_key'       => $order->get_order_key(),
			'cancel_url'      => $cancel_url,
			'store_name'      => get_bloginfo( 'name' ),
			'wc_version'      => WC_VERSION,
			'plugin_version'  => MYCRYPTOCOIN_GATEWAY_VERSION,
		);

		$response = $api->create_payment(
			$order->get_total(),
			$order->get_currency(),
			(string) $order_id,
			$callback_url,
			$metadata
		);

		if ( is_wp_error( $response ) ) {
			MyCryptoCoin_Logger::error(
				sprintf( 'Payment creation failed for order %d: %s', $order_id, $response->get_error_message() )
			);
			wc_add_notice(
				__( 'Unable to process crypto payment. Please try again or choose a different payment method.', 'mycryptocoin-gateway' ),
				'error'
			);
			return array( 'result' => 'fail' );
		}

		if ( empty( $response['payment_id'] ) || empty( $response['session_id'] ) ) {
			MyCryptoCoin_Logger::error(
				'Invalid API response: missing payment_id or session_id.',
				$response
			);
			wc_add_notice(
				__( 'Payment service returned an invalid response. Please try again.', 'mycryptocoin-gateway' ),
				'error'
			);
			return array( 'result' => 'fail' );
		}

		// Store payment data on the order.
		$order->update_meta_data( '_mycryptocoin_payment_id', sanitize_text_field( $response['payment_id'] ) );
		$order->update_meta_data( '_mycryptocoin_session_id', sanitize_text_field( $response['session_id'] ) );
		$order->update_meta_data( '_mycryptocoin_crypto', $selected_crypto );
		$order->update_meta_data( '_mycryptocoin_test_mode', $this->test_mode ? 'yes' : 'no' );

		if ( isset( $response['payment_address'] ) ) {
			$order->update_meta_data( '_mycryptocoin_payment_address', sanitize_text_field( $response['payment_address'] ) );
		}

		if ( isset( $response['crypto_amount'] ) ) {
			$order->update_meta_data( '_mycryptocoin_crypto_amount', sanitize_text_field( $response['crypto_amount'] ) );
		}

		$order->set_status( 'pending', __( 'Awaiting MyCryptoCoin crypto payment.', 'mycryptocoin-gateway' ) );
		$order->save();

		// Reduce stock.
		wc_reduce_stock_levels( $order_id );

		// Empty the cart.
		WC()->cart->empty_cart();

		MyCryptoCoin_Logger::info(
			sprintf(
				'Payment session created for order %d: payment_id=%s, session_id=%s, crypto=%s',
				$order_id,
				$response['payment_id'],
				$response['session_id'],
				$selected_crypto
			)
		);

		// Redirect to MyCryptoCoin hosted payment page.
		$payment_url = MYCRYPTOCOIN_GATEWAY_PAY_BASE . '/' . $response['session_id'];

		return array(
			'result'   => 'success',
			'redirect' => $payment_url,
		);
	}

	/**
	 * Process a refund.
	 *
	 * @param int        $order_id Order ID.
	 * @param float|null $amount   Refund amount.
	 * @param string     $reason   Refund reason.
	 * @return bool|WP_Error
	 */
	public function process_refund( $order_id, $amount = null, $reason = '' ) {
		$order = wc_get_order( $order_id );

		if ( ! $order ) {
			return new WP_Error( 'mycryptocoin_refund_error', __( 'Order not found.', 'mycryptocoin-gateway' ) );
		}

		$payment_id = $order->get_meta( '_mycryptocoin_payment_id' );

		if ( empty( $payment_id ) ) {
			return new WP_Error(
				'mycryptocoin_refund_error',
				__( 'No MyCryptoCoin payment ID found for this order. Cannot process refund.', 'mycryptocoin-gateway' )
			);
		}

		$api      = $this->get_api();
		$response = $api->initiate_refund( $payment_id, $amount );

		if ( is_wp_error( $response ) ) {
			MyCryptoCoin_Logger::error(
				sprintf( 'Refund failed for order %d: %s', $order_id, $response->get_error_message() )
			);
			return $response;
		}

		if ( isset( $response['refund_id'] ) ) {
			$order->update_meta_data( '_mycryptocoin_refund_id', sanitize_text_field( $response['refund_id'] ) );
			$order->save();
		}

		$note = sprintf(
			/* translators: 1: Refund amount, 2: Refund reason */
			__( 'MyCryptoCoin refund initiated. Amount: %1$s. Reason: %2$s', 'mycryptocoin-gateway' ),
			wc_price( $amount, array( 'currency' => $order->get_currency() ) ),
			$reason ? $reason : __( 'N/A', 'mycryptocoin-gateway' )
		);
		$order->add_order_note( $note );

		MyCryptoCoin_Logger::info( sprintf( 'Refund initiated for order %d, amount: %s', $order_id, $amount ) );

		return true;
	}

	/**
	 * Check if the gateway is available.
	 *
	 * @return bool
	 */
	public function is_available() {
		if ( 'yes' !== $this->enabled ) {
			return false;
		}

		// Check API key is set.
		$api_key = $this->test_mode ? $this->test_api_key : $this->live_api_key;
		if ( empty( $api_key ) ) {
			return false;
		}

		// Check at least one crypto is enabled.
		if ( empty( $this->supported_cryptos ) || ! is_array( $this->supported_cryptos ) ) {
			return false;
		}

		// Check currency is supported (crypto gateways generally accept most fiat currencies).
		$supported_currencies = array(
			'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY',
			'INR', 'BRL', 'KRW', 'RUB', 'TRY', 'ZAR', 'MXN', 'SGD',
			'HKD', 'NOK', 'SEK', 'DKK', 'NZD', 'PLN', 'THB', 'TWD',
			'CZK', 'HUF', 'ILS', 'AED', 'SAR', 'PHP', 'MYR', 'IDR',
		);

		if ( ! in_array( get_woocommerce_currency(), $supported_currencies, true ) ) {
			return false;
		}

		return parent::is_available();
	}

	/**
	 * Get the API instance.
	 *
	 * @return MyCryptoCoin_API
	 */
	private function get_api() {
		if ( null === $this->api ) {
			$api_key   = $this->test_mode ? $this->test_api_key : $this->live_api_key;
			$this->api = new MyCryptoCoin_API( $api_key, $this->test_mode );
		}
		return $this->api;
	}

	/**
	 * Enqueue admin scripts and styles.
	 *
	 * @param string $hook Current admin page hook.
	 */
	public function admin_scripts( $hook ) {
		if ( 'woocommerce_page_wc-settings' !== $hook ) {
			return;
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$section = isset( $_GET['section'] ) ? sanitize_text_field( wp_unslash( $_GET['section'] ) ) : '';
		if ( 'mycryptocoin' !== $section ) {
			return;
		}

		wp_enqueue_style(
			'mycryptocoin-admin',
			MYCRYPTOCOIN_GATEWAY_PLUGIN_URL . 'assets/css/mycryptocoin-admin.css',
			array(),
			MYCRYPTOCOIN_GATEWAY_VERSION
		);

		wp_enqueue_script(
			'mycryptocoin-admin',
			MYCRYPTOCOIN_GATEWAY_PLUGIN_URL . 'assets/js/mycryptocoin-admin.js',
			array( 'jquery' ),
			MYCRYPTOCOIN_GATEWAY_VERSION,
			true
		);

		wp_localize_script(
			'mycryptocoin-admin',
			'mycryptocoinAdmin',
			array(
				'ajaxUrl'           => admin_url( 'admin-ajax.php' ),
				'nonce'             => wp_create_nonce( 'mycryptocoin_admin_nonce' ),
				'testingText'       => __( 'Testing connection...', 'mycryptocoin-gateway' ),
				'successText'       => __( 'Connection successful!', 'mycryptocoin-gateway' ),
				'failText'          => __( 'Connection failed. Please check your API key.', 'mycryptocoin-gateway' ),
				'errorText'         => __( 'An error occurred. Please try again.', 'mycryptocoin-gateway' ),
				'copiedText'        => __( 'Copied!', 'mycryptocoin-gateway' ),
				'noKeyText'         => __( 'Please enter an API key first.', 'mycryptocoin-gateway' ),
			)
		);
	}

	/**
	 * Enqueue frontend scripts and styles.
	 */
	public function frontend_scripts() {
		if ( ! is_checkout() && ! is_checkout_pay_page() ) {
			return;
		}

		if ( 'yes' !== $this->enabled ) {
			return;
		}

		wp_enqueue_style(
			'mycryptocoin-checkout',
			MYCRYPTOCOIN_GATEWAY_PLUGIN_URL . 'assets/css/mycryptocoin-checkout.css',
			array(),
			MYCRYPTOCOIN_GATEWAY_VERSION
		);

		wp_enqueue_script(
			'mycryptocoin-checkout',
			MYCRYPTOCOIN_GATEWAY_PLUGIN_URL . 'assets/js/mycryptocoin-checkout.js',
			array( 'jquery' ),
			MYCRYPTOCOIN_GATEWAY_VERSION,
			true
		);

		wp_localize_script(
			'mycryptocoin-checkout',
			'mycryptocoinCheckout',
			array(
				'ajaxUrl'    => admin_url( 'admin-ajax.php' ),
				'restUrl'    => rest_url( 'mycryptocoin/v1/' ),
				'nonce'      => wp_create_nonce( 'wp_rest' ),
				'gatewayId'  => $this->id,
				'testMode'   => $this->test_mode,
				'i18n'       => array(
					'statusPending'    => __( 'Waiting for payment...', 'mycryptocoin-gateway' ),
					'statusConfirming' => __( 'Payment detected, confirming...', 'mycryptocoin-gateway' ),
					'statusConfirmed'  => __( 'Payment confirmed!', 'mycryptocoin-gateway' ),
					'statusFailed'     => __( 'Payment failed', 'mycryptocoin-gateway' ),
					'statusExpired'    => __( 'Payment expired', 'mycryptocoin-gateway' ),
					'timeRemaining'    => __( 'Time remaining:', 'mycryptocoin-gateway' ),
					'timerExpired'     => __( 'Payment window expired', 'mycryptocoin-gateway' ),
					'copied'           => __( 'Copied!', 'mycryptocoin-gateway' ),
					'qrFallback'       => __( 'QR code library not loaded. Please copy the address below.', 'mycryptocoin-gateway' ),
				),
			)
		);
	}

	/**
	 * AJAX handler: Test API connection.
	 */
	public function ajax_test_connection() {
		check_ajax_referer( 'mycryptocoin_admin_nonce', 'nonce' );

		if ( ! current_user_can( 'manage_woocommerce' ) ) {
			wp_send_json_error( array( 'message' => __( 'Permission denied.', 'mycryptocoin-gateway' ) ) );
		}

		$api_key = isset( $_POST['api_key'] ) ? sanitize_text_field( wp_unslash( $_POST['api_key'] ) ) : '';
		$is_test = isset( $_POST['test_mode'] ) && 'yes' === sanitize_text_field( wp_unslash( $_POST['test_mode'] ) );

		if ( empty( $api_key ) ) {
			wp_send_json_error( array( 'message' => __( 'API key is required.', 'mycryptocoin-gateway' ) ) );
		}

		$api      = new MyCryptoCoin_API( $api_key, $is_test );
		$response = $api->test_connection();

		if ( is_wp_error( $response ) ) {
			wp_send_json_error( array( 'message' => $response->get_error_message() ) );
		}

		wp_send_json_success( array( 'message' => __( 'Connection successful!', 'mycryptocoin-gateway' ) ) );
	}

	/**
	 * Clear cached supported cryptos when settings are saved.
	 */
	public function clear_crypto_cache() {
		delete_transient( 'mycryptocoin_supported_cryptos' );
		MyCryptoCoin_Logger::reset_debug_cache();
	}

	/**
	 * Get all available cryptos.
	 *
	 * @return array
	 */
	public static function get_all_cryptos() {
		return self::$all_cryptos;
	}
}
