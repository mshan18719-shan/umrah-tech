'use client'
import React from 'react'
import PriceDisplay from '@/components/Currency/PriceDisplay'
export default function AdditionalServices({ Services, currency, selectedServices, setSelectedServices, setServicesTotal }) {

    const handleServiceToggle = (service) => {
        const isSelected = selectedServices.find((s) => s.name === service.name);
        if (isSelected) {
            // Remove if already selected
            const updatedServices = selectedServices.filter((s) => s.name !== service.name);
            const Total = updatedServices.reduce((acc, curr) => acc + Number(curr.total), 0)
            setServicesTotal(Total);
            setSelectedServices(updatedServices);
        } else {
            // Add if not selected
            const newService = {
                "name": service.name,
                "type": service.type,
                "price": service.price,
                "quantity": 1,
                "total": Number(service.price)
            };
            const updatedServices = [...selectedServices, newService];
            const Total = updatedServices.reduce((acc, curr) => acc + Number(curr.total), 0)
            setServicesTotal(Total);
            setSelectedServices(updatedServices);
        }

    };
    const handleQuantityChange = (serviceName, changeType) => {
        const updatedServices = selectedServices.map((service) => {
            if (service.name === serviceName) {
                if (changeType === 'plus') {
                    const newQty = service.quantity + 1;
                    return { ...service, quantity: newQty, total: newQty * Number(service.price) };
                } else if (changeType === 'minus' && service.quantity > 1) {
                    const newQty = service.quantity - 1;
                    return { ...service, quantity: newQty, total: newQty * Number(service.price) };
                }
            }
            return service;
        });
        const Total = updatedServices.reduce((acc, curr) => acc + Number(curr.total), 0)
        setServicesTotal(Total);
        setSelectedServices(updatedServices);
    }
    // console.log(selectedServices)
    return (
        <div>
            <div className='mt-3 border p-3 rounded'>
                <h5 className='mb-0'>Additional Services</h5>
                <p className='small text-muted'>Enhance your journey with optional services</p>
                {Services.map((service, index) => (
                    <div key={index} className='border p-2 rounded mb-2'>
                        <div className='d-flex justify-content-between align-items-center'>
                            <div className="form-check form-switch">
                                <input onChange={() => handleServiceToggle(service)} checked={selectedServices.some(s => s.name === service.name)} className="form-check-input" type="checkbox" role="switch" id={`switchCheckDefault-${index+1}`} />
                                <label className="form-check-label" htmlFor={`switchCheckDefault-${index+1}`}>{service?.name}</label>
                            </div>
                            <div >
                                <div className='text-success mb-0'><PriceDisplay price={service.price} currency={currency} /></div>
                                <div className='small text-muted'>{service.type === 'per_person' ? 'per person' : 'per booking'}</div>
                            </div>
                        </div>
                        {selectedServices.some(s => s.name === service.name) && service.type === 'per_person' && (
                            <div className="quantity-box d-flex align-items-center justify-content-between mt-2">
                                <button onClick={() => handleQuantityChange(service.name, 'minus')} className="btn-qty minus">−</button>
                                <span className="qty-value">{selectedServices.find(s => s.name === service.name)?.quantity}</span>
                                <button onClick={() => handleQuantityChange(service.name, 'plus')} className="btn-qty plus">+</button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
