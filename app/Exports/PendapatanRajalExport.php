<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class PendapatanRajalExport implements FromCollection, WithHeadings, WithMapping
{
    protected $data;

    public function __construct($data)
    {
        $this->data = $data;
    }

    private function valueOf($row, string $key)
    {
        $candidates = [$key];

        $map = [
            'FRPTGL' => ['FRPTGL', 'TANGGAL'],
            'FRPPASIEN_ID' => ['FRPPASIEN_ID', 'NO_RM'],
            'FRPNOTRANSAKSIKJ' => ['FRPNOTRANSAKSIKJ', 'NO_TRANSAKSI'],
            'NAMAPASIEN' => ['NAMAPASIEN', 'NAMA_PASIEN'],
            'FMDDOKTERN' => ['FMDDOKTERN', 'DOKTER_NAMA', 'DOKTER'],
            'PENJAMIN' => ['PENJAMIN', 'NAMA_PENJAMIN'],
            'FMPKLINIKN' => ['FMPKLINIKN', 'POLI_NAMA', 'POLI'],
            'KASIR' => ['KASIR', 'USERRS'],
            'TOTAL_BIAYA' => ['TOTAL_BIAYA', 'TOTALBIAYA'],
            'PENDAFTARAN' => ['PENDAFTARAN', 'PENDAFTARAN_RJ'],
            'JASA_MEDIS' => ['JASA_MEDIS', 'JASA_MEDIS_RJ'],
            'OBAT' => ['OBAT', 'OBAT_RJ'],
            'LAB' => ['LAB', 'LAB_RJ'],
            'RADIOLOGI' => ['RADIOLOGI', 'RADIOLOGI_RJ'],
            'KAS' => ['KAS', 'KAS_RJ'],
            'BANK' => ['BANK', 'BANK_RJ'],
            'PIUTANG' => ['PIUTANG', 'PIUTANG_RJ'],
        ];

        if (isset($map[$key])) {
            $candidates = $map[$key];
        }

        foreach ($candidates as $candidate) {
            if (is_array($row) && array_key_exists($candidate, $row)) {
                return $row[$candidate];
            }

            if (is_object($row) && property_exists($row, $candidate)) {
                return $row->{$candidate};
            }
        }

        return null;
    }

    public function collection()
    {
        return collect($this->data)->map(function ($row) {
            $totalBiaya = (float) ($this->valueOf($row, 'TOTAL_BIAYA') ?? 0);
            $pendaftaran = (float) ($this->valueOf($row, 'PENDAFTARAN') ?? 0);
            $jasaMedis = (float) ($this->valueOf($row, 'JASA_MEDIS') ?? 0);
            $obat = (float) ($this->valueOf($row, 'OBAT') ?? 0);
            $radiologi = (float) ($this->valueOf($row, 'RADIOLOGI') ?? 0);
            $lab = (float) ($this->valueOf($row, 'LAB') ?? 0);
            $lainnya = $totalBiaya - $pendaftaran - $jasaMedis - $obat - $radiologi - $lab;

            $tanggal = $this->valueOf($row, 'FRPTGL');
            $dokter = trim((string) ($this->valueOf($row, 'FRPDOKTER_ID') ?? '') . ' - ' . (string) ($this->valueOf($row, 'FMDDOKTERN') ?? ''));
            $penjamin = trim((string) ($this->valueOf($row, 'FRPCUSTOMER_ID') ?? '') . ' - ' . (string) ($this->valueOf($row, 'PENJAMIN') ?? ''));
            $poli = trim((string) ($this->valueOf($row, 'FRPUNIT') ?? '') . ' - ' . (string) ($this->valueOf($row, 'FMPKLINIKN') ?? ''));

            return [
                'TANGGAL' => $tanggal ? \Carbon\Carbon::parse($tanggal)->format('Y-m-d') : '',
                'NO_RM' => $this->valueOf($row, 'FRPPASIEN_ID') ?? '',
                'NO_TRANSAKSI' => $this->valueOf($row, 'FRPNOTRANSAKSIKJ') ?? '',
                'NAMA_PASIEN' => $this->valueOf($row, 'NAMAPASIEN') ?? '',
                'DOKTER' => $dokter,
                'PENJAMIN' => $penjamin,
                'POLI' => $poli,
                'KASIR' => $this->valueOf($row, 'KASIR') ?? '',
                'TOTAL_BIAYA' => $totalBiaya,
                'PENDAFTARAN' => $pendaftaran,
                'JASA_MEDIS' => $jasaMedis,
                'OBAT' => $obat,
                'LAB' => $lab,
                'RADIOLOGI' => $radiologi,
                'LAINNYA' => $lainnya,
                'KAS' => (float) ($this->valueOf($row, 'KAS') ?? 0),
                'BANK' => (float) ($this->valueOf($row, 'BANK') ?? 0),
                'PIUTANG' => (float) ($this->valueOf($row, 'PIUTANG') ?? 0),
            ];
        });
    }

    public function headings(): array
    {
        return [
            'Tanggal',
            'No RM',
            'No Transaksi',
            'Nama Pasien',
            'Dokter',
            'Penjamin',
            'Poli',
            'Kasir',
            'Total Biaya',
            'Pendaftaran',
            'Jasa Medis',
            'Obat',
            'Lab',
            'Radiologi',
            'Lainnya',
            'Kas',
            'Bank',
            'Piutang',
        ];
    }

    public function map($row): array
    {
        $totalBiaya = (float) ($this->valueOf($row, 'TOTAL_BIAYA') ?? 0);
        $pendaftaran = (float) ($this->valueOf($row, 'PENDAFTARAN') ?? 0);
        $jasaMedis = (float) ($this->valueOf($row, 'JASA_MEDIS') ?? 0);
        $obat = (float) ($this->valueOf($row, 'OBAT') ?? 0);
        $radiologi = (float) ($this->valueOf($row, 'RADIOLOGI') ?? 0);
        $lab = (float) ($this->valueOf($row, 'LAB') ?? 0);
        $lainnya = $totalBiaya - $pendaftaran - $jasaMedis - $obat - $radiologi - $lab;

        $tanggal = $this->valueOf($row, 'FRPTGL');

        return [
            $tanggal ? \Carbon\Carbon::parse($tanggal)->format('Y-m-d') : '',
            $this->valueOf($row, 'FRPPASIEN_ID') ?? '',
            $this->valueOf($row, 'FRPNOTRANSAKSIKJ') ?? '',
            $this->valueOf($row, 'NAMAPASIEN') ?? '',
            trim((string) ($this->valueOf($row, 'FRPDOKTER_ID') ?? '') . ' - ' . (string) ($this->valueOf($row, 'FMDDOKTERN') ?? '')),
            trim((string) ($this->valueOf($row, 'FRPCUSTOMER_ID') ?? '') . ' - ' . (string) ($this->valueOf($row, 'PENJAMIN') ?? '')),
            trim((string) ($this->valueOf($row, 'FRPUNIT') ?? '') . ' - ' . (string) ($this->valueOf($row, 'FMPKLINIKN') ?? '')),
            $this->valueOf($row, 'KASIR') ?? '',
            $totalBiaya,
            $pendaftaran,
            $jasaMedis,
            $obat,
            $lab,
            $radiologi,
            $lainnya,
            (float) ($this->valueOf($row, 'KAS') ?? 0),
            (float) ($this->valueOf($row, 'BANK') ?? 0),
            (float) ($this->valueOf($row, 'PIUTANG') ?? 0),
        ];
    }
}
