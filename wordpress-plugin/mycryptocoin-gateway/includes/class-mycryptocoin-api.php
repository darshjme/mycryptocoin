<?php
/**
 * MyCryptoCoin API wrapper.
 *
 * @package MyCryptoCoin_Gateway
 */

defined( 'ABSPATH' ) || exit;

/**
 * Handles all communication with the MyCryptoCoin API.
 */
class MyCryptoCoin_API {

	/**
	 * API key.
	 *
	 * @var string
	 */
	private $api_key;

	/**
	 * Whether test mode is active.
	 *
	 * @var bool
	 */
	private $test_mode;

	/**
	 * API base URL.
	 *
	 * @var string
	 */
	private $api_base;

	/**
	 * Request timeout in seconds.
	 *
	 * @var int
	 */
	private $timeout = 30;

	/**
	 * Constructor.
	 *
	 * @param string $api_key   API key.
	 * @param bool   $test_mode Whether to use test mode.
	 */
	public function __construct( $api_key, $test_mode = false ) {
		$this->api_key   = $api_key;
		$this->test_mode = $test_mode;
		$this->api_base  = MYCRYPTOCOIN_GATEWAY_API_BASE;
	}

	/**
	 * Create a payment session.
	 *
	 * Backend expects camelCase fields: crypto (required), amount (string),
	 * currency, orderId, callbackUrl, redirectUrl, customerEmail, metadata.
	 *
	 * @param float  $amount       Payment amount.
	 * @param string $currency     Fiat currency code (e.g. USD, EUR).
	 * @param string $order_id     WooCommerce order ID.
	 * @param string $callback_url Webhook callback URL.
	 * @param array  $metadata     Additional metadata (must include 'crypto').
	 * @return array|WP_Error Response data or error.
	 */
	public function create_payment( $amount, $currency, $order_id, $callback_url, $metadata = array() ) {
		$body = array(
			'amount'       => number_format( (float) $amount, 8, '.', '' ),
			'currency'     => strtoupper( $currency ),
			'orderId'      => (string) $order_id,
			'callbackUrl'  => $callback_url,
		);

		// crypto is required at top level by the backend schema.
		if ( isset( $metadata['crypto'] ) ) {
			$body['crypto'] = $metadata['crypto'];
			unset( $metadata['crypto'] );
		}

		// Pass optional fields the backend accepts.
		if ( isset( $metadata['customer_email'] ) ) {
			$body['customerEmail'] = $metadata['customer_email'];
			unset( $metadata['customer_email'] );
		}
		if ( isset( $metadata['return_url'] ) ) {
			$body['redirectUrl'] = $metadata['return_url'];
			unset( $metadata['return_url'] );
		}

		if ( ! empty( $metadata ) ) {
			$body['metadata'] = $metadata;
		}

		MyCryptoCoin_Logger::log_api_request( 'POST', '/payments/create', $body );

		return $this->request( 'POST', '/payments/create', $body );
	}

	/**
	 * Get payment details.
	 *
	 * @param string $payment_id MyCryptoCoin payment ID.
	 * @return array|WP_Error Response data or error.
	 */
	public function get_payment( $payment_id ) {
		$payment_id = sanitize_text_field( $payment_id );

		MyCryptoCoin_Logger::log_api_request( 'GET', '/payments/' . $payment_id );

		return $this->request( 'GET', '/payments/' . $payment_id );
	}

	/**
	 * Verify a webhook signature using HMAC-SHA256.
	 *
	 * @param string $payload   Raw request body.
	 * @param string $signature Signature from X-MCC-Signature header.
	 * @param string $secret    Webhook signing secret.
	 * @return bool Whether the signature is valid.
	 */
	public function verify_webhook( $payload, $signature, $secret ) {
		if ( empty( $payload ) || empty( $signature ) || empty( $secret ) ) {
			MyCryptoCoin_Logger::warning( 'Webhook verification failed: missing payload, signature, or secret.' );
			return false;
		}

		$expected = hash_hmac( 'sha256', $payload, $secret );

		if ( ! hash_equals( $expected, $signature ) ) {
			MyCryptoCoin_Logger::warning( 'Webhook verification failed: signature mismatch.' );
			return false;
		}

		MyCryptoCoin_Logger::debug( 'Webhook signature verified successfully.' );
		return true;
	}

	/**
	 * Get list of supported cryptocurrencies.
	 *
	 * @return array|WP_Error Response data or error.
	 */
	public function get_supported_cryptos() {
		MyCryptoCoin_Logger::log_api_request( 'GET', '/cryptos' );

		$cached = get_transient( 'mycryptocoin_supported_cryptos' );
		if ( false !== $cached ) {
			return $cached;
		}

		$response = $this->request( 'GET', '/cryptos' );

		if ( ! is_wp_error( $response ) && isset( $response['cryptos'] ) ) {
			set_transient( 'mycryptocoin_supported_cryptos', $response, HOUR_IN_SECONDS );
		}

		return $response;
	}

	/**
	 * Initiate a refund.
	 *
	 * @param string     $payment_id MyCryptoCoin payment ID.
	 * @param float|null $amount     Refund amount (null for full refund).
	 * @return array|WP_Error Response data or error.
	 */
	public function initiate_refund( $payment_id, $amount = null ) {
		$payment_id = sanitize_text_field( $payment_id );

		$body = array();
		if ( null !== $amount ) {
			$body['amount'] = (float) $amount;
		}

		MyCryptoCoin_Logger::log_api_request( 'POST', '/payments/' . $payment_id . '/refund', $body );

		return $this->request( 'POST', '/payments/' . $payment_id . '/refund', $body );
	}

	/**
	 * Test the API connection with the given key.
	 *
	 * @return array|WP_Error Response data or error.
	 */
	public function test_connection() {
		MyCryptoCoin_Logger::log_api_request( 'GET', '/ping' );

		return $this->request( 'GET', '/ping' );
	}

	/**
	 * Make an HTTP request to the MyCryptoCoin API.
	 *
	 * @param string $method   HTTP method (GET, POST, etc.).
	 * @param string $endpoint API endpoint (starting with /).
	 * @param array  $body     Request body for POST/PUT requests.
	 * @return array|WP_Error Decoded response body or WP_Error.
	 */
	private function request( $method, $endpoint, $body = array() ) {
		$url = $this->api_base . $endpoint;

		$args = array(
			'method'  => $method,
			'headers' => array(
				'Authorization' => 'Bearer ' . $this->api_key,
				'Content-Type'  => 'application/json',
				'Accept'        => 'application/json',
				'User-Agent'    => 'MyCryptoCoin-WooCommerce/' . MYCRYPTOCOIN_GATEWAY_VERSION,
				'X-Test-Mode'   => $this->test_mode ? 'true' : 'false',
			),
			'timeout' => $this->timeout,
		);

		if ( ! empty( $body ) && in_array( $method, array( 'POST', 'PUT', 'PATCH' ), true ) ) {
			$args['body'] = wp_json_encode( $body );
		}

		$response = wp_remote_request( $url, $args );

		// Handle connection errors.
		if ( is_wp_error( $response ) ) {
			MyCryptoCoin_Logger::error(
				sprintf( 'API connection error: %s', $response->get_error_message() ),
				array( 'endpoint' => $endpoint )
			);
			return $response;
		}

		$status_code = wp_remote_retrieve_response_code( $response );
		$raw_body    = wp_remote_retrieve_body( $response );
		$decoded     = json_decode( $raw_body, true );

		MyCryptoCoin_Logger::log_api_response( $endpoint, $status_code, $decoded ?? array() );

		// Handle HTTP errors.
		if ( $status_code < 200 || $status_code >= 300 ) {
			$error_message = isset( $decoded['message'] )
				? $decoded['message']
				: sprintf(
					/* translators: %d: HTTP status code */
					__( 'API request failed with status code %d.', 'mycryptocoin-gateway' ),
					$status_code
				);

			$error_code = isset( $decoded['error_code'] ) ? $decoded['error_code'] : 'api_error';

			MyCryptoCoin_Logger::error(
				sprintf( 'API error [%d]: %s', $status_code, $error_message ),
				array(
					'endpoint' => $endpoint,
					'response' => $decoded,
				)
			);

			return new WP_Error(
				'mycryptocoin_' . $error_code,
				$error_message,
				array( 'status' => $status_code )
			);
		}

		if ( null === $decoded ) {
			MyCryptoCoin_Logger::error(
				'API returned invalid JSON.',
				array(
					'endpoint' => $endpoint,
					'body'     => substr( $raw_body, 0, 500 ),
				)
			);
			return new WP_Error(
				'mycryptocoin_invalid_response',
				__( 'Invalid response from MyCryptoCoin API.', 'mycryptocoin-gateway' )
			);
		}

		return $decoded;
	}
}
