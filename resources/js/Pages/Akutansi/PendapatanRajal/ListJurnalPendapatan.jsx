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
    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<p>List Jurnal Pemdapatan </p>}
        >
            <Head title="Laporan Pendapatan Rajal" />
            <>

                List Jurnal Pemdapatan per range
            </>
        </AuthenticatedLayout>
    );
}