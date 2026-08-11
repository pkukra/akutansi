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
    DatePicker, Grid
} from "antd";

const { useBreakpoint } = Grid;
const { RangePicker } = DatePicker;

import axios from "axios";
import dayjs from "dayjs";

const RupiahFormat = (x) => {
    const number = Number(x);
    const formatted = new Intl.NumberFormat("id-ID").format(number);
    return formatted;
};

export default function Index({ auth }) {

    const screens = useBreakpoint();
    const formSize = screens.xxl ? "middle" : "small";
    const scrollY = screens.xxl ? 600 : 400;

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

    // const [scrollY, setScrollY] = useState(400); // default scroll height
    const [loading, setLoading] = useState(false);
    const [dataList, setDataList] = useState([]);
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

    // useEffect(() => {
    //     const screenWidth = window.innerWidth;
    //     if (screenWidth > 1280) {
    //         setScrollY(600); // Untuk layar besar
    //     } else {
    //         setScrollY(390); // Untuk layar kecil
    //     }
    // }, []);

    const summary = dataList.reduce(
        (acc, row) => {
            const lainnya =
                Number(row.TOTAL_BIAYA || 0) -
                Number(row.PENDAFTARAN || 0) -
                Number(row.JASA_MEDIS || 0) -
                Number(row.OBAT || 0) -
                Number(row.RADIOLOGI || 0) -
                Number(row.LAB || 0);

            acc.totalBiaya += Number(row.TOTAL_BIAYA || 0);

            acc.pendaftaran += Number(row.PENDAFTARAN || 0);
            acc.jasaMedis += Number(row.JASA_MEDIS || 0);
            acc.obat += Number(row.OBAT || 0);
            acc.lab += Number(row.LAB || 0);
            acc.radiologi += Number(row.RADIOLOGI || 0);
            acc.lainnya += lainnya;

            acc.kas += Number(row.KAS || 0);
            acc.bank += Number(row.BANK || 0);
            acc.piutang += Number(row.PIUTANG || 0);

            return acc;
        },
        {
            totalBiaya: 0,

            pendaftaran: 0,
            jasaMedis: 0,
            obat: 0,
            lab: 0,
            radiologi: 0,
            lainnya: 0,

            kas: 0,
            bank: 0,
            piutang: 0,
        },
    );

    const totalDebet =
        summary.pendaftaran +
        summary.jasaMedis +
        summary.obat +
        summary.lab +
        summary.radiologi +
        summary.lainnya;

    const totalKredit = summary.kas + summary.bank + summary.piutang;

    const columns = [
        {
            title: "Tanggal",
            dataIndex: "FRPTGL",
            width: "80px",
            fixed: "left",
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
            width: "120px",
            fixed: "left",
            render: (_, record) => (
                <small>
                    {record?.FRPPASIEN_ID} <br />{" "}
                    {record?.FRPNOTRANSAKSIKJ}
                </small>
            ),
        },
        {
            title: "Nama Pasien",
            dataIndex: "NAMAPASIEN",
            align: "left",
            width: "200px",
            fixed: "left",
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
            width: "120px",
            render: (_, record) => (
                <small>
                    {record?.FRPCUSTOMER_ID} -{" "}
                    {record?.PENJAMIN}
                </small>
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
            width: "200px",
            render: (_, record) => (
                <small>
                    {RupiahFormat(record?.TOTAL_BIAYA)}
                </small>
            ),
        },
        {
            title: "Debet",
            children: [
                {
                    title: "Kas",
                    align: "right",
                    width: 120,
                    onHeaderCell: () => ({
                        style: {
                            textAlign: "center",
                        },
                    }),
                    render: (_, record) => (
                        <small>
                            {RupiahFormat(record.KAS)}
                        </small>
                    ),
                },
                {
                    title: "Bank",
                    align: "right",
                    width: 120,
                    onHeaderCell: () => ({
                        style: {
                            textAlign: "center",
                        },
                    }),
                    render: (_, record) => (
                        <small>
                            {RupiahFormat(record.BANK)}
                        </small>
                    ),
                },
                {
                    title: "Piutang",
                    align: "right",
                    width: 120,
                    onHeaderCell: () => ({
                        style: {
                            textAlign: "center",
                        },
                    }),
                    render: (_, record) => (
                        <small>
                            {RupiahFormat(record.PIUTANG)}
                        </small>
                    ),
                },
            ],
        },
        {
            title: "Kredit",
            onHeaderCell: () => ({
                style: {
                    textAlign: "center",
                },
            }),
            children: [
                {
                    title: "Pendaftaran",
                    align: "right",
                    width: 120,
                    onHeaderCell: () => ({
                        style: {
                            textAlign: "center",
                        },
                    }),
                    render: (_, record) => (
                        <small>
                            {RupiahFormat(record.PENDAFTARAN)}
                        </small>
                    ),
                },
                {
                    title: "Jasa Medis",
                    align: "right",
                    width: 120,
                    onHeaderCell: () => ({
                        style: {
                            textAlign: "center",
                        },
                    }),
                    render: (_, record) => (
                        <small>
                            {RupiahFormat(record.JASA_MEDIS)}
                        </small>
                    ),
                },
                {
                    title: "Obat",
                    align: "right",
                    width: 120,
                    onHeaderCell: () => ({
                        style: {
                            textAlign: "center",
                        },
                    }),
                    render: (_, record) => (
                        <small>
                            {RupiahFormat(record.OBAT)}
                        </small>
                    ),
                },
                {
                    title: "Lab",
                    align: "right",
                    width: 120,
                    onHeaderCell: () => ({
                        style: {
                            textAlign: "center",
                        },
                    }),
                    render: (_, record) => (
                        <small>
                            {RupiahFormat(record.LAB)}
                        </small>
                    ),
                },
                {
                    title: "Radiologi",
                    align: "right",
                    width: 120,
                    onHeaderCell: () => ({
                        style: {
                            textAlign: "center",
                        },
                    }),
                    render: (_, record) => (
                        <small>
                            {RupiahFormat(record.RADIOLOGI)}
                        </small>
                    ),
                },
                {
                    title: "Lainnya",
                    align: "right",
                    width: 120,
                    render: (_, record) => {
                        const lainnya =
                            Number(record.TOTAL_BIAYA || 0) -
                            Number(record.PENDAFTARAN || 0) -
                            Number(record.JASA_MEDIS || 0) -
                            Number(record.OBAT || 0) -
                            Number(record.RADIOLOGI || 0) -
                            Number(record.LAB || 0);

                        return (
                            <small>
                                {RupiahFormat(lainnya)}
                            </small>
                        );
                    },
                },
            ],
        }
    ]

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<p>Laporan Pendapatan Rajal</p>}
        >
            <Head title="Laporan Pendapatan Rajal" />
            <Card size={formSize} title="Laporan Pendapatan Rajal">
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
                    <Col span={3}>
                        <Typography.Text strong>Kasir</Typography.Text>
                        <Input
                            size={formSize}
                            allowClear
                            value={KasirFilter}
                            onChange={(e) => setKasirFilter(e.target.value)}
                            placeholder="Kasir"
                        />
                    </Col>

                    <Col span={4}>
                        <Typography.Text strong>Kode Dokter</Typography.Text>
                        <Input
                            size={formSize}
                            allowClear
                            value={DokterFilter}
                            onChange={(e) => setDokterFilter(e.target.value)}
                            placeholder="Kode Dokter"
                        />
                    </Col>

                    <Col span={4}>
                        <Typography.Text strong>Payor</Typography.Text>
                        <Input
                            size={formSize}
                            allowClear
                            value={PayorFilter}
                            onChange={(e) => setPayorFilter(e.target.value)}
                            placeholder="Kode Payor"
                        />
                        {/* <Select
                            style={{ width: "100%" }}
                            value={PayorFilter}
                            onChange={(value) => setPayorFilter(value)}
                            placeholder="Payor"
                        >
                            <Select.Option value="">Semua</Select.Option>
                        </Select> */}
                    </Col>

                    <Col span={4}>
                        <Typography.Text strong>Kode Poli</Typography.Text>
                        <Input
                            size={formSize}
                            allowClear
                            value={PoliFilter}
                            onChange={(e) => setPoliFilter(e.target.value)}
                            placeholder="Kode Poli"
                        />
                    </Col>

                    <Col span={2}>
                        <Typography.Text>&nbsp;</Typography.Text>
                        <Button block type="primary" onClick={handleSearch}
                            size={formSize}
                        >
                            Cari
                        </Button>
                    </Col>

                    <Col span={2}>
                        <Typography.Text>&nbsp;</Typography.Text>
                        <Button block onClick={handleReset}
                            size={formSize}
                        >
                            Reset
                        </Button>
                    </Col>
                </Row>

                <p>
                    Halaman: {page} | Per Halaman: {perPage} | Total data:{" "}
                    {totalData}.
                </p>

                <Table
                    bordered
                    scroll={{
                        x: 2000,
                        y: scrollY,
                    }}
                    dataSource={dataList}
                    columns={columns}
                    size="small"
                    loading={loading}
                    rowKey="FRPNOTRANSAKSIKJ"
                    pagination={{
                        current: page,
                        total: totalData,
                        pageSize: perPage,
                        showSizeChanger: true,
                        pageSizeOptions: [10, 25, 50, 100, 250, 500, 1000],
                        showTotal: (total) => `Total ${total} data`,
                    }}
                    onChange={handleTableChange}
                    summary={() => (
                        <Table.Summary>
                            {/* SUB TOTAL */}
                            <Table.Summary.Row>
                                <Table.Summary.Cell index={0}>
                                    <b>SUB TOTAL</b>
                                </Table.Summary.Cell>

                                <Table.Summary.Cell index={1} />
                                <Table.Summary.Cell index={2} />
                                <Table.Summary.Cell index={3} />
                                <Table.Summary.Cell index={4} />
                                <Table.Summary.Cell index={5} />
                                <Table.Summary.Cell index={6} />
                                <Table.Summary.Cell index={7} />

                                <Table.Summary.Cell index={8} align="right">
                                    <b>{RupiahFormat(summary.pendaftaran)}</b>
                                </Table.Summary.Cell>

                                <Table.Summary.Cell index={9} align="right">
                                    <b>{RupiahFormat(summary.jasaMedis)}</b>
                                </Table.Summary.Cell>

                                <Table.Summary.Cell index={10} align="right">
                                    <b>{RupiahFormat(summary.obat)}</b>
                                </Table.Summary.Cell>

                                <Table.Summary.Cell index={11} align="right">
                                    <b>{RupiahFormat(summary.lab)}</b>
                                </Table.Summary.Cell>

                                <Table.Summary.Cell index={12} align="right">
                                    <b>{RupiahFormat(summary.radiologi)}</b>
                                </Table.Summary.Cell>

                                <Table.Summary.Cell index={13} align="right">
                                    <b>{RupiahFormat(summary.lainnya)}</b>
                                </Table.Summary.Cell>

                                <Table.Summary.Cell index={14} align="right">
                                    <b>{RupiahFormat(summary.kas)}</b>
                                </Table.Summary.Cell>

                                <Table.Summary.Cell index={15} align="right">
                                    <b>{RupiahFormat(summary.bank)}</b>
                                </Table.Summary.Cell>

                                <Table.Summary.Cell index={16} align="right">
                                    <b>{RupiahFormat(summary.piutang)}</b>
                                </Table.Summary.Cell>
                            </Table.Summary.Row>

                            {/* GRAND TOTAL */}
                            <Table.Summary.Row>
                                <Table.Summary.Cell index={0}>
                                    <b>GRAND TOTAL</b>
                                </Table.Summary.Cell>

                                <Table.Summary.Cell index={1} />
                                <Table.Summary.Cell index={2} />
                                <Table.Summary.Cell index={3} />
                                <Table.Summary.Cell index={4} />
                                <Table.Summary.Cell index={5} />
                                <Table.Summary.Cell index={6} />
                                <Table.Summary.Cell index={7} />

                                <Table.Summary.Cell index={8} colSpan={6} align="right">
                                    <b>
                                        Kredit : {RupiahFormat(totalDebet)}
                                    </b>
                                </Table.Summary.Cell>

                                <Table.Summary.Cell index={14} colSpan={3} align="right">
                                    <b>
                                        Debet : {RupiahFormat(totalKredit)}
                                    </b>
                                </Table.Summary.Cell>
                            </Table.Summary.Row>
                        </Table.Summary>
                    )}
                />
            </Card>
        </AuthenticatedLayout>
    );
}
