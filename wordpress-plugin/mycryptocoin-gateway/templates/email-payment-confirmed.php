<?php
/**
 * Email template — Crypto payment confirmed notification.
 *
 * This template can be overridden by copying it to yourtheme/mycryptocoin-gateway/email-payment-confirmed.php.
 *
 * @package MyCryptoCoin_Gateway
 * @version 1.0.0
 *
 * @var WC_Order $order            The WooCommerce order.
 * @var string   $email_heading    Email heading text.
 * @var bool     $sent_to_admin    Whether this is sent to admin.
 * @var bool     $plain_text       Whether this is plain text email.
 * @var object   $email            WC_Email instance.
 */

defined( 'ABSPATH' ) || exit;

$crypto        = $order->get_meta( '_mycryptocoin_crypto_paid' );
$crypto_amount = $order->get_meta( '_mycryptocoin_crypto_amount_paid' );
$tx_hash       = $order->get_meta( '_mycryptocoin_tx_hash' );
$payment_id    = $order->get_meta( '_mycryptocoin_payment_id' );

$all_cryptos = MyCryptoCoin_Gateway::get_all_cryptos();
$crypto_name = isset( $all_cryptos[ $crypto ] ) ? $all_cryptos[ $crypto ] : strtoupper( $crypto );

/*
 * @hooked WC_Emails::email_header() Output the email header.
 */
do_action( 'woocommerce_email_header', $email_heading, $email );
?>

<?php if ( $sent_to_admin ) : ?>

	<p>
		<?php
		printf(
			/* translators: 1: Order number, 2: Customer name */
			esc_html__( 'A crypto payment has been confirmed for order #%1$s from %2$s.', 'mycryptocoin-gateway' ),
			esc_html( $order->get_order_number() ),
			esc_html( $order->get_formatted_billing_full_name() )
		);
		?>
	</p>

<?php else : ?>

	<p>
		<?php
		printf(
			/* translators: %s: Customer first name */
			esc_html__( 'Hi %s,', 'mycryptocoin-gateway' ),
			esc_html( $order->get_billing_first_name() )
		);
		?>
	</p>

	<p>
		<?php
		printf(
			/* translators: %s: Order number */
			esc_html__( 'Your crypto payment for order #%s has been confirmed. Thank you for your purchase!', 'mycryptocoin-gateway' ),
			esc_html( $order->get_order_number() )
		);
		?>
	</p>

<?php endif; ?>

<h2 style="color: #6c5ce7; font-size: 18px; margin: 24px 0 12px;">
	<?php esc_html_e( 'Payment Details', 'mycryptocoin-gateway' ); ?>
</h2>

<table cellspacing="0" cellpadding="8" border="0" style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
	<tbody>
		<?php if ( $crypto_name ) : ?>
			<tr>
				<td style="border-bottom: 1px solid #eee; font-weight: 600; color: #4a5568; padding: 8px 12px;">
					<?php esc_html_e( 'Cryptocurrency', 'mycryptocoin-gateway' ); ?>
				</td>
				<td style="border-bottom: 1px solid #eee; color: #2d3748; padding: 8px 12px;">
					<?php echo esc_html( $crypto_name ); ?>
				</td>
			</tr>
		<?php endif; ?>

		<?php if ( $crypto_amount ) : ?>
			<tr>
				<td style="border-bottom: 1px solid #eee; font-weight: 600; color: #4a5568; padding: 8px 12px;">
					<?php esc_html_e( 'Crypto Amount', 'mycryptocoin-gateway' ); ?>
				</td>
				<td style="border-bottom: 1px solid #eee; color: #2d3748; padding: 8px 12px;">
					<?php echo esc_html( $crypto_amount ); ?> <?php echo esc_html( strtoupper( $crypto ) ); ?>
				</td>
			</tr>
		<?php endif; ?>

		<tr>
			<td style="border-bottom: 1px solid #eee; font-weight: 600; color: #4a5568; padding: 8px 12px;">
				<?php esc_html_e( 'Fiat Amount', 'mycryptocoin-gateway' ); ?>
			</td>
			<td style="border-bottom: 1px solid #eee; color: #2d3748; padding: 8px 12px;">
				<?php echo wp_kses_post( $order->get_formatted_order_total() ); ?>
			</td>
		</tr>

		<?php if ( $tx_hash ) : ?>
			<tr>
				<td style="border-bottom: 1px solid #eee; font-weight: 600; color: #4a5568; padding: 8px 12px;">
					<?php esc_html_e( 'Transaction Hash', 'mycryptocoin-gateway' ); ?>
				</td>
				<td style="border-bottom: 1px solid #eee; color: #2d3748; padding: 8px 12px; word-break: break-all; font-family: monospace; font-size: 12px;">
					<?php echo esc_html( $tx_hash ); ?>
				</td>
			</tr>
		<?php endif; ?>

		<?php if ( $payment_id ) : ?>
			<tr>
				<td style="border-bottom: 1px solid #eee; font-weight: 600; color: #4a5568; padding: 8px 12px;">
					<?php esc_html_e( 'Payment ID', 'mycryptocoin-gateway' ); ?>
				</td>
				<td style="border-bottom: 1px solid #eee; color: #2d3748; padding: 8px 12px; font-family: monospace; font-size: 12px;">
					<?php echo esc_html( $payment_id ); ?>
				</td>
			</tr>
		<?php endif; ?>
	</tbody>
</table>

<?php

/*
 * @hooked WC_Emails::order_details() Shows the order details table.
 * @hooked WC_Structured_Data::generate_order_data() Generates structured data.
 * @hooked WC_Structured_Data::output_structured_data() Outputs structured data.
 */
do_action( 'woocommerce_email_order_details', $order, $sent_to_admin, $plain_text, $email );

/*
 * @hooked WC_Emails::order_meta() Shows order meta data.
 */
do_action( 'woocommerce_email_order_meta', $order, $sent_to_admin, $plain_text, $email );

/*
 * @hooked WC_Emails::customer_details() Shows customer details.
 * @hooked WC_Emails::email_address() Shows email address.
 */
do_action( 'woocommerce_email_customer_details', $order, $sent_to_admin, $plain_text, $email );

?>

<p style="font-size: 12px; color: #a0aec0; margin-top: 24px;">
	<?php
	echo wp_kses_post(
		sprintf(
			/* translators: %s: MyCryptoCoin website URL */
			__( 'Crypto payment processed securely by %s', 'mycryptocoin-gateway' ),
			'<a href="https://mycrypto.co.in" style="color: #6c5ce7;">MyCryptoCoin</a>'
		)
	);
	?>
</p>

<?php

/*
 * @hooked WC_Emails::email_footer() Output the email footer.
 */
do_action( 'woocommerce_email_footer', $email );
