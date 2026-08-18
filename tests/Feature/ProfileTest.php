<?php

namespace Tests\Feature;

use App\Models\User;
use App\Repositories\Akutansi\PendapatanRajalRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_profile_page_is_displayed(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->get('/profile');

        $response->assertOk();
    }

    public function test_pendapatan_rajal_export_route_returns_excel_with_filters(): void
    {
        $user = User::factory()->create();

        $repository = Mockery::mock(PendapatanRajalRepository::class);
        $repository->shouldReceive('listPasienRujukan')
            ->once()
            ->with('D01', 'P01', 'PAYOR1', 'K01', '2026-08-01', '2026-08-10', 1, null)
            ->andReturn((object) [
                'total' => 1,
                'data' => collect([
                    [
                        'FRPTGL' => '2026-08-01',
                        'FRPPASIEN_ID' => '001',
                        'NAMAPASIEN' => 'Test Pasien',
                        'FMDDOKTERN' => 'Dokter A',
                        'PENJAMIN' => 'BPJS',
                        'FMPKLINIKN' => 'Poli A',
                        'KASIR' => 'Kasir A',
                        'TOTAL_BIAYA' => 100000,
                        'KAS' => 100000,
                        'BANK' => 0,
                        'PIUTANG' => 0,
                        'PENDAFTARAN' => 0,
                        'JASA_MEDIS' => 0,
                        'OBAT' => 0,
                        'LAB' => 0,
                        'RADIOLOGI' => 0,
                    ],
                ]),
            ]);

        $this->app->instance(PendapatanRajalRepository::class, $repository);

        $response = $this
            ->actingAs($user)
            ->get('/akutansi/pendapatan-rajal-export?dokter=D01&poli=P01&payor=PAYOR1&kasir=K01&tanggal_awal=2026-08-01&tanggal_akhir=2026-08-10');

        $response
            ->assertOk()
            ->assertHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    }

    public function test_profile_information_can_be_updated(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->patch('/profile', [
                'name' => 'Test User',
                'email' => 'test@example.com',
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/profile');

        $user->refresh();

        $this->assertSame('Test User', $user->name);
        $this->assertSame('test@example.com', $user->email);
        $this->assertNull($user->email_verified_at);
    }

    public function test_email_verification_status_is_unchanged_when_the_email_address_is_unchanged(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->patch('/profile', [
                'name' => 'Test User',
                'email' => $user->email,
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/profile');

        $this->assertNotNull($user->refresh()->email_verified_at);
    }

    public function test_user_can_delete_their_account(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->delete('/profile', [
                'password' => 'password',
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/');

        $this->assertGuest();
        $this->assertNull($user->fresh());
    }

    public function test_correct_password_must_be_provided_to_delete_account(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->from('/profile')
            ->delete('/profile', [
                'password' => 'wrong-password',
            ]);

        $response
            ->assertSessionHasErrors('password')
            ->assertRedirect('/profile');

        $this->assertNotNull($user->fresh());
    }
}
