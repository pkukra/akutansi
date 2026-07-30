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

export default function Index({ auth, icdData }) {
    const queryParams = new URLSearchParams(window.location.search);
    const initialPage = parseInt(queryParams.get("page")) || 1;
    const initialPerPage = parseInt(queryParams.get("per_page")) || 100;
    const initialKasirFilter = queryParams.get("kasir") || "";
    const initialDokterFilter = queryParams.get("dokter") || "";
    const initialPayor = queryParams.get("payor") || "";
    const initialPoli = queryParams.get("poli") || "";
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

    const [loading, setLoading] = useState(false);
    const [dataList, setDataList] = useState(icdData || []);
    const [totalData, setTotalData] = useState(0);

    const [PoliFilter, setPoliFilter] = useState(initialPoli);
    const [PayorFilter, setPayorFilter] = useState(initialPayor);
    const [KasirFilter, setKasirFilter] = useState(initialKasirFilter);
    const [DokterFilter, setDokterFilter] = useState(initialDokterFilter);
    const [page, setPage] = useState(initialPage);
    const [perPage, setPerPage] = useState(initialPerPage);

    const buildQueryParams = (params) => {
        const query = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== null && value !== "" && value !== undefined) {
                query.set(key, value);
            }
        });
        return query.toString();
    };

    const fetchDataList = async (pageVal = page, perPageVal = perPage) => {
        setLoading(true);
        try {
            const paramObj = {
                page: pageVal,
                per_page: perPageVal,
                kasir: KasirFilter,
                dokter: DokterFilter,
                payor: PayorFilter,
                poli: PoliFilter,
                tanggal_awal: tanggalRange?.[0]?.format("YYYY-MM-DD"),
                tanggal_akhir: tanggalRange?.[1]?.format("YYYY-MM-DD"),
            };

            const queryStr = buildQueryParams(paramObj);
            window.history.replaceState(null, "", `?${queryStr}`);

            const response = await axios.get(
                route("akt.pendapatan_rajal.index_data"),
                {
                    params: paramObj,
                },
            );

            console.log(response?.data);

            setDataList(response?.data?.data || []);
            setTotalData(response?.data?.count || 0);
        } catch (error) {
            console.error("Error fetching data: ", error);
        } finally {
            setLoading(false);
        }
    };

    const handleTableChange = (pagination) => {
        const newPage = pagination.current;
        const newPerPage = pagination.pageSize;

        setPage(newPage);
        setPerPage(newPerPage);
        fetchDataList(newPage, newPerPage);
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

    useEffect(() => {
        fetchDataList();
    }, []);

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<p>Laporan Pendapatan Rajal</p>}
        >
            <Head title="Laporan Pendapatan Rajal" />
            <Card title="Laporan Pendapatan Rajal" style={{ marginBottom: 5 }}>
                <Row gutter={16} style={{ marginBottom: 10 }}>
                    <Col span={4}>
                        <Typography.Text strong>Tanggal</Typography.Text>
                        <RangePicker
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
                    <Col span={3}>
                        <Typography.Text strong>Kasir</Typography.Text>
                        <Input
                            allowClear
                            value={KasirFilter}
                            onChange={(e) => setKasirFilter(e.target.value)}
                            placeholder="Kasir"
                        />
                    </Col>

                    <Col span={4}>
                        <Typography.Text strong>Kode Dokter</Typography.Text>
                        <Input
                            allowClear
                            value={DokterFilter}
                            onChange={(e) => setDokterFilter(e.target.value)}
                            placeholder="Kode Dokter"
                        />
                    </Col>

                    <Col span={4}>
                        <Typography.Text strong>Payer</Typography.Text>
                        <Select
                            style={{ width: "100%" }}
                            value={PayorFilter}
                            onChange={(value) => setPayorFilter(value)}
                            placeholder="Payer"
                        >
                            <Select.Option value="">Semua</Select.Option>
                            {/* <Select.Option value="UMUM">UMUM</Select.Option>
                            <Select.Option value="BPJS">BPJS</Select.Option>
                            <Select.Option value="JR">
                                Jasa Raharja
                            </Select.Option>
                            <Select.Option value="ASURANSI">
                                Asuransi Lain
                            </Select.Option> */}
                        </Select>
                    </Col>

                    <Col span={4}>
                        <Typography.Text strong>Kode Poli</Typography.Text>
                        <Input
                            allowClear
                            value={PoliFilter}
                            onChange={(e) => setPoliFilter(e.target.value)}
                            placeholder="Kode Poli"
                        />
                    </Col>

                    <Col span={2}>
                        <Typography.Text>&nbsp;</Typography.Text>
                        <Button block type="primary" onClick={handleSearch}>
                            Cari
                        </Button>
                    </Col>

                    <Col span={2}>
                        <Typography.Text>&nbsp;</Typography.Text>
                        <Button block onClick={handleReset}>
                            Reset
                        </Button>
                    </Col>
                </Row>

                <h3>
                    Halaman: {page} | Per Halaman: {perPage} | Total data:{" "}
                    {totalData}.
                </h3>

                <Table
                    dataSource={dataList}
                    columns={[
                        {
                            title: "Tanggal",
                            dataIndex: "FRPTGL",
                            width: "80px",
                            render: (value) => (
                                <small>
                                    {value
                                        ? dayjs(value).format("DD/MM/YYYY")
                                        : "-"}
                                </small>
                            ),
                        },
                        {
                            title: "No RM",
                            dataIndex: "FRPPASIEN_ID",
                            align: "left",
                            width: "80px",
                            render: (_, record) => (
                                <small>{record?.FRPPASIEN_ID}</small>
                            ),
                        },
                        {
                            title: "Nama Pasien",
                            dataIndex: "NAMAPASIEN",
                            align: "left",
                            width: "200px",
                            render: (_, record) => (
                                <small>{record?.NAMAPASIEN}</small>
                            ),
                        },
                        {
                            title: "Dokter",
                            dataIndex: "FMDDOKTERN",
                            align: "left",
                            width: "200px",
                            render: (_, record) => (
                                <small>
                                    {record?.FRPDOKTER_ID} -{" "}
                                    {record?.FMDDOKTERN}
                                </small>
                            ),
                        },
                        {
                            title: "Penjamin",
                            dataIndex: "PENJAMIN",
                            align: "left",
                            width: "100px",
                            render: (_, record) => (
                                <small>{record?.PENJAMIN}</small>
                            ),
                        },
                        {
                            title: "Poli",
                            dataIndex: "FMPKLINIKN",
                            align: "left",
                            width: "200px",
                            render: (_, record) => (
                                <small>
                                    {record?.FRPUNIT} - {record?.FMPKLINIKN}
                                </small>
                            ),
                        },
                        {
                            title: "Kasir",
                            dataIndex: "KASIR",
                            align: "left",
                            width: "80px",
                            render: (_, record) => (
                                <small>{record?.KASIR}</small>
                            ),
                        },
                        {
                            title: "Total Biaya",
                            dataIndex: "TOTAL_BIAYA",
                            align: "right",
                            render: (_, record) => (
                                <small>
                                    {RupiahFormat(record?.TOTAL_BIAYA)}
                                </small>
                            ),
                        },
                        {
                            title: "Action",
                            dataIndex: "action",
                            render: (_, record) => (
                                <></>
                                // <ModalAlert dataCode={record}>
                                //     Tampilkan
                                // </ModalAlert>
                            ),
                        },
                    ]}
                    size="small"
                    loading={loading}
                    rowKey="FRPNOTRANSAKSIKJ"
                    pagination={{
                        simple: true,
                        current: page,
                        total: totalData,
                        pageSize: perPage,
                    }}
                    onChange={handleTableChange}
                />
            </Card>
        </AuthenticatedLayout>
    );
}
