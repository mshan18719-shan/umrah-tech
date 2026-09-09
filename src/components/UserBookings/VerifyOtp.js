'use client'
import React, { useState } from 'react'
import OtpInput from 'react-otp-input';
import { Lora } from 'next/font/google';
import { notifications } from '@mantine/notifications';

const lora = Lora({
    weight : '400',
    subsets : ['latin']
})
export default function VerifyOtp({ step, setStep, email, startExpiryTimer }) {
    const [otp, setOtp] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const handleChange = (value) => {
        setOtp(value);
        setError('');
    };
    const handleVerifyOtp = async () => {
        if (!otp || otp.length !== 5) {
            setError('Please enter a valid 5-digit OTP.')
            return
        }
        setIsLoading(true);
        try {
            const responses = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/otp/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // 'ngrok-skip-browser-warning': 'true',
                },
                body: JSON.stringify({ "holder_email": email, "otp": otp }),
            });
            const res = await responses.json();
            setIsLoading(false);
            if (res.success) {
                notifications.show({
                    autoClose: 2000,
                    title: "Success",
                    message: res?.message,
                    color: "green",
                });
                const expiryTime = new Date(Date.now() + 30 * 60 * 1000)
                localStorage.setItem('booking_expiry', expiryTime)
                setStep(2);
                startExpiryTimer();
            } else {
                setError(res?.message)
            }
        } catch (err) {
            setIsLoading(false);
            console.error("Error fetching hotel details:", err);
        }
    };
    const handleChangeEmail = () => {
        setStep(step - 1);
    };
    return (
        <div>
            <h3 className={`fw-bold mb-3 text-center ${lora.className}`}>Enter OTP</h3>
            <p className="text-muted text-center small mb-4">We’ve sent a 5-digit OTP to your email to verify your identity. Please enter the code below to access your bookings.</p>
            <OtpInput
                value={otp}
                onChange={handleChange}
                numInputs={5}
                inputType="text"
                renderSeparator={<span>-</span>}
                renderInput={(props) => <input {...props} />}
                shouldAutoFocus
                containerStyle={{ justifyContent: 'center', gap: '8px' }}
                inputStyle={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '8px',
                    border: '1px solid #ccc',
                    fontSize: '18px',
                    textAlign: 'center',
                    outline: 'none',
                    marginBottom : '1.5em'
                }}
            />
            {error && <p className='small text-danger text-center'>{error}</p>}
            <div onClick={handleChangeEmail} className='small text-end text-primary mb-1 cursor-pointer'>Change email?</div>
            <button onClick={handleVerifyOtp} type="submit" className='btn btn-success w-100'>
                {isLoading ? (
                    <div className="spinner-border spinner-border-sm text-light" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                ) : (
                    'Verify'
                )}
            </button>
        </div>
    )
}
