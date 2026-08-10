import React, { useState } from "react";
import { Modal } from "antd";
import axios from "axios";
import dayjs from "dayjs";

const Index = ({ children }) => {
    const [modalOpen, setModalOpen] = useState(false);
    const [loadingData, setLoadingData] = useState(false);

    const fetchData = async (no_transaksi) => {
        setLoadingData(true);

        const paramObj = {
            page: 1,
            per_page: 1000,
            tanggal_awal: dayjs().format("YYYY-MM-DD"),
            tanggal_akhir: dayjs().format("YYYY-MM-DD"),
            no_transaksi,
        };

        try {
            const response =
                await axios.get(
                    route(
                        "akt.pendapatan_rajal_jurnal_data"
                    ),
                    {
                        params: paramObj,
                    }
                );

            console.log(response);
        } catch (error) {
            console.error("Error fetching hasil cppt:", error);
        } finally {
            setLoadingData(false);
        }
    };

    const handleModalOpen = () => {
        setModalOpen(true)
        fetchData(children)
        return;
    }

    return (
        <>
            <a onClick={handleModalOpen}>
                {children}
            </a>

            <Modal
                destroyOnClose
                title={"Detail Transaksi " + children}
                open={modalOpen}
                onCancel={() => setModalOpen(false)}
                footer={null}
                width={1000}
            >
                <p>
                    Kode: <strong>{children}</strong>
                </p>
            </Modal>
        </>
    );
};

export default Index;