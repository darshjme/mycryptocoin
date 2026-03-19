<?php
/**
 * Logger wrapper for MyCryptoCoin Gateway.
 *
 * @package MyCryptoCoin_Gateway
 */

defined( 'ABSPATH' ) || exit;

/**
 * MyCryptoCoin Logger class.
 *
 * Wraps WC_Logger with a consistent source identifier and debug mode toggle.
 */
class MyCryptoCoin_Logger {

	/**
	 * WC_Logger instance.
	 *
	 * @var WC_Logger|null
	 */
	private static $logger = null;

	/**
	 * Log source identifier.
	 *
	 * @var string
	 */
	const SOURCE = 'mycryptocoin-gateway';

	/**
	 * Whether debug mode is enabled.
	 *
	 * @var bool|null
	 */
	private static $debug_enabled = null;

	/**
	 * Get the WC_Logger instance.
	 *
	 * @return WC_Logger
	 */
	private static function get_logger() {
		if ( null === self::$logger ) {
			self::$logger = wc_get_logger();
		}
		return self::$logger;
	}

	/**
	 * Check if debug mode is enabled.
	 *
	 * @return bool
	 */
	public static function is_debug_enabled() {
		if ( null === self::$debug_enabled ) {
			$settings            = get_option( 'woocommerce_mycryptocoin_settings', array() );
			self::$debug_enabled = isset( $settings['debug'] ) && 'yes' === $settings['debug'];
		}
		return self::$debug_enabled;
	}

	/**
	 * Reset debug cache (used when settings change).
	 */
	public static function reset_debug_cache() {
		self::$debug_enabled = null;
	}

	/**
	 * Log a debug message.
	 *
	 * @param string $message Log message.
	 * @param array  $context Optional context data.
	 */
	public static function debug( $message, $context = array() ) {
		if ( ! self::is_debug_enabled() ) {
			return;
		}
		self::log( 'debug', $message, $context );
	}

	/**
	 * Log an info message.
	 *
	 * @param string $message Log message.
	 * @param array  $context Optional context data.
	 */
	public static function info( $message, $context = array() ) {
		self::log( 'info', $message, $context );
	}

	/**
	 * Log a warning message.
	 *
	 * @param string $message Log message.
	 * @param array  $context Optional context data.
	 */
	public static function warning( $message, $context = array() ) {
		self::log( 'warning', $message, $context );
	}

	/**
	 * Log an error message.
	 *
	 * @param string $message Log message.
	 * @param array  $context Optional context data.
	 */
	public static function error( $message, $context = array() ) {
		self::log( 'error', $message, $context );
	}

	/**
	 * Log a critical message.
	 *
	 * @param string $message Log message.
	 * @param array  $context Optional context data.
	 */
	public static function critical( $message, $context = array() ) {
		self::log( 'critical', $message, $context );
	}

	/**
	 * Write a log entry.
	 *
	 * @param string $level   Log level.
	 * @param string $message Log message.
	 * @param array  $context Optional context data.
	 */
	private static function log( $level, $message, $context = array() ) {
		if ( ! function_exists( 'wc_get_logger' ) ) {
			return;
		}

		$logger = self::get_logger();

		if ( ! empty( $context ) ) {
			$message .= ' | Context: ' . wp_json_encode( $context );
		}

		$logger->log(
			$level,
			$message,
			array( 'source' => self::SOURCE )
		);
	}

	/**
	 * Log an API request.
	 *
	 * @param string $method   HTTP method.
	 * @param string $endpoint API endpoint.
	 * @param array  $body     Request body.
	 */
	public static function log_api_request( $method, $endpoint, $body = array() ) {
		if ( ! self::is_debug_enabled() ) {
			return;
		}

		$sanitized_body = $body;
		// Mask sensitive fields.
		if ( isset( $sanitized_body['api_key'] ) ) {
			$sanitized_body['api_key'] = '***' . substr( $sanitized_body['api_key'], -4 );
		}

		self::debug(
			sprintf( 'API Request: %s %s', $method, $endpoint ),
			$sanitized_body
		);
	}

	/**
	 * Log an API response.
	 *
	 * @param string $endpoint    API endpoint.
	 * @param int    $status_code HTTP status code.
	 * @param array  $response    Response data.
	 */
	public static function log_api_response( $endpoint, $status_code, $response = array() ) {
		if ( ! self::is_debug_enabled() ) {
			return;
		}

		self::debug(
			sprintf( 'API Response: %s [%d]', $endpoint, $status_code ),
			$response
		);
	}

	/**
	 * Log a webhook event.
	 *
	 * @param string $event   Event type.
	 * @param array  $payload Webhook payload.
	 */
	public static function log_webhook( $event, $payload = array() ) {
		self::info(
			sprintf( 'Webhook received: %s', $event ),
			$payload
		);
	}
}
