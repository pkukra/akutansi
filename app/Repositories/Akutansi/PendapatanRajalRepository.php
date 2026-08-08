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

        /*
    |--------------------------------------------------------------------------
    | Mapping COA
    |--------------------------------------------------------------------------
    */
        $mappingProduk = [
            'PENDAFTARAN' => [
                '411.1111',
            ],

            'JASA_MEDIS' => [
                '411.1103',
                '411.1101'
            ],

            'OBAT' => [
                '411.1113',
            ],

            'RADIOLOGI' => [
                '411.1107',
            ],

            'LAB' => [
                '411.1108',
            ],
        ];

        $mappingPembayaran = [
            'KAS' => [
                '111.1300',
            ],

            'BANK' => [
                '111.2010',
                '111.2020',
                '112.1100 ',
            ],

            'PIUTANG' => [
                '112.1200',
                '112.3100',
            ],
        ];

        /*
    |--------------------------------------------------------------------------
    | Generate SUM(CASE WHEN ...)
    |--------------------------------------------------------------------------
    */
        $kategoriSql = [];
        $kategoriSelect = [];

        foreach ($mappingProduk as $alias => $coaList) {

            $coa = "'" . implode("','", $coaList) . "'";

            $kategoriSql[] = "
            SUM(
                CASE
                    WHEN P.COA_RJ_UMUM IN ($coa)
                    THEN TPD.FDTDEBET
                    ELSE 0
                END
            ) AS $alias
        ";

            $kategoriSelect[] = DB::raw(
                "ISNULL(TPD.$alias,0) AS $alias"
            );
        }

        $kategoriSql = implode(",\n", $kategoriSql);

        /*
    |--------------------------------------------------------------------------
    | Generate pembayaran
    |--------------------------------------------------------------------------
    */
        $pembayaranSql = [];
        $pembayaranSelect = [];

        foreach ($mappingPembayaran as $alias => $coaList) {

            $coa = "'" . implode("','", $coaList) . "'";

            $pembayaranSql[] = "
            SUM(
                CASE
                    WHEN P.COA_RJ_UMUM IN ($coa)
                    THEN TPD.FDTKREDIT
                    ELSE 0
                END
            ) AS $alias
        ";

            $pembayaranSelect[] = DB::raw(
                "ISNULL(TPK.$alias,0) AS $alias"
            );
        }

        $pembayaranSql = implode(",\n", $pembayaranSql);

        /*
    |--------------------------------------------------------------------------
    | Base Query
    |--------------------------------------------------------------------------
    */
        $baseQuery = DB::connection('sqlsrvsimrs')
            ->table('PASIEN_RUJUKAN')

            /*
        |--------------------------------------------------------------------------
        | TRANSAKSIPASIEN
        |--------------------------------------------------------------------------
        */
            ->leftJoin(
                'TRANSAKSIPASIEN',
                'TRANSAKSIPASIEN.FTNO_TRANSAKSI',
                '=',
                'PASIEN_RUJUKAN.FRPNOTRANSAKSIKJ'
            )

            /*
        |--------------------------------------------------------------------------
        | PASIEN
        |--------------------------------------------------------------------------
        */
            ->leftJoin(
                'PASIEN',
                'PASIEN.KD_PASIEN',
                '=',
                'PASIEN_RUJUKAN.FRPPASIEN_ID'
            )

            /*
        |--------------------------------------------------------------------------
        | DOKTER
        |--------------------------------------------------------------------------
        */
            ->leftJoin(
                'DOKTER',
                'DOKTER.FMDDOKTER_ID',
                '=',
                'PASIEN_RUJUKAN.FRPDOKTER_ID'
            )

            /*
        |--------------------------------------------------------------------------
        | CUSTOMER / PENJAMIN
        |--------------------------------------------------------------------------
        */
            ->leftJoin(
                'CUSTOMER',
                'CUSTOMER.CUSID',
                '=',
                'PASIEN_RUJUKAN.FRPCUSTOMER_ID'
            )

            /*
        |--------------------------------------------------------------------------
        | POLIKLINIK
        |--------------------------------------------------------------------------
        */
            ->leftJoin(
                'POLIKLINIK',
                'POLIKLINIK.FMPKLINIK_ID',
                '=',
                'PASIEN_RUJUKAN.FRPUNIT'
            )

            /*
        |--------------------------------------------------------------------------
        | Total biaya + kategori produk
        |--------------------------------------------------------------------------
        */
            ->leftJoin(
                DB::raw("
                (
                    SELECT
                        TPD.FDTNO_TRANSAKSI,
                        SUM(TPD.FDTDEBET) AS TOTAL_BIAYA,
                        $kategoriSql
                    FROM TRANSAKSIPASIEND TPD
                    INNER JOIN PRODUK P
                        ON P.FMPPRODUK_ID = TPD.FDTKD_PRODUK
                    GROUP BY
                        TPD.FDTNO_TRANSAKSI
                ) TPD
            "),
                'TRANSAKSIPASIEN.FTNO_TRANSAKSI',
                '=',
                'TPD.FDTNO_TRANSAKSI'
            )

            /*
        |--------------------------------------------------------------------------
        | Pembayaran
        |--------------------------------------------------------------------------
        */
            ->leftJoin(
                DB::raw("
                (
                    SELECT
                        TPD.FDTNO_TRANSAKSI,
                        $pembayaranSql
                    FROM TRANSAKSIPASIEND TPD
                    INNER JOIN PRODUK P
                        ON P.FMPPRODUK_ID = TPD.FDTKD_PRODUK
                    GROUP BY
                        TPD.FDTNO_TRANSAKSI
                ) TPK
            "),
                'TRANSAKSIPASIEN.FTNO_TRANSAKSI',
                '=',
                'TPK.FDTNO_TRANSAKSI'
            )

            /*
        |--------------------------------------------------------------------------
        | Filter dokter
        |--------------------------------------------------------------------------
        */
            ->when($dokter, function ($query, $dokter) {
                return $query->where(
                    'PASIEN_RUJUKAN.FRPDOKTER_ID',
                    $dokter
                );
            })

            /*
        |--------------------------------------------------------------------------
        | Filter poli
        |--------------------------------------------------------------------------
        */
            ->when($poli, function ($query, $poli) {
                return $query->where(
                    'PASIEN_RUJUKAN.FRPUNIT',
                    $poli
                );
            })

            /*
        |--------------------------------------------------------------------------
        | Filter payor
        |--------------------------------------------------------------------------
        */
            ->when($payor, function ($query, $payor) {
                return $query->where(
                    'PASIEN_RUJUKAN.FRPCUSTOMER_ID',
                    $payor
                );
            })

            /*
        |--------------------------------------------------------------------------
        | Filter kasir
        |--------------------------------------------------------------------------
        */
            ->when($kasir, function ($query, $kasir) {
                return $query->where(
                    'TRANSAKSIPASIEN.USERRS',
                    $kasir
                );
            })

            /*
        |--------------------------------------------------------------------------
        | Filter tanggal: tanggal awal dan akhir
        |--------------------------------------------------------------------------
        */
            ->when(
                $tanggal_awal && $tanggal_akhir,
                function ($query) use ($tanggal_awal, $tanggal_akhir) {

                    return $query->whereBetween(
                        'PASIEN_RUJUKAN.FRPTGL',
                        [$tanggal_awal, $tanggal_akhir]
                    );
                }
            )

            /*
        |--------------------------------------------------------------------------
        | Filter tanggal: hanya tanggal awal
        |--------------------------------------------------------------------------
        */
            ->when(
                $tanggal_awal && !$tanggal_akhir,
                function ($query) use ($tanggal_awal) {

                    return $query->whereDate(
                        'PASIEN_RUJUKAN.FRPTGL',
                        '>=',
                        $tanggal_awal
                    );
                }
            )

            /*
        |--------------------------------------------------------------------------
        | Filter tanggal: hanya tanggal akhir
        |--------------------------------------------------------------------------
        */
            ->when(
                !$tanggal_awal && $tanggal_akhir,
                function ($query) use ($tanggal_akhir) {

                    return $query->whereDate(
                        'PASIEN_RUJUKAN.FRPTGL',
                        '<=',
                        $tanggal_akhir
                    );
                }
            )

            /*
        |--------------------------------------------------------------------------
        | EXCLUDE TRANSAKSI YANG SUDAH MASUK RANAP
        |--------------------------------------------------------------------------
        |
        | Jika:
        |
        | TRANSAKSIPASIEN.FTNO_TRANSAKSI
        | sama dengan
        | TRANSAKSIPASIENINAPD.FDTNO_FAKTUR
        |
        | maka transaksi tersebut tidak ditampilkan.
        |--------------------------------------------------------------------------
        */
            ->whereNotExists(function ($query) {

                $query->select(DB::raw(1))
                    ->from('TRANSAKSIPASIENINAPD')
                    ->whereColumn(
                        'TRANSAKSIPASIENINAPD.FDTNO_FAKTUR',
                        'TRANSAKSIPASIEN.FTNO_TRANSAKSI'
                    );
            });

        /*
    |--------------------------------------------------------------------------
    | Total
    |--------------------------------------------------------------------------
    */
        $total = (clone $baseQuery)->count();

        /*
    |--------------------------------------------------------------------------
    | Select
    |--------------------------------------------------------------------------
    */
        $select = [
            'POLIKLINIK.FMPKLINIKN',
            'PASIEN.NAMAPASIEN',
            'CUSTOMER.NAME AS PENJAMIN',
            'DOKTER.FMDDOKTERN',
            'PASIEN_RUJUKAN.*',
            'TRANSAKSIPASIEN.USERRS AS KASIR',

            DB::raw(
                'ISNULL(TPD.TOTAL_BIAYA,0) AS TOTAL_BIAYA'
            ),
        ];

        $select = array_merge(
            $select,
            $kategoriSelect,
            $pembayaranSelect
        );

        /*
    |--------------------------------------------------------------------------
    | Data
    |--------------------------------------------------------------------------
    */
        $data = $baseQuery
            ->select($select)

            ->orderBy(
                'PASIEN_RUJUKAN.FRPTGL',
                'desc'
            )

            ->orderBy(
                'PASIEN_RUJUKAN.FRPJAM',
                'desc'
            )

            ->limit($per_page)

            ->offset(
                ($page - 1) * $per_page
            )

            ->get();

        /*
    |--------------------------------------------------------------------------
    | Return
    |--------------------------------------------------------------------------
    */
        return (object) [
            'total' => $total,
            'data'  => $data,
        ];
    }
}
