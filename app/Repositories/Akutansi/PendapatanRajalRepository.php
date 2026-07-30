<?php

namespace App\Repositories\Akutansi;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class PendapatanRajalRepository
{
    public function listPasienRujukan(
        $dokter = null,
        $poli = null,
        $payor = null,
        $kasir = null,
        $tanggal_awal = null,
        $tanggal_akhir = null,
        $page = 1,
        $per_page = 10
    ) {
        $baseQuery = DB::connection('sqlsrvsimrs')
            ->table('PASIEN_RUJUKAN')
            ->join(
                'TRANSAKSIPASIEN',
                'TRANSAKSIPASIEN.FTNO_TRANSAKSI',
                '=',
                'PASIEN_RUJUKAN.FRPNOTRANSAKSIKJ'
            )
            ->when($dokter, function ($query, $dokter) {
                return $query->where('PASIEN_RUJUKAN.FRPDOKTER_ID', $dokter);
            })
            ->when($poli, function ($query, $poli) {
                return $query->where('PASIEN_RUJUKAN.FRPUNIT', $poli);
            })
            ->when($payor, function ($query, $payor) {
                return $query->where('PASIEN_RUJUKAN.FRPCUSTOMER_ID', $payor);
            })
            ->when($kasir, function ($query, $kasir) {
                return $query->where('TRANSAKSIPASIEN.USERRS', $kasir);
            })
            ->when($tanggal_awal && $tanggal_akhir, function ($query) use ($tanggal_awal, $tanggal_akhir) {
                return $query->whereBetween(
                    'PASIEN_RUJUKAN.FRPTGL',
                    [$tanggal_awal, $tanggal_akhir]
                );
            })
            ->when($tanggal_awal && !$tanggal_akhir, function ($query) use ($tanggal_awal) {
                return $query->whereDate('PASIEN_RUJUKAN.FRPTGL', '>=', $tanggal_awal);
            })
            ->when(!$tanggal_awal && $tanggal_akhir, function ($query) use ($tanggal_akhir) {
                return $query->whereDate('PASIEN_RUJUKAN.FRPTGL', '<=', $tanggal_akhir);
            });

        $total = (clone $baseQuery)->count();

        $data = $baseQuery
            ->select(
                'PASIEN_RUJUKAN.*',
                'TRANSAKSIPASIEN.USERRS as KASIR'
            )
            ->orderBy('PASIEN_RUJUKAN.FRPTGL', 'desc') // ganti jika PK berbeda
            ->orderBy('PASIEN_RUJUKAN.FRPJAM', 'desc') // ganti jika PK berbeda
            ->limit($per_page)
            ->offset(($page - 1) * $per_page)
            ->get();

        return (object) [
            'total' => $total,
            'data'  => $data,
        ];
    }
}
