'use client'

import React from 'react'
import { FaCheck } from 'react-icons/fa'
import styles from './CheckoutStepper.module.css'

export default function CheckoutStepper({ steps = [], currentStepId, completedStepIds = [], onStepClick }) {
    const currentIndex = Math.max(0, steps.findIndex((s) => s.id === currentStepId))
    const completedSet = new Set(completedStepIds)

    if (!steps.length) return null

    return (
        <nav className={styles.stepper} aria-label="Checkout steps">
            <ol className={styles.list}>
                {steps.map((step, index) => {
                    const isCompleted = completedSet.has(step.id) || index < currentIndex
                    const isActive = step.id === currentStepId
                    const isUpcoming = !isCompleted && !isActive
                    const canClick = typeof onStepClick === 'function' && (isCompleted || isActive)

                    return (
                        <React.Fragment key={step.id}>
                            {index > 0 && (
                                <li className={styles.chevronItem} aria-hidden>
                                    <span
                                        className={`${styles.chevron} ${
                                            isCompleted || isActive ? styles.chevronDone : ''
                                        }`}
                                    >
                                        ›
                                    </span>
                                </li>
                            )}
                            <li
                                className={[
                                    styles.item,
                                    isCompleted ? styles.completed : '',
                                    isActive ? styles.active : '',
                                    isUpcoming ? styles.upcoming : '',
                                ]
                                    .filter(Boolean)
                                    .join(' ')}
                            >
                                <button
                                    type="button"
                                    className={styles.stepBtn}
                                    disabled={!canClick}
                                    onClick={() => canClick && onStepClick(step.id)}
                                    aria-current={isActive ? 'step' : undefined}
                                >
                                    <span className={styles.circle}>
                                        {isCompleted && !isActive ? <FaCheck size={11} /> : index + 1}
                                    </span>
                                    <span className={styles.label}>{step.label}</span>
                                </button>
                            </li>
                        </React.Fragment>
                    )
                })}
            </ol>
        </nav>
    )
}
