'use client'
import React, { useEffect, useState } from 'react'
import { Dialog, Text } from '@mantine/core';
import { PiClockClockwiseLight } from 'react-icons/pi';
export default function LeadDetail({ setFormData, module }) {
    const [opened, setOpened] = useState(false);
    const [leadData, setLeadData] = useState({
        title: "",
        address: "",
        firstName: "",
        lastName: "",
        email: "",
        country: "",
        phoneCode: "",
        phone: "",
        requests: "",
        gender: "male",
        terms: false,
    });
    useEffect(() => {
        const data = JSON.parse(localStorage.getItem('lead_details_fill') || 'null');
        if (data && data.title) {
            setLeadData(data);
            setOpened(true);
        }

    }, []);
    const handleLeadFill = () => {
        if (module === "flight") {
            setFormData({
                title: leadData.title,
                firstName: leadData.firstName,
                lastName: leadData.lastName,
                email: leadData.email,
                dob: leadData.dob,
                gender: leadData.gender,
                country: leadData.country,
                phoneCode: leadData.phoneCode,
                phone: leadData.phone,
                // passportNumber: '',
                // passportExpiry: '',
                type: 'adult'
            });
        } else {
            setFormData({
                title: leadData.title,
                address: leadData.address,
                firstName: leadData.firstName,
                lastName: leadData.lastName,
                email: leadData.email,
                country: leadData.country,
                phoneCode: leadData.phoneCode,
                phone: leadData.phone,
                requests: '',
                gender: leadData.gender,
                terms: false,
            });

        }
        setOpened(false);
    }
    return (
        <div>
            <Dialog opened={opened} className='border border-success' withCloseButton onClose={() => setOpened(false)} position={{ bottom: 20, right: '5%' }} size="lg" radius="md">
                <Text size="sm" mb="xs" fw={500}>
                    <PiClockClockwiseLight /> Lead Detail <span className="small bg-success-subtle text-success px-2 rounded px-1">recent</span>
                </Text>

                <div className='small d-flex justify-content-between align-items-center'>
                    <div>Name:</div>
                    <div>{leadData?.title} {leadData?.firstName} {leadData?.lastName}</div>
                </div>
                <div className='small d-flex justify-content-between align-items-center'>
                    <div>Email:</div>
                    <div>{leadData?.email} </div>
                </div>
                <button onClick={handleLeadFill} className='btn mt-1 btn-success btn-sm w-100'>Enter Details</button>
            </Dialog>
        </div>
    )
}
