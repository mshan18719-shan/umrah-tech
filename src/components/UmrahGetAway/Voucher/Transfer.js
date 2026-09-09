import React from 'react'
import styles from '../Checkout/Checkout.module.css';
import { FaBus, FaCar } from 'react-icons/fa';
import { GiGearStickPattern } from 'react-icons/gi';
export default function Transfer({ TransferData }) {

  const capitalizeFirstLetter = (str) => {
    if (!str || typeof str !== "string") return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  return (
    <div>
      {TransferData.map((transfer, index) => (
        <div key={index} style={{ borderBottom: '1px solid #e8e8e8', marginTop: '0' }}>
          <div style={{ background: '#004c4c', color: '#ffffff', padding: '0.65rem 1.5rem', fontSize: '0.74rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, background: '#c49a2a', borderRadius: 4, flexShrink: 0 }}>
              <FaBus size={12} />
            </span>
            TRANSFER DETAILS
            <span style={{ flex: 1, height: 1, background: 'linear-gradient(to right, rgba(255,255,255,0.45), rgba(255,255,255,0))' }} />
          </div>

          {/* Vehicle info card */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1.5rem', background: '#f9f9f9', borderBottom: '1px solid #ececec' }}>
            <FaBus size={20} color="#02245E" />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1a1a1a' }}>{capitalizeFirstLetter(transfer?.vehicle_details?.name)}</div>
              <div style={{ fontSize: '0.78rem', color: '#666' }}>{capitalizeFirstLetter(transfer?.trip_type)}</div>
            </div>
          </div>

          {/* Route cards */}
          {transfer?.locations?.map((location, locIndex) => (
            <div key={locIndex} style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', padding: '1.2rem 1.5rem', gap: '0.5rem', borderBottom: '1px solid #f0f0f0' }}>
              {/* Pickup */}
              <div>
                <div style={{ fontSize: '0.74rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1a1a1a', marginBottom: '0.2rem' }}>PICKUP</div>
                <div style={{ fontSize: '0.82rem', color: '#444' }}>{location?.pickup_address}</div>
                {location?.outbound && (
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#004c4c', marginTop: '0.2rem' }}>
                    {new Date(location.outbound).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>

              {/* Arrow */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', padding: '0 1rem' }}>
                <span style={{ fontSize: '0.78rem', color: '#888', fontWeight: 600, whiteSpace: 'nowrap' }}>{capitalizeFirstLetter(transfer?.trip_type)}</span>
                <div style={{ width: 80, height: 2, background: 'linear-gradient(90deg, #c49a2a, #e8c55a, #c49a2a)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FaBus style={{ fontSize: '1.1rem', color: '#c49a2a', background: '#fff', padding: '0 3px' }} />
                </div>
              </div>

              {/* Dropoff */}
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1a1a1a', marginBottom: '0.2rem' }}>DROPOFF</div>
                <div style={{ fontSize: '0.82rem', color: '#444' }}>{location?.dropoff_address}</div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
