<?php

namespace App\Http\Controllers\Akutansi;

use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use App\Repositories\Akutansi\PendapatanRajalRepository;

class PendapatanRajalController extends Controller
{
    protected $pendRajalRepo;

    public function __construct(PendapatanRajalRepository $pendRajalRepo)
    {
        $this->pendRajalRepo = $pendRajalRepo;
    }

    public function index()
    {
        return Inertia::render('Akutansi/PendapatanRajal/Index');
    }

    public function index_data(Request $request)
    {
        $dokter = $request->get('dokter');
        $poli = $request->get('poli');
        $payor = $request->get('payor');
        $kasir = $request->get('kasir');

        $tanggal_awal = $request->get(
            'tanggal_awal',
            Carbon::today()->subDays(6)->format('Y-m-d')
        );

        $tanggal_akhir = $request->get(
            'tanggal_akhir',
            Carbon::today()->format('Y-m-d')
        );

        $page = (int) $request->get('page', 1);
        $per_page = (int) $request->get('per_page', 20);

        $data = $this->pendRajalRepo->listPasienRujukan(
            $dokter,
            $poli,
            $payor,
            $kasir,
            $tanggal_awal,
            $tanggal_akhir,
            $page,
            $per_page
        );

        return response()->json([
            'status' => 'ok',
            'data' => $data->data,
            'count' => $data->total,
        ]);
    }

    public function pendapatan_rajal_jurnal_index()
    {
        return Inertia::render('Akutansi/PendapatanRajal/ListJurnalPendapatan');
    }

    public function pendapatan_rajal_jurnal_data(Request $request)
    {
        $dokter = $request->get('dokter');
        $poli = $request->get('poli');
        $payor = $request->get('payor');
        $kasir = $request->get('kasir');
        $page = (int) $request->get('page', 1);
        $per_page = (int) $request->get('per_page', 20);

        $noTransaksi = $request->get('no_transaksi') ?? '';
        $tanggal_awal = $request->get('tanggal_awal') ?? '';
        $tanggal_akhir = $request->get('tanggal_akhir') ?? '';

        if ($tanggal_awal && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $tanggal_awal)) {
            return response()->json([
                'message' => 'Format tanggal awal harus YYYY-MM-DD'
            ], 422);
        }

        if ($tanggal_akhir && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $tanggal_akhir)) {
            return response()->json([
                'message' => 'Format tanggal akhir harus YYYY-MM-DD'
            ], 422);
        }

        $data = $this->pendRajalRepo->listJurnalPendapatan($tanggal_awal, $tanggal_akhir, $noTransaksi);

        return response()->json([
            'status' => 'ok',
            'data' => $data->data,
            'count' => $data->total,
        ]);
    }
}
