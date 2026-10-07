<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class PayMongo
{
    public function ready(): bool
    {
        return str_starts_with((string) config('paymongo.secret_key'), 'sk_test_') && (bool) config('paymongo.webhook_secret');
    }

    private function client()
    {
        abort_unless($this->ready(), 503, 'PayMongo sandbox is not configured yet.');

        return Http::withBasicAuth(config('paymongo.secret_key'), '')->acceptJson()->timeout(15)->connectTimeout(5);
    }

    public function create(object $booking): array
    {
        $response = $this->client()->withHeaders(['Idempotency-Key' => $booking->booking_reference])
            ->post('https://api.paymongo.com/v2/checkout_sessions', ['data' => ['attributes' => [
                'line_items' => [['name' => $booking->event_title, 'amount' => (int) round((float) $booking->total_amount * 100), 'currency' => 'PHP', 'quantity' => 1]],
                'payment_method_types' => array_values(config('paymongo.methods')),
                'reference_number' => $booking->booking_reference,
                'success_url' => config('paymongo.return_url'), 'cancel_url' => config('paymongo.return_url'),
                'description' => 'Tixora sandbox '.$booking->booking_reference,
            ]]]);
        abort_unless($response->successful(), 502, 'Unable to start sandbox checkout. Retry from your bookings.');
        $data = $response->json('data');
        $url = data_get($data, 'attributes.checkout_url');
        abort_unless(is_string($url) && parse_url($url, PHP_URL_SCHEME) === 'https' && parse_url($url, PHP_URL_HOST) === 'checkout.paymongo.com' && is_string(data_get($data, 'id')), 502, 'Invalid checkout response.');

        return $data;
    }

    public function retrieve(string $id): array
    {
        $response = $this->client()->get('https://api.paymongo.com/v1/checkout_sessions/'.rawurlencode($id));
        abort_unless($response->successful(), 502, 'Unable to verify payment. Please try again.');

        return $response->json('data');
    }

    public function expire(string $id): void
    {
        $response = $this->client()->post('https://api.paymongo.com/v1/checkout_sessions/'.rawurlencode($id).'/expire');
        abort_unless($response->successful(), 502, 'Unable to close payment session. Please try again.');
    }
}
