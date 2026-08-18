<?php

namespace App\Repositories\Akutansi;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Date;
use Stringable;

class PendapatanRajalRepository
{
    public function listJurnalPendapatan(string $tanggal_awal = '', string $tanggal_akhir = '', string $noTransaksi = '')
    {
        // =========================
        // PARENT
        // =========================
        $query = DB::connection('sqlsrvsimrs')
            ->table('PASIEN_RUJUKAN')
            ->select('FRPNOTRANSAKSIKJ', 'FRPUNIT', 'FRPDOKTER_ID', 'FRPPASIEN_ID', 'FRPCUSTOMER_ID', 'CUSTOMER.NAME AS CUSTOMER_NAME', 'NOSEP_NOW AS SEP', 'FMDDOKTERN', 'FMPKLINIKN')
            ->leftJoin(
                'CUSTOMER',
                'CUSID',
                '=',
                'FRPCUSTOMER_ID'
            )
            ->leftJoin(
                'DOKTER',
                'FRPDOKTER_ID',
                '=',
                'FMDDOKTER_ID'
            )
            ->leftJoin(
                'POLIKLINIK',
                'FRPUNIT',
                '=',
                'FMPKLINIK_ID'
            )
            ->when($noTransaksi, function ($query) use ($noTransaksi) {
                return $query->where(
                    'PASIEN_RUJUKAN.FRPNOTRANSAKSIKJ',
                    $noTransaksi
                );
            })
            ->when(
                $tanggal_awal && $tanggal_akhir,
                function ($query) use ($tanggal_awal, $tanggal_akhir) {
                    return $query->whereBetween(
                        'PASIEN_RUJUKAN.FRPTGL',
                        [
                            $tanggal_awal . ' 00:00:00',
                            $tanggal_akhir . ' 23:59:59',
                        ]
                    );
                }
            );

        $data = $query->get();

        // Kalau tidak ada data
        if ($data->isEmpty()) {
            return (object) [
                'total' => 0,
                'data'  => collect(),
            ];
        }

        // =========================
        // AMBIL SEMUA ID TRANSAKSI
        // =========================
        $noTransaksiArr = $data
            ->pluck('FRPNOTRANSAKSIKJ')
            ->filter()
            ->unique()
            ->values();

        // =========================
        // CHILD
        // =========================
        $children = DB::connection('sqlsrvsimrs')
            ->table('TRANSAKSIPASIEND')
            ->whereIn('FDTNO_TRANSAKSI', $noTransaksiArr)
            ->select(
                'FDTNO_TRANSAKSI',
                'FDTNOMER',
                'FDTKDPRODUKN',
                'FMPPRODUKN',

                DB::raw("
                    CASE
                        WHEN FRPCUSTOMER_ID = 'X001'
                            THEN COA_RJ_UMUM

                        WHEN FRPCUSTOMER_ID IN ('X002', 'X003')
                            THEN COA_RJ_BPJS

                        ELSE COA_RJ_ASURANSI
                    END AS COA
                "),
                'ACCOUNT.DESCRIPTION AS ACCOUNT_DESCRIPTION',

                'FDTKD_PRODUK',
                'FDTQTY',
                'FDTDEBET',
                'FDTKREDIT',
                'FDTJENISTRANSAKSI',
            )
            ->leftJoin(
                'PASIEN_RUJUKAN',
                'FRPNOTRANSAKSIKJ',
                '=',
                'FDTNO_TRANSAKSI'
            )
            ->leftJoin('PRODUK', 'FDTKD_PRODUK', '=', 'FMPPRODUK_ID')

            // ACCOUNT berdasarkan customer
            ->leftJoin('ACCOUNT', function ($join) {
                $join->on(
                    'ACCOUNT',
                    '=',
                    DB::raw("
                CASE
                    WHEN FRPCUSTOMER_ID = 'X001'
                        THEN COA_RJ_UMUM

                    WHEN FRPCUSTOMER_ID IN ('X002', 'X003')
                        THEN COA_RJ_BPJS

                    ELSE COA_RJ_ASURANSI
                END
            ")
                );
            })
            ->orderBy('FDTNOMER', 'DESC')
            ->get()
            ->groupBy('FDTNO_TRANSAKSI');

        // =========================
        // GABUNGKAN CHILD KE PARENT
        // =========================
        $data->transform(function ($item) use ($children) {
            $item->details = $children
                ->get($item->FRPNOTRANSAKSIKJ, collect())
                ->values();
            return $item;
        });

        return (object) [
            'total' => $data->count(),
            'data'  => $data,
        ];
    }

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
        $query = $baseQuery
            ->select($select)
            ->orderBy(
                'PASIEN_RUJUKAN.FRPTGL',
                'desc'
            )
            ->orderBy(
                'PASIEN_RUJUKAN.FRPJAM',
                'desc'
            );

        if ($per_page !== null) {
            $query->limit((int) $per_page)
                ->offset((int) (($page - 1) * $per_page));
        }

        $data = $query->get();

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
