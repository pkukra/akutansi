import React, { useState } from "react";
import {
    Modal,
    Descriptions,
    Table,
    Tag,
    Divider,
    Typography,
    Empty,
} from "antd";
import axios from "axios";
import dayjs from "dayjs";

const { Text } = Typography;

const Index = ({ children }) => {
    const [modalOpen, setModalOpen] = useState(false);
    const [loadingData, setLoadingData] = useState(false);
    const [data, setData] = useState([]);

    const fetchData = async (no_transaksi) => {
        setLoadingData(true);

        const paramObj = {
            no_transaksi,
        };

        try {
            const response = await axios.get(
                route("akt.pendapatan_rajal_jurnal_data"),
                {
                    params: paramObj,
                }
            );

            if (response?.data?.status === "ok") {
                setData(response?.data?.data || []);
            } else {
                message.error(
                    response?.data?.message ||
                    "Gagal mengambil data jurnal"
                );
            }
        } catch (error) {
            console.error(
                "Error fetching data jurnal:",
                error
            );

            message.error(
                error?.response?.data?.message ||
                "Gagal mengambil data jurnal"
            );
        } finally {
            setLoadingData(false);
        }
    };

    const handleModalOpen = () => {
        setModalOpen(true)
        fetchData(children)
        return;
    }

    const totalDebet = data?.reduce(
        (total, item) =>
            total +
            (item.details || []).reduce(
                (sum, detail) =>
                    sum + Number(detail.FDTDEBET || 0),
                0
            ),
        0
    );

    const totalKredit = data?.reduce(
        (total, item) =>
            total +
            (item.details || []).reduce(
                (sum, detail) =>
                    sum + Number(detail.FDTKREDIT || 0),
                0
            ),
        0
    );

    const isBalance = totalDebet === totalKredit;

    return (
        <>
            <a onClick={handleModalOpen}>
                {children}
            </a>

            <Modal
                destroyOnClose
                title='Detail Transaksi'
                open={modalOpen}
                onCancel={() => setModalOpen(false)}
                footer={null}
                width={1000}
                loading={loadingData}
            >
                {data?.length > 0 ? (
                    data.map((item, index) => (
                        <div key={index}>
                            {/* INFORMASI TRANSAKSI */}
                            <Descriptions
                                bordered
                                size="small"
                                column={3}
                            >
                                <Descriptions.Item label="No. Transaksi">
                                    <Text strong>
                                        {item.FRPNOTRANSAKSIKJ} / {item.FRPPASIEN_ID}
                                    </Text>
                                </Descriptions.Item>

                                <Descriptions.Item label="Unit">
                                    <small>{item.FMPKLINIKN}</small>
                                </Descriptions.Item>

                                <Descriptions.Item label="Customer">
                                    <Tag color="blue">
                                        {item.CUSTOMER_NAME}
                                    </Tag>
                                </Descriptions.Item>

                                <Descriptions.Item label="Dokter">
                                    <small>{item.FMDDOKTERN}</small>
                                </Descriptions.Item>

                                <Descriptions.Item label="Pasien">
                                    {item.FRPPASIEN_ID}
                                </Descriptions.Item>

                                <Descriptions.Item label="SEP">
                                    {item.SEP || "-"}
                                </Descriptions.Item>

                                <Descriptions.Item label="Status Balance">
                                    <Tag color={isBalance ? "green" : "red"}>
                                        {isBalance ? "BALANCE" : "TIDAK BALANCE"}
                                    </Tag>
                                </Descriptions.Item>

                                <Descriptions.Item label="Total Kredit">
                                    <Text strong>
                                        {totalDebet.toLocaleString("id-ID")}
                                    </Text>
                                </Descriptions.Item>

                                <Descriptions.Item label="Total Debet">
                                    <Text strong>
                                        {totalKredit.toLocaleString("id-ID")}
                                    </Text>
                                </Descriptions.Item>
                            </Descriptions>

                            <Divider orientation="left">
                                Detail Jurnal
                            </Divider>

                            {/* DETAIL JURNAL */}
                            <Table
                                size="small"
                                bordered
                                pagination={false}
                                dataSource={item.details || []}
                                rowKey={(record) =>
                                    record.FDTNOMER
                                }
                                scroll={{ x: 800 }}
                                columns={[
                                    {
                                        title: "No",
                                        dataIndex: "FDTNOMER",
                                        width: 60,
                                        align: "center",
                                    },
                                    {
                                        title: "Produk",
                                        dataIndex: "FMPPRODUKN",
                                        width: 220,
                                    },
                                    {
                                        title: "COA",
                                        dataIndex: "COA",
                                        width: 100,
                                        render: (value) =>
                                            value || "-",
                                    },
                                    {
                                        title: "Account",
                                        dataIndex:
                                            "ACCOUNT_DESCRIPTION",
                                        width: 200,
                                        render: (value) =>
                                            value || "-",
                                    },
                                    {
                                        title: "Qty",
                                        dataIndex: "FDTQTY",
                                        width: 70,
                                        align: "right",
                                    },
                                    {
                                        title: "Kredit",
                                        dataIndex: "FDTDEBET",
                                        width: 120,
                                        align: "right",
                                        render: (value) =>
                                            Number(value).toLocaleString(
                                                "id-ID"
                                            ),
                                    },
                                    {
                                        title: "Debet",
                                        dataIndex: "FDTKREDIT",
                                        width: 120,
                                        align: "right",
                                        render: (value) =>
                                            Number(value).toLocaleString(
                                                "id-ID"
                                            ),
                                    }
                                ]}
                            />
                        </div>
                    ))
                ) : (
                    <Empty description="Tidak ada data transaksi" />
                )}
            </Modal>
        </>
    );
};

export default Index;