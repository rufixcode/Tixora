<?php

namespace Tests\Feature;

use Tests\TestCase;

class MobileCorsTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        config(['cors.allowed_origins' => ['https://tixora-mobile.vercel.app']]);
    }

    public function test_mobile_origin_can_preflight_json_and_bearer_requests(): void
    {
        $this->withHeaders([
            'Origin' => 'https://tixora-mobile.vercel.app',
            'Access-Control-Request-Method' => 'POST',
            'Access-Control-Request-Headers' => 'authorization,content-type',
        ])->options('/api/login')
            ->assertNoContent()
            ->assertHeader('Access-Control-Allow-Origin', 'https://tixora-mobile.vercel.app')
            ->assertHeaderMissing('Access-Control-Allow-Credentials');
    }

    public function test_unlisted_origin_is_not_reflected_as_an_allowed_origin(): void
    {
        $this->withHeaders([
            'Origin' => 'https://unlisted.example',
            'Access-Control-Request-Method' => 'POST',
        ])->options('/api/login')
            // With one allowed origin the CORS library uses a constant header.
            // Browsers reject it for any requesting origin that does not match.
            ->assertHeader('Access-Control-Allow-Origin', 'https://tixora-mobile.vercel.app');
    }

    public function test_website_session_routes_are_not_opened_to_cross_origin_requests(): void
    {
        $this->withHeaders([
            'Origin' => 'https://tixora-mobile.vercel.app',
            'Access-Control-Request-Method' => 'POST',
        ])->options('/web/login')->assertHeaderMissing('Access-Control-Allow-Origin');
    }
}
