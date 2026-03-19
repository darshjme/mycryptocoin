<?php
/**
 * Webhook handler for MyCryptoCoin Gateway.
 *
 * @package MyCryptoCoin_Gateway
 */

defined( 'ABSPATH' ) || exit;

/**
 * Handles incoming webhooks from MyCryptoCoin.
 */
class MyCryptoCoin_Webhook_Handler {

	/**
	 * Constructor — register REST API route.
	 */
	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register webhook and payment status REST endpoints.
	 */
	public function register_routes() {
		register_rest_route(
			'mycryptocoin/v1',
			'/webhook',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'handle_webhook' ),
				'permission_callback' => array( $this, 'verify_request' ),
			)
		);

		register_rest_route(
			'mycryptocoin/v1',
			'/payment-status/(?P<session_id>[a-zA-Z0-9_-]+)',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_payment_status' ),
				'permission_callback' => '__return_true',
				'args'                => array(
					'session_id' => array(
						'required'          => true,
						'sanitize_callback' => 'sanitize_text_field',
						'validate_callback' => function ( $param ) {
							return ! empty( $param );
						},
					),
				),
			)
		);
	}

	/**
	 * Get payment status by session ID (used for frontend polling).
	 *
	 * @param WP_REST_Request $request Incoming request.
	 * @return WP_REST_Response
	 */
	public function get_payment_status( $request ) {
		$session_id = $request->get_param( 'session_id' );

		$order = $this->find_order_by_session_id( $session_id );

		if ( ! $order ) {
			return new WP_REST_Response(
				array( 'status' => 'pending' ),
				200
			);
		}

		$status_map = array(
			'pending'    => 'pending',
			'on-hold'    => 'confirming',
			'processing' => 'confirmed',
			'completed'  => 'confirmed',
			'failed'     => 'failed',
			'cancelled'  => 'expired',
		);

		$wc_status = $order->get_status();
		$status    = isset( $status_map[ $wc_status ] ) ? $status_map[ $wc_status ] : 'pending';

		$data = array( 'status' => $status );

		if ( 'confirmed' === $status ) {
			$data['redirect_url'] = $order->get_checkout_order_received_url();
		}

		return new WP_REST_Response( $data, 200 );
	}

	/**
	 * Find an order by session ID.
	 *
	 * @param string $session_id MyCryptoCoin session ID.
	 * @return WC_Order|false
	 */
	private function find_order_by_session_id( $session_id ) {
		global $wpdb;

		if ( class_exists( 'Automattic\WooCommerce\Utilities\OrderUtil' ) &&
			Automattic\WooCommerce\Utilities\OrderUtil::custom_orders_table_usage_is_enabled() ) {
			$order_id = $wpdb->get_var(
				$wpdb->prepare(
					"SELECT order_id FROM {$wpdb->prefix}wc_orders_meta WHERE meta_key = '_mycryptocoin_session_id' AND meta_value = %s LIMIT 1",
					$session_id
				)
			);
		} else {
			$order_id = $wpdb->get_var(
				$wpdb->prepare(
					"SELECT post_id FROM {$wpdb->postmeta} WHERE meta_key = '_mycryptocoin_session_id' AND meta_value = %s LIMIT 1",
					$session_id
				)
			);
		}

		if ( ! $order_id ) {
			return false;
		}

		return wc_get_order( absint( $order_id ) );
	}

	/**
	 * Verify the webhook request signature.
	 *
	 * @param WP_REST_Request $request Incoming request.
	 * @return bool|WP_Error
	 */
	public function verify_request( $request ) {
		// Backend sends X-MCC-Signature header.
		$signature = $request->get_header( 'X-MCC-Signature' );

		if ( empty( $signature ) ) {
			MyCryptoCoin_Logger::warning( 'Webhook request missing signature header.' );
			return new WP_Error(
				'mycryptocoin_webhook_no_signature',
				__( 'Missing signature header.', 'mycryptocoin-gateway' ),
				array( 'status' => 401 )
			);
		}

		$settings = get_option( 'woocommerce_mycryptocoin_settings', array() );
		$secret   = isset( $settings['webhook_secret'] ) ? $settings['webhook_secret'] : '';

		if ( empty( $secret ) ) {
			MyCryptoCoin_Logger::error( 'Webhook secret not configured.' );
			return new WP_Error(
				'mycryptocoin_webhook_no_secret',
				__( 'Webhook secret not configured.', 'mycryptocoin-gateway' ),
				array( 'status' => 500 )
			);
		}

		$raw_body = $request->get_body();
		$api      = new MyCryptoCoin_API( '', false );

		if ( ! $api->verify_webhook( $raw_body, $signature, $secret ) ) {
			MyCryptoCoin_Logger::warning(
				'Webhook signature verification failed.',
				array( 'signature' => substr( $signature, 0, 12 ) . '...' )
			);
			return new WP_Error(
				'mycryptocoin_webhook_invalid_signature',
				__( 'Invalid signature.', 'mycryptocoin-gateway' ),
				array( 'status' => 401 )
			);
		}

		return true;
	}

	/**
	 * Handle the incoming webhook.
	 *
	 * Backend sends: { event, data: {...}, timestamp, webhookId }.
	 * We merge data into the top level for handler convenience.
	 *
	 * @param WP_REST_Request $request Incoming request.
	 * @return WP_REST_Response
	 */
	public function handle_webhook( $request ) {
		$payload = $request->get_json_params();

		if ( empty( $payload ) || empty( $payload['event'] ) ) {
			MyCryptoCoin_Logger::warning( 'Webhook received with empty or invalid payload.' );
			return new WP_REST_Response(
				array(
					'success' => false,
					'message' => 'Invalid payload.',
				),
				400
			);
		}

		$event = sanitize_text_field( $payload['event'] );

		MyCryptoCoin_Logger::log_webhook( $event, $payload );

		// Backend wraps event-specific fields in a 'data' key. Merge into top level
		// so handler methods can access fields directly.
		if ( isset( $payload['data'] ) && is_array( $payload['data'] ) ) {
			$payload = array_merge( $payload, $payload['data'] );
		}

		$result = false;

		switch ( $event ) {
			case 'payment.confirmed':
				$result = $this->handle_payment_confirmed( $payload );
				break;

			case 'payment.failed':
				$result = $this->handle_payment_failed( $payload );
				break;

			case 'payment.expired':
				$result = $this->handle_payment_expired( $payload );
				break;

			case 'refund.completed':
				$result = $this->handle_refund_completed( $payload );
				break;

			default:
				MyCryptoCoin_Logger::info( sprintf( 'Unhandled webhook event: %s', $event ) );
				$result = true; // Acknowledge unknown events gracefully.
				break;
		}

		if ( $result ) {
			return new WP_REST_Response(
				array(
					'success' => true,
					'message' => 'Webhook processed.',
				),
				200
			);
		}

		return new WP_REST_Response(
			array(
				'success' => false,
				'message' => 'Webhook processing failed.',
			),
			500
		);
	}

	/**
	 * Handle payment.confirmed event.
	 *
	 * @param array $payload Webhook payload.
	 * @return bool
	 */
	private function handle_payment_confirmed( $payload ) {
		$order = $this->get_order_from_payload( $payload );
		if ( ! $order ) {
			return false;
		}

		// Don't process if already completed.
		if ( $order->is_paid() ) {
			MyCryptoCoin_Logger::info(
				sprintf( 'Order %d already paid. Skipping payment.confirmed.', $order->get_id() )
			);
			return true;
		}

		$settings     = get_option( 'woocommerce_mycryptocoin_settings', array() );
		$order_status = isset( $settings['order_status'] ) ? $settings['order_status'] : 'processing';

		// Store transaction details.
		if ( isset( $payload['transaction_hash'] ) ) {
			$order->update_meta_data( '_mycryptocoin_tx_hash', sanitize_text_field( $payload['transaction_hash'] ) );
		}
		if ( isset( $payload['crypto_amount'] ) ) {
			$order->update_meta_data( '_mycryptocoin_crypto_amount_paid', sanitize_text_field( $payload['crypto_amount'] ) );
		}
		if ( isset( $payload['crypto'] ) ) {
			$order->update_meta_data( '_mycryptocoin_crypto_paid', sanitize_text_field( $payload['crypto'] ) );
		}
		if ( isset( $payload['network_confirmations'] ) ) {
			$order->update_meta_data( '_mycryptocoin_confirmations', absint( $payload['network_confirmations'] ) );
		}

		$order->set_transaction_id( isset( $payload['payment_id'] ) ? sanitize_text_field( $payload['payment_id'] ) : '' );

		$crypto_display = isset( $payload['crypto'] ) ? strtoupper( $payload['crypto'] ) : 'CRYPTO';
		$amount_display = isset( $payload['crypto_amount'] ) ? $payload['crypto_amount'] : '';
		$tx_hash        = isset( $payload['transaction_hash'] ) ? $payload['transaction_hash'] : '';

		$note = sprintf(
			/* translators: 1: Crypto name, 2: Crypto amount, 3: Transaction hash */
			__( 'MyCryptoCoin payment confirmed. Paid with %1$s. Amount: %2$s. TX: %3$s', 'mycryptocoin-gateway' ),
			$crypto_display,
			$amount_display,
			$tx_hash ? $tx_hash : __( 'N/A', 'mycryptocoin-gateway' )
		);

		$order->add_order_note( $note );

		// payment_complete() sets status to 'processing' by default; override if needed.
		$order->payment_complete( isset( $payload['payment_id'] ) ? sanitize_text_field( $payload['payment_id'] ) : '' );

		// Set the merchant's preferred order status if different from 'processing'.
		if ( 'processing' !== $order_status ) {
			$order->set_status( $order_status, __( 'Crypto payment confirmed via MyCryptoCoin.', 'mycryptocoin-gateway' ) );
		}

		$order->save();

		MyCryptoCoin_Logger::info( sprintf( 'Order %d marked as %s after payment confirmation.', $order->get_id(), $order_status ) );

		return true;
	}

	/**
	 * Handle payment.failed event.
	 *
	 * @param array $payload Webhook payload.
	 * @return bool
	 */
	private function handle_payment_failed( $payload ) {
		$order = $this->get_order_from_payload( $payload );
		if ( ! $order ) {
			return false;
		}

		if ( $order->is_paid() ) {
			MyCryptoCoin_Logger::info(
				sprintf( 'Order %d already paid. Skipping payment.failed.', $order->get_id() )
			);
			return true;
		}

		$reason = isset( $payload['failure_reason'] ) ? sanitize_text_field( $payload['failure_reason'] ) : __( 'Unknown reason', 'mycryptocoin-gateway' );

		$note = sprintf(
			/* translators: %s: Failure reason */
			__( 'MyCryptoCoin payment failed. Reason: %s', 'mycryptocoin-gateway' ),
			$reason
		);

		$order->update_status( 'failed', $note );

		// Restore stock.
		wc_increase_stock_levels( $order->get_id() );

		MyCryptoCoin_Logger::info( sprintf( 'Order %d marked as failed. Reason: %s', $order->get_id(), $reason ) );

		return true;
	}

	/**
	 * Handle payment.expired event.
	 *
	 * @param array $payload Webhook payload.
	 * @return bool
	 */
	private function handle_payment_expired( $payload ) {
		$order = $this->get_order_from_payload( $payload );
		if ( ! $order ) {
			return false;
		}

		if ( $order->is_paid() ) {
			MyCryptoCoin_Logger::info(
				sprintf( 'Order %d already paid. Skipping payment.expired.', $order->get_id() )
			);
			return true;
		}

		$note = __( 'MyCryptoCoin payment expired. The customer did not complete the crypto payment in time.', 'mycryptocoin-gateway' );

		$order->update_status( 'cancelled', $note );

		// Restore stock.
		wc_increase_stock_levels( $order->get_id() );

		MyCryptoCoin_Logger::info( sprintf( 'Order %d marked as cancelled due to payment expiration.', $order->get_id() ) );

		return true;
	}

	/**
	 * Handle refund.completed event.
	 *
	 * @param array $payload Webhook payload.
	 * @return bool
	 */
	private function handle_refund_completed( $payload ) {
		$order = $this->get_order_from_payload( $payload );
		if ( ! $order ) {
			return false;
		}

		$refund_amount = isset( $payload['refund_amount'] ) ? floatval( $payload['refund_amount'] ) : 0;
		$refund_crypto = isset( $payload['refund_crypto_amount'] ) ? sanitize_text_field( $payload['refund_crypto_amount'] ) : '';
		$refund_tx     = isset( $payload['refund_transaction_hash'] ) ? sanitize_text_field( $payload['refund_transaction_hash'] ) : '';

		if ( $refund_tx ) {
			$order->update_meta_data( '_mycryptocoin_refund_tx_hash', $refund_tx );
			$order->save();
		}

		$note = sprintf(
			/* translators: 1: Refund amount, 2: Crypto refund amount, 3: Transaction hash */
			__( 'MyCryptoCoin refund completed. Fiat amount: %1$s. Crypto amount: %2$s. TX: %3$s', 'mycryptocoin-gateway' ),
			wc_price( $refund_amount, array( 'currency' => $order->get_currency() ) ),
			$refund_crypto ? $refund_crypto : __( 'N/A', 'mycryptocoin-gateway' ),
			$refund_tx ? $refund_tx : __( 'N/A', 'mycryptocoin-gateway' )
		);

		$order->add_order_note( $note );

		MyCryptoCoin_Logger::info( sprintf( 'Refund completed for order %d. Amount: %s', $order->get_id(), $refund_amount ) );

		return true;
	}

	/**
	 * Get WooCommerce order from webhook payload.
	 *
	 * @param array $payload Webhook payload.
	 * @return WC_Order|false
	 */
	private function get_order_from_payload( $payload ) {
		$order_id = 0;

		// Try to get order ID from metadata.
		if ( isset( $payload['metadata']['order_id'] ) ) {
			$order_id = absint( $payload['metadata']['order_id'] );
		} elseif ( isset( $payload['order_id'] ) ) {
			$order_id = absint( $payload['order_id'] );
		}

		if ( ! $order_id ) {
			// Try to find order by payment_id.
			if ( isset( $payload['payment_id'] ) ) {
				$order_id = $this->find_order_by_payment_id( sanitize_text_field( $payload['payment_id'] ) );
			}
		}

		if ( ! $order_id ) {
			MyCryptoCoin_Logger::error( 'Webhook: unable to determine order ID from payload.', $payload );
			return false;
		}

		$order = wc_get_order( $order_id );

		if ( ! $order ) {
			MyCryptoCoin_Logger::error( sprintf( 'Webhook: order %d not found.', $order_id ) );
			return false;
		}

		// Verify order key if provided.
		if ( isset( $payload['metadata']['order_key'] ) ) {
			$order_key = sanitize_text_field( $payload['metadata']['order_key'] );
			if ( $order->get_order_key() !== $order_key ) {
				MyCryptoCoin_Logger::error(
					sprintf( 'Webhook: order key mismatch for order %d.', $order_id )
				);
				return false;
			}
		}

		// Verify this order was paid via MyCryptoCoin.
		if ( 'mycryptocoin' !== $order->get_payment_method() ) {
			MyCryptoCoin_Logger::error(
				sprintf( 'Webhook: order %d was not paid via MyCryptoCoin.', $order_id )
			);
			return false;
		}

		return $order;
	}

	/**
	 * Find an order by MyCryptoCoin payment ID.
	 *
	 * @param string $payment_id MyCryptoCoin payment ID.
	 * @return int Order ID or 0 if not found.
	 */
	private function find_order_by_payment_id( $payment_id ) {
		global $wpdb;

		// Support both HPOS and legacy meta tables.
		if ( class_exists( 'Automattic\WooCommerce\Utilities\OrderUtil' ) &&
			Automattic\WooCommerce\Utilities\OrderUtil::custom_orders_table_usage_is_enabled() ) {
			$order_id = $wpdb->get_var(
				$wpdb->prepare(
					"SELECT order_id FROM {$wpdb->prefix}wc_orders_meta WHERE meta_key = '_mycryptocoin_payment_id' AND meta_value = %s LIMIT 1",
					$payment_id
				)
			);
		} else {
			$order_id = $wpdb->get_var(
				$wpdb->prepare(
					"SELECT post_id FROM {$wpdb->postmeta} WHERE meta_key = '_mycryptocoin_payment_id' AND meta_value = %s LIMIT 1",
					$payment_id
				)
			);
		}

		return $order_id ? absint( $order_id ) : 0;
	}
}
