import React, { useState, useEffect } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import {
    Card,
    Button,
    Table,
    Row,
    Col,
    Input,
    Select,
    Typography,
    DatePicker,
} from "antd";
const { RangePicker } = DatePicker;

import axios from "axios";
import dayjs from "dayjs";

const RupiahFormat = (x) => {
    const number = Number(x);
    const formatted = new Intl.NumberFormat("id-ID").format(number);
    return formatted;
};

export default function Index({ auth }) {
    const [formSize, setFormSize] = useState('medium'); // default is 'medium'

    const queryParams = new URLSearchParams(window.location.search);
    const initialPage = parseInt(queryParams.get("page")) || 1;
    const initialPerPage = parseInt(queryParams.get("per_page")) || 100;
    const [page, setPage] = useState(initialPage);
    const [perPage, setPerPage] = useState(initialPerPage);
    const [loading, setLoading] = useState(false);
    const [dataList, setDataList] = useState([]);
    const [totalData, setTotalData] = useState(0);

    const initialTanggalAwal =
        queryParams.get("tanggal_awal") ||
        dayjs().subtract(6, "day").format("YYYY-MM-DD");

    const initialTanggalAkhir =
        queryParams.get("tanggal_akhir") || dayjs().format("YYYY-MM-DD");

    const [tanggalRange, setTanggalRange] = useState([
        dayjs(initialTanggalAwal),
        dayjs(initialTanggalAkhir),
    ]);

    const disableFutureDate = (current) => {
        return current && current.endOf("day").isAfter(dayjs());
    };

    const handleSearch = () => {
        const paramObj = {
            page: 1,
            per_page: perPage,
            kasir: KasirFilter,
            dokter: DokterFilter,
            payor: PayorFilter,
            poli: PoliFilter,
            tanggal_awal: tanggalRange?.[0]?.format("YYYY-MM-DD"),
            tanggal_akhir: tanggalRange?.[1]?.format("YYYY-MM-DD"),
        };

        const queryStr = buildQueryParams(paramObj);
        window.history.replaceState(null, "", `?${queryStr}`);

        setPage(1);
        fetchDataList(1, perPage);
    };

    const handleReset = () => {
        window.location.replace(route("akt.pendapatan_rajal.index"));
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<p>Jurnal Pemdapatan </p>}
        >
            <Head title="Laporan Pendapatan Rajal" />
            <Card>
                <Row gutter={16} style={{ marginBottom: 10 }}>
                    <Col span={4}>
                        <Typography.Text strong>Tanggal</Typography.Text>
                        <RangePicker
                            size={formSize}
                            style={{ width: "100%" }}
                            value={tanggalRange}
                            format="YYYY-MM-DD"
                            disabledDate={disableFutureDate}
                            onChange={(dates) => {
                                if (!dates) {
                                    setTanggalRange([
                                        dayjs().subtract(6, "day"),
                                        dayjs(),
                                    ]);
                                    return;
                                }

                                setTanggalRange(dates);
                            }}
                        />
                    </Col>



                    <Col span={2}>
                        <Typography.Text>&nbsp;</Typography.Text>
                        <Button block type="primary" onClick={handleSearch} size={formSize}>
                            Cari
                        </Button>
                    </Col>

                    <Col span={2}>
                        <Typography.Text>&nbsp;</Typography.Text>
                        <Button block onClick={handleReset} size={formSize}>
                            Reset
                        </Button>
                    </Col>
                </Row>

                <p>
                    Halaman: {page} | Per Halaman: {perPage} | Total data:{" "}
                    {totalData}.
                </p>
            </Card>
        </AuthenticatedLayout>
    );
}