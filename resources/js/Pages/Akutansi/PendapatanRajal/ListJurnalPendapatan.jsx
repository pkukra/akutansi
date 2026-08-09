import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import {
    Card,
    Button,
    Table,
    Row,
    Col,
    Typography,
    DatePicker,
} from "antd";
const { RangePicker } = DatePicker;

import axios from "axios";
import dayjs from "dayjs";

const RupiahFormat = (x) => {
    const number = Number(x || 0);

    return new Intl.NumberFormat("id-ID").format(number);
};

export default function Index({ auth }) {
    const [formSize, setFormSize] = useState("medium");

    // =========================================================
    // PARAM INIT
    // =========================================================
    const queryParams = new URLSearchParams(window.location.search);

    const initialPage = parseInt(queryParams.get("page")) || 1;
    const initialPerPage =
        parseInt(queryParams.get("per_page")) || 100;

    const initialTanggalAwal =
        queryParams.get("tanggal_awal") ||
        dayjs().subtract(6, "day").format("YYYY-MM-DD");

    const initialTanggalAkhir =
        queryParams.get("tanggal_akhir") ||
        dayjs().format("YYYY-MM-DD");

    // =========================================================
    // STATE
    // =========================================================
    const [page, setPage] = useState(initialPage);
    const [perPage, setPerPage] = useState(initialPerPage);

    const [loading, setLoading] = useState(false);

    const [dataList, setDataList] = useState([]);
    const [totalData, setTotalData] = useState(0);

    const [tanggalRange, setTanggalRange] = useState([
        dayjs(initialTanggalAwal),
        dayjs(initialTanggalAkhir),
    ]);

    // =========================================================
    // BUILD QUERY PARAMS
    // =========================================================
    const buildQueryParams = (params) => {
        const query = new URLSearchParams();

        Object.entries(params).forEach(([key, value]) => {
            if (
                value !== null &&
                value !== "" &&
                value !== undefined
            ) {
                query.set(key, value);
            }
        });

        return query.toString();
    };

    // =========================================================
    // DISABLE FUTURE DATE
    // =========================================================
    const disableFutureDate = (current) => {
        return (
            current &&
            current.endOf("day").isAfter(dayjs())
        );
    };

    // =========================================================
    // SEARCH
    // =========================================================
    const handleSearch = () => {
        const paramObj = {
            page: 1,
            per_page: perPage,
            tanggal_awal:
                tanggalRange?.[0]?.format("YYYY-MM-DD"),
            tanggal_akhir:
                tanggalRange?.[1]?.format("YYYY-MM-DD"),
        };

        const queryStr = buildQueryParams(paramObj);

        window.history.replaceState(
            null,
            "",
            `?${queryStr}`
        );

        setPage(1);

        fetchDataList(1, perPage);
    };

    // =========================================================
    // FETCH DATA
    // =========================================================
    const fetchDataList = async (
        pageVal = page,
        perPageVal = perPage
    ) => {
        setLoading(true);

        try {
            const paramObj = {
                page: pageVal,
                per_page: perPageVal,
                tanggal_awal:
                    tanggalRange?.[0]?.format("YYYY-MM-DD"),
                tanggal_akhir:
                    tanggalRange?.[1]?.format("YYYY-MM-DD"),
            };

            const queryStr = buildQueryParams(paramObj);

            window.history.replaceState(
                null,
                "",
                `?${queryStr}`
            );

            const response = await axios.get(
                route(
                    "akt.pendapatan_rajal_jurnal_data"
                ),
                {
                    params: paramObj,
                }
            );

            console.log("Response:", response?.data);

            setDataList(response?.data?.data || []);

            setTotalData(
                response?.data?.count || 0
            );
        } catch (error) {
            console.error(
                "Error fetching data: ",
                error
            );
        } finally {
            setLoading(false);
        }
    };

    // =========================================================
    // RESET
    // =========================================================
    const handleReset = () => {
        window.location.replace(
            route(
                "akt.pendapatan_rajal_jurnal_index.index"
            )
        );
    };

    // =========================================================
    // BENTUK DATA JURNAL
    // =========================================================
    //
    // Contoh:
    //
    // 411.2103 = 75.000
    // 411.2111 = 20.000
    // 411.2113 = 14.800
    // 411.2113 = 44.100
    //
    // akan menjadi:
    //
    // 411.2103 = 75.000
    // 411.2111 = 20.000
    // 411.2113 = 58.900
    //
    // =========================================================
    const jurnalData = React.useMemo(() => {
        const grouped = {};

        dataList.forEach((transaksi) => {
            const details = transaksi?.details || [];

            details.forEach((detail) => {
                const coa = detail?.COA || "";

                /*
                 * Jika COA kosong dan transaksi KR,
                 * kita jadikan sebagai akun penerimaan.
                 */
                const groupKey =
                    coa ||
                    `PENERIMAAN_${detail?.FDTJENISTRANSAKSI}`;

                if (!grouped[groupKey]) {
                    grouped[groupKey] = {
                        key: groupKey,
                        coa: coa || "-",
                        account:
                            detail?.ACCOUNT_DESCRIPTION ||
                            (detail?.FDTJENISTRANSAKSI ===
                                "KR"
                                ? "Penerimaan Pendapatan RJ"
                                : "-"),
                        keterangan:
                            detail?.FDTJENISTRANSAKSI ===
                                "KR"
                                ? "Penerimaan pendapatan RJ harian"
                                : "",
                        debet: 0,
                        kredit: 0,
                    };
                }

                grouped[groupKey].debet += Number(
                    detail?.FDTDEBET || 0
                );

                grouped[groupKey].kredit += Number(
                    detail?.FDTKREDIT || 0
                );
            });
        });

        return Object.values(grouped);
    }, [dataList]);

    // =========================================================
    // TOTAL
    // =========================================================
    const totalDebet = jurnalData.reduce(
        (total, item) =>
            total + Number(item.debet || 0),
        0
    );

    const totalKredit = jurnalData.reduce(
        (total, item) =>
            total + Number(item.kredit || 0),
        0
    );

    // =========================================================
    // TABLE COLUMNS
    // =========================================================
    const columns = [
        {
            title: "COA",
            dataIndex: "coa",
            key: "coa",
            width: 120,
        },
        {
            title: "Account",
            dataIndex: "account",
            key: "account",
            width: 250,
        },
        {
            title: "Keterangan",
            dataIndex: "keterangan",
            key: "keterangan",
        },
        {
            title: "Debet",
            dataIndex: "debet",
            key: "debet",
            width: 160,
            align: "right",
            render: (value) => {
                return value > 0
                    ? RupiahFormat(value)
                    : "";
            },
        },
        {
            title: "Kredit",
            dataIndex: "kredit",
            key: "kredit",
            width: 160,
            align: "right",
            render: (value) => {
                return value > 0
                    ? RupiahFormat(value)
                    : "";
            },
        },
    ];

    // =========================================================
    // RETURN
    // =========================================================
    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <p>Jurnal Pendapatan Rawat Jalan</p>
            }
        >
            <Head title="Jurnal Pendapatan Rawat Jalan" />

            <Card>
                {/* =====================================================
                    FILTER
                ====================================================== */}
                <Row
                    gutter={16}
                    style={{
                        marginBottom: 10,
                    }}
                >
                    <Col span={6}>
                        <Typography.Text strong>
                            Tanggal
                        </Typography.Text>

                        <RangePicker
                            size={formSize}
                            style={{
                                width: "100%",
                            }}
                            value={tanggalRange}
                            format="YYYY-MM-DD"
                            disabledDate={
                                disableFutureDate
                            }
                            onChange={(dates) => {
                                if (!dates) {
                                    setTanggalRange([
                                        dayjs().subtract(
                                            6,
                                            "day"
                                        ),
                                        dayjs(),
                                    ]);

                                    return;
                                }

                                setTanggalRange(
                                    dates
                                );
                            }}
                        />
                    </Col>

                    <Col span={2}>
                        <Typography.Text>
                            &nbsp;
                        </Typography.Text>

                        <Button
                            block
                            type="primary"
                            onClick={handleSearch}
                            size={formSize}
                        >
                            Cari
                        </Button>
                    </Col>

                    <Col span={2}>
                        <Typography.Text>
                            &nbsp;
                        </Typography.Text>

                        <Button
                            block
                            onClick={handleReset}
                            size={formSize}
                        >
                            Reset
                        </Button>
                    </Col>
                </Row>

                {/* =====================================================
                    INFO
                ====================================================== */}
                <div
                    style={{
                        marginBottom: 10,
                    }}
                >
                    <Typography.Text>
                        Halaman: {page} | Per Halaman:{" "}
                        {perPage} | Total data:{" "}
                        {totalData}
                    </Typography.Text>
                </div>

                {/* =====================================================
                    JURNAL
                ====================================================== */}
                <Table
                    bordered
                    size="small"
                    loading={loading}
                    columns={columns}
                    dataSource={jurnalData}
                    pagination={false}
                    rowKey="key"
                    scroll={{
                        x: 900,
                    }}
                    summary={() => (
                        <Table.Summary.Row>
                            <Table.Summary.Cell
                                index={0}
                            />

                            <Table.Summary.Cell
                                index={1}
                            >
                                <strong>
                                    TOTAL
                                </strong>
                            </Table.Summary.Cell>

                            <Table.Summary.Cell
                                index={2}
                            />

                            <Table.Summary.Cell
                                index={3}
                                align="right"
                            >
                                <strong>
                                    {RupiahFormat(
                                        totalDebet
                                    )}
                                </strong>
                            </Table.Summary.Cell>

                            <Table.Summary.Cell
                                index={4}
                                align="right"
                            >
                                <strong>
                                    {RupiahFormat(
                                        totalKredit
                                    )}
                                </strong>
                            </Table.Summary.Cell>
                        </Table.Summary.Row>
                    )}
                />

                {/* =====================================================
                    STATUS BALANCE
                ====================================================== */}
                <div
                    style={{
                        marginTop: 12,
                        textAlign: "right",
                    }}
                >
                    <Typography.Text
                        strong
                        type={
                            totalDebet ===
                                totalKredit
                                ? "success"
                                : "danger"
                        }
                    >
                        {totalDebet ===
                            totalKredit
                            ? "✓ Jurnal Balance"
                            : "⚠ Jurnal Tidak Balance"}
                    </Typography.Text>
                </div>
            </Card>
        </AuthenticatedLayout>
    );
}