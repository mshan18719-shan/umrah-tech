'use client'
import React, { useState, useEffect } from 'react'
import styles from './booking.module.css';
import VerifyOtp from '@/components/UserBookings/VerifyOtp';
import Bookings from '@/components/UserBookings/Bookings';
import { notifications } from '@mantine/notifications';
import { Lora } from 'next/font/google';

const lora = Lora({
    weight : '400',
    subsets : ['latin']
})
export default function page() {
    const [step, setStep] = useState(0);
    const [email, setEmail] = useState('')
    const [timer, setTimer] = useState(null)
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    // ✅ Load step and booking expiry time from localStorage
    useEffect(() => {
        const savedStep = localStorage.getItem('booking_step')
        const bookingExpiry = localStorage.getItem('booking_expiry')
        const userEmail = localStorage.getItem('user_email');
        if(userEmail){
            setEmail(userEmail);
        }
        if (savedStep) setStep(Number(savedStep))

        // If user is on bookings step, check expiry
        if (savedStep === '2' && bookingExpiry) {
            const expiryTime = new Date(bookingExpiry)
            if (expiryTime < new Date()) {
                resetToStep0()
            } else {
                const timeLeft = expiryTime - new Date()
                startExpiryTimer(timeLeft)
            }
        }
    }, [])

    // ✅ Step persistence
    useEffect(() => {
        localStorage.setItem('booking_step', step)
    }, [step])

    // ✅ Timer handler for 30-min expiry
    const startExpiryTimer = (timeLeft = 30 * 60 * 1000) => {
        clearTimeout(timer)
        const newTimer = setTimeout(() => {
            resetToStep0()
        }, timeLeft)
        setTimer(newTimer)
    };

    // ✅ Reset everything back to step 0
    const resetToStep0 = () => {
        localStorage.removeItem('booking_expiry')
        localStorage.removeItem('user_email')
        localStorage.setItem('booking_step', 0)
        setStep(0)
        setEmail('')
    };

    // ✅ Simulate API call to send OTP
    const handleSendOtp = async (e) => {
        e.preventDefault();
        if (email === '') {
            setError('Please enter a email address.')
            return
        } else if (!email.trim() || !email.includes('@')) {
            setError('Please enter a valid email address.')
            return
        }
        setIsLoading(true);
        try {
            const responses = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/otp/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // 'ngrok-skip-browser-warning': 'true',
                },
                body: JSON.stringify({ "holder_email": email }),
            });
            const res = await responses.json();
            setIsLoading(false);
            if (res.success) {
                localStorage.setItem('user_email' , email);
                notifications.show({
                    autoClose: 2000,
                    title: "Success",
                    message: res?.message,
                    color: "green",
                });
                setStep(1);
            } else {
                setError(res?.message)
            }
        } catch (err) {
            setIsLoading(false);
            console.error("Error fetching hotel details:", err);
        }
    };
    const handleEmailChange = (e) => {
        setEmail(e.target.value);
        setError('');
    }
    return (
        <>
            {(step === 0 || step === 1) && (
                <div className={`container-fluid ${styles.loginContainer}`}>
                    <div className="row align-items-center min-vh-100">
                        <div className="col-lg-12 d-flex justify-content-center">
                            {step === 0 && (
                                <div className={`card p-4 p-md-5 shadow-lg border-0 ${styles.loginCard}`}>
                                    <h3 className={`fw-bold mb-3 text-center ${lora.className}`}>Verify Your Email Address</h3>
                                    <p className="text-muted text-center small mb-4">For your security, we’ve emailed you an OTP to verify your identity.</p>
                                    <form onSubmit={handleSendOtp}>
                                        <div className="mb-3">
                                            <input type="email" autoComplete='off' autoCorrect='off' id="verifyemail" value={email} onChange={handleEmailChange} className="form-control" placeholder="Enter your email" required />
                                        </div>
                                        {error && <p className='small text-danger text-center'>{error}</p>}
                                        <button type="submit" className={`btn w-100 btn-success`}>
                                            {isLoading ? (
                                                <div className="spinner-border spinner-border-sm text-light" role="status">
                                                    <span className="visually-hidden">Loading...</span>
                                                </div>
                                            ) : (
                                                'Submit'
                                            )}
                                        </button>
                                    </form>
                                </div>
                            )}
                            {step === 1 && (
                                <div className={`card p-4 p-md-5 shadow-lg border-0 ${styles.loginCard}`}>
                                    <VerifyOtp setStep={setStep} step={step} email={email} startExpiryTimer={startExpiryTimer}/>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {step === 2 && (
                <Bookings email={email} resetToStep0={resetToStep0}/>
            )}
        </>
    )
}
