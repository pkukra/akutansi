<?php

namespace App\Http\Controllers\Akutansi;

use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use App\Repositories\Akutansi\PendapatanRanapRepository;

class PendapatanRanapController extends Controller
{
    protected $ranapRepo;

    public function __construct(PendapatanRanapRepository $ranapRepo)
    {
        $this->ranapRepo = $ranapRepo;
    }

    public function index()
    {
        return Inertia::render('Akutansi/PendapatanRanap/Index');
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

        $data = $this->ranapRepo->listPasienInap(
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
}
