'use client'
import React, { useState, useEffect, useRef } from 'react';
import { FaCheck } from 'react-icons/fa';
import HotelsDetail from '@/components/UmrahGetAway/Detail/HotelsDetail';
import FlightSelection from '@/components/UmrahGetAway/Detail/FlightSelection';
import OtherServices from '../../../components/UmrahGetAway/Detail/OtherServices';
import Umrah_Getaway_Detail_Loader from '@/components/Loader/Umrah_Getaway_Detail_Loader';
import { BiInfoCircle } from 'react-icons/bi';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { UmrahPackageProvider, useUmrahPackage } from '@/contexts/UmrahPackageContext';
import style from './selection.module.css';

function UmrahSelectionContent() {
    const [currentStep, setCurrentStep] = useState(1);
    const [visitedSteps, setVisitedSteps] = useState([1]);
    const topRef = useRef(null);
    const router = useRouter();

    useEffect(() => {
        topRef.current?.scrollIntoView({ behavior: 'instant', block: 'start' });
    }, [currentStep]);

    const { packageData, isLoading } = useUmrahPackage();

    const steps = [
        { id: 1, title: 'Makkah Hotel', shortTitle: 'Makkah' },
        { id: 2, title: 'Madinah Hotel', shortTitle: 'Madinah' },
        { id: 3, title: 'Select Flight', shortTitle: 'Flights' },
        { id: 4, title: 'Other Services', shortTitle: 'Services' },
        { id: 5, title: 'Checkout', shortTitle: 'Checkout', external: true },
    ];

    const goToStep = (stepId) => {
        if (!visitedSteps.includes(stepId)) {
            setVisitedSteps((prev) => [...prev, stepId]);
        }
        setCurrentStep(stepId);
    };

    const handleStepClick = (stepId) => {
        const step = steps.find((item) => item.id === stepId);
        if (step?.external) return;
        if (visitedSteps.includes(stepId)) {
            setCurrentStep(stepId);
        }
    };

    return (
        <div className='Umrah-getaway-detail-wrap'>
            <div ref={topRef} />
            {isLoading ? <Umrah_Getaway_Detail_Loader /> : (
                <div className='container my-5'>
                    {!packageData || Object.keys(packageData).length === 0 ? (
                        <div className="text-center p-5">
                            <div className="mb-3">
                                <BiInfoCircle className="text-danger fs-1" />
                            </div>

                            <h4 className="fw-semibold text-danger">
                                Package Not Available
                            </h4>

                            <p className="text-muted mt-2 mb-4">
                                We couldn’t find the details for this package.
                                It may no longer be available or the information has expired.
                                Please go back and choose another package to continue your journey.
                            </p>

                            <button
                                className="btn btn-outline-danger px-4"
                                onClick={() => router.back()}
                            >
                                ← Go Back to Packages
                            </button>
                        </div>

                    ) : (
                        <div>
                            <div className={style.stepper}>
                                <div className={style.stepperRow}>
                                    {steps.map((step, idx) => {
                                        const isActive = currentStep === step.id;
                                        const isCompleted = visitedSteps.includes(step.id) && !isActive;
                                        const isLocked = step.external || !visitedSteps.includes(step.id);

                                        return (
                                            <React.Fragment key={step.id}>
                                                {idx > 0 && (
                                                    <span
                                                        className={`${style.chevron} ${isCompleted || isActive ? style.chevronDone : ''}`}
                                                        aria-hidden="true"
                                                    >
                                                        ›
                                                    </span>
                                                )}
                                                <button
                                                    type="button"
                                                    className={[
                                                        style.stepItem,
                                                        isActive ? style.stepActive : '',
                                                        isCompleted ? style.stepCompleted : '',
                                                        isLocked ? style.stepLocked : '',
                                                    ].filter(Boolean).join(' ')}
                                                    onClick={() => handleStepClick(step.id)}
                                                    disabled={isLocked}
                                                    aria-current={isActive ? 'step' : undefined}
                                                    aria-label={`${step.title}${isActive ? ' (current)' : ''}${isLocked ? ' (locked)' : ''}`}
                                                >
                                                    <span className={style.stepBadge}>
                                                        {isCompleted ? <FaCheck size={12} /> : step.id}
                                                    </span>
                                                    <span className={style.stepLabel}>{step.shortTitle}</span>
                                                </button>
                                            </React.Fragment>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className='mt-4'>
                                {currentStep === 1 && (
                                    <HotelsDetail
                                        type="makkah"
                                        detail={packageData?.makkah_hotel || {}}
                                        onNext={() => goToStep(currentStep + 1)}
                                    />
                                )}

                                {currentStep === 2 && (
                                    <HotelsDetail
                                        type="madinah"
                                        detail={packageData?.madinah_hotel || {}}
                                        onNext={() => goToStep(currentStep + 1)}
                                    />
                                )}

                                {currentStep === 3 && (
                                    <FlightSelection
                                        detail={packageData?.flight || {}}
                                        requestinfo={packageData?.details_request_info || {}}
                                        onNext={() => goToStep(currentStep + 1)}
                                    />
                                )}

                                {currentStep === 4 && (
                                    <OtherServices />
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default function Page() {
    const searchParams = useSearchParams();
    const packageId = searchParams.get('packageId');

    if (!packageId) {
        return (
            <div className='container my-5 text-center'>
                <BiInfoCircle className="text-danger fs-1" />
                <h4 className="fw-semibold text-danger mt-3">
                    Package ID Missing
                </h4>
                <p className="text-muted">Please provide a valid package ID to continue.</p>
            </div>
        );
    }

    return (
        <UmrahPackageProvider packageId={packageId}>
            <UmrahSelectionContent />
        </UmrahPackageProvider>
    )
}
