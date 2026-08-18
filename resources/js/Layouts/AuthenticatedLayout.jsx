import React, { useState, useEffect } from "react";
import { Link, usePage } from "@inertiajs/react";
import {
    UserOutlined,
    LineChartOutlined,
    HomeOutlined,
    MonitorOutlined,
    PoweroffOutlined,
    ExperimentOutlined,
    AuditOutlined,
    ShoppingCartOutlined,
    FormOutlined,
    ReadOutlined,
    CopyOutlined
} from "@ant-design/icons";
import { Layout, Menu } from "antd";

const { Sider, Content, Footer } = Layout;

import './AuthenticatedLayout.css'

const items = [
    {
        key: "", // Root path
        icon: <HomeOutlined />,
        label: <a href={route("dashboard")}>Home</a>,
    },
    {
        key: "keu-parent",
        icon: <LineChartOutlined />,
        label: <a href={'#'}>KEUANGAN</a>,
        children: [
            {
                label: <a href={'#'}>Pendapatan</a>,
                children: [
                    {
                        key: "keu-pendapatan-rajal",
                        label: (
                            <a href={route("akt.pendapatan_rajal.index")}>Lap Pendapatan Rajal</a>
                        ),
                    },
                    {
                        key: "keu-penerimaan-rajal",
                        label: "Lap Penerimaan Rajal",
                    },
                    {
                        key: "keu-pendapatan-ranap",
                        label: "Lap Pendapatan Ranap",
                    },
                    {
                        key: "keu_penerimaan-ranap",
                        label: "Lap Penerimaan Ranap"
                    },
                    {
                        key: "lap-pindah-buku",
                        label: "Lap Pindah Buku"
                    },
                ]
            },
            {
                key: "pengeluaran",
                label: <a href={'#'}>pengeluaran</a>,
                children: [
                    {
                        key: "pembayaran-kas",
                        label: "Pembayaran Kas",
                    },
                    {
                        key: "pembayaran-bank",
                        label: "Pembayaran Bank",
                    },
                    {
                        key: "pengeluaran-pindah-buku",
                        label: "Pindah Buku",
                    },
                    {
                        key: "lap-pengeluaran-kas",
                        label: "Lap Pengeluaran Kas",
                    },
                    {
                        key: "lap-pengeluaran-bank",
                        label: "Lap Pengeluaran Bank",
                    },
                    {
                        key: "lap-pengeluaran-kas-dan-bank",
                        label: "Laporan pengeluaran Kas dan bank",
                    },
                    {
                        key: "buku-pembantu-hutang",
                        label: "Buku Pembantu Hutang",
                    },
                ]
            },
            {
                key: "akt.pendapatan_rajal_jurnal_index.index",
                label: (
                    <a href={route("akt.pendapatan_rajal_jurnal_index.index")}>Jurnal Pendapatan Rajal</a>
                ),
            },

        ],
    },
    {
        key: "farmasi",
        label: <a href={'#'}>FARMASI</a>,
        icon: <ExperimentOutlined />,
        children: [
            {
                key: "input-pembelian",
                label: "Input Pembelian",
            },
        ]
    },
    {
        key: "pembelian",
        label: "PEMBELIAN",
        icon: <ShoppingCartOutlined />,
        children: [
            {
                key: "lap-pembelian-rajal-obat-alkes",
                label: "Lap Pembelian Obat dan Alkes Rajal",
            },
            {
                key: "lap-pembelian-ranap-obat-alkes",
                label: "Lap Pembelian Obat dan Alkes Ranap",
            },
            {
                key: "lap-pembelian-logistik",
                label: "Lap Pembelian Logistik",
            },
        ]
    },
    {
        key: "hutang",
        label: "HUTANG",
        icon: <AuditOutlined />,
        children: [
            {
                key: "daftar-hutang-by-umur-hutang",
                label: "Daftar Hutang berdasarkan Jenis Hutang",
            },
            {
                key: "daftar-umur-hutang",
                label: "Daftar Umur Hutang",
            },
            {
                key: "mutasi-daftar-hutang",
                label: "Mutasi Daftar Hutang",
            },
            {
                key: "buku-bantu-hutang",
                label: "Buku Bantu Hutang",
            },
        ]
    },
    {
        key: "jurnal",
        icon: <FormOutlined />,
        label: "JURNAL",
        children: [
            {
                key: "Jurnal-Pendapatan-dan-Penerimaan-Rajal",
                label: (
                    <a href={route("akt.pendapatan_rajal_jurnal_index.index")}>Jurnal Pendapatan dan Penerimaan Rajal</a>
                ),
            },
            {
                key: "Jurnal-Pendapatan-dan-Penerimaan-Ranap",
                label: "Jurnal Pendapatan dan Penerimaan Ranap",
            },
            {
                key: "Jurnal-Pembelian-dan-Pengeluaran-Rawat-Jalan",
                label: "Jurnal Pembelian dan Pengeluaran Rawat Jalan",
            },
            {
                key: "Jurnal-Pembelian-dan-Pengeluaran-Rawat-Inap",
                label: "Jurnal Pembelian dan Pengeluaran Rawat Inap",
            },
            {
                key: "Jurnal-Umum",
                label: "Jurnal Umum",
                children: [
                    {
                        key: "Pindah-Buku-Kas-ke-bank",
                        label: "Pindah Buku Kas ke bank",
                    },
                    {
                        key: "Pindah-Buku-Bank-ke-Kas",
                        label: "Pindah Buku Bank ke Kas",
                    },
                    {
                        key: "Pindah-Buku-Bank-Ke-Bank",
                        label: "Pindah Buku Bank Ke Bank",
                    },
                    {
                        key: "Pindah-Buku-Kas-ke-Kas",
                        label: "Pindah Buku Kas ke Kas",
                    },
                ]
            },
        ]
    },
    {
        key: "buku-bantu",
        icon: <CopyOutlined />,
        label: "BUKU BANTU",
        children: [
            {
                key: "Buku-Pembantu-Piutang",
                label: "Buku Pembantu Piutang",
            },
            {
                key: "Buku-Pembantu-Hutang",
                label: "Buku Pembantu Hutang",
            },
            {
                key: "Buku-Pembantu-Persediaan",
                label: "Buku Pembantu Persediaan",
            },
            {
                key: "Daftar-Piutang",
                label: "Daftar Piutang",
            },
        ]
    },
    {
        key: "buku-besar",
        icon: <ReadOutlined />,
        label: "BUKU Besar",
        children: [
            {
                key: "Sub-Sub-Buku-Besar",
                label: "Sub Sub Buku Besar",
            },
            {
                key: "Sub-Buku-Besar",
                label: "Sub Buku Besar",
            },
            {
                key: "Buku Besar",
                label: "Buku Besar",
            },
            {
                key: "Mutasi Buku Besar",
                label: "Mutasi Buku Besar",
            },
        ]
    },
    {
        key: "profile",
        icon: <UserOutlined />,
        label: <a href={route("profile.edit")}>Profile</a>,
    },
    {
        key: "logout",
        icon: <PoweroffOutlined />,
        label: <a href={route("logout")}>Logout</a>,
    },
];

const App = ({ children }) => {
    const [collapsed, setCollapsed] = useState(false);
    const { url } = usePage(); // Dapatkan URL dari Inertia.js

    useEffect(() => {
        const savedCollapsed = localStorage.getItem("collapsed");
        if (savedCollapsed !== null) {
            setCollapsed(JSON.parse(savedCollapsed));
        }
    }, []);

    const handleCollapseChange = (value) => {
        setCollapsed(value);
        localStorage.setItem("collapsed", JSON.stringify(value));
    };

    const currentKey = url.split("/")[3] || "";


    return (
        <Layout style={{ minHeight: "100vh" }}>
            <Sider
                collapsible
                collapsed={collapsed}
                onCollapse={handleCollapseChange}
                width={250}
                collapsedWidth={80}
            >
                <div className="demo-logo-vertical" />
                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={[currentKey]}
                    items={items}
                />
            </Sider>
            <Layout>
                <Content style={{ margin: "16px" }}>{children}</Content>
            </Layout>
        </Layout>
    );
};

export default App;
