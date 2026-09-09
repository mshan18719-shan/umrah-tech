"use client";
import React, {useEffect, useState} from "react";
import styles from "../Bookings.module.css";
import { FaUser } from "react-icons/fa";
import { useSession } from "next-auth/react";
function page() {
  const { data: session, status } = useSession();
  const [accountStatement, setAccountStatement] = useState([]);
  const bookings = [
    {
      id: "HTL-001",
      guestName: "Sarah Johnson",
      guestEmail: "sarahj@email.com",
      roomType: "Deluxe Ocean View",
      date: "Jan 15 - Jan 20, 2024",
      status: "confirmed",
      amount: "$1,250",
    },
    {
      id: "HTL-002",
      guestName: "Michael Chen",
      guestEmail: "m.chen@email.com",
      roomType: "Standard Suite",
      date: "Jan 18 - Jan 22, 2024",
      status: "pending",
      amount: "$890",
    },
    {
      id: "HTL-003",
      guestName: "Emma Williams",
      guestEmail: "emma.w@email.com",
      roomType: "Presidential Suite",
      date: "Jan 20 - Jan 25, 2024",
      status: "confirmed",
      amount: "$2,100",
    },
    {
      id: "HTL-004",
      guestName: "James Rodriguez",
      guestEmail: "j.rodriguez@email.com",
      roomType: "Single Room",
      date: "Jan 22 - Jan 24, 2024",
      status: "cancelled",
      amount: "$450",
    },
    {
      id: "HTL-005",
      guestName: "Olivia Brown",
      guestEmail: "o.brown@email.com",
      roomType: "Family Room",
      date: "Jan 25 - Jan 30, 2024",
      status: "confirmed",
      amount: "$1,800",
    },
  ];

  const fetchAccountStatement = async () => {
     if (!session?.user?.apiToken) return;
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/b2b/accounts/user-ledger/${session?.user?.id}`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${session?.user?.apiToken}`,
          },
        }
      )
      
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() =>{
    fetchAccountStatement();
  },[session, status])
  return (
    <>
      <div className={`${styles.container} py-4`}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.icon}>
              <FaUser size={30} />
            </div>
            <div className={styles.headerText}>
              <h1>Account Statement</h1>
              <p>View your account statement and transaction history</p>
            </div>
          </div>
        </div>

        <div className="row g-4">
          <div className="col-6 col-sm-6 col-lg-3">
            <div className="card border shadow-sm h-100 rounded-4">
              <div className="card-body">
                <p className="text-muted mb-1 small">Total Transactions</p>
                <h4 className="fw-bold mb-0">GBP 60</h4>
              </div>
            </div>
          </div>

          <div className="col-6 col-sm-6 col-lg-3">
            <div className="card border shadow-sm h-100 rounded-4">
              <div className="card-body">
                <p className="text-muted mb-1 small">Debit</p>
                <h4 className="fw-bold  mb-0">GBP 4600</h4>
              </div>
            </div>
          </div>

          <div className="col-6 col-sm-6 col-lg-3">
            <div className="card border shadow-sm h-100 rounded-4">
              <div className="card-body">
                <p className="text-muted mb-1 small">Credit</p>
                <h4 className="fw-bold  mb-0">GBP 4000</h4>
              </div>
            </div>
          </div>

          <div className="col-6 col-sm-6 col-lg-3">
            <div className="card border shadow-sm h-100 rounded-4">
              <div className="card-body">
                <p className="text-muted mb-1 small">Total Balance</p>
                <h4 className="fw-bold  mb-0">GBP 600</h4>
              </div>
            </div>
          </div>
        </div>

        <div className="table-responsive mt-4">
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Sr</th>
                <th>Type</th>
                <th>Description</th>
                <th>Check in/Check out</th>
                <th>Debit</th>
                <th>Cradit</th>
                <th>Guest Name</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <td className={styles.bookingId}>{booking.id}</td>
                  <td>
                    <td className={styles.amount}>{booking.roomType}</td>
                  </td>
                  <td>
                    <div className={styles.guestInfo}>
                      <span className={styles.guestName}>
                        {booking.guestName}
                      </span>
                      <span className={styles.guestEmail}>
                        {booking.guestEmail}
                      </span>
                    </div>
                  </td>
                  <td>
                    <p style={{ width: "150px" }}>{booking.date}</p>
                  </td>
                  <td>
                    <span
                      className={`${styles.status} ${styles[booking.status]}`}
                    >
                      {booking.status.charAt(0).toUpperCase() +
                        booking.status.slice(1)}
                    </span>
                  </td>
                  <td className={styles.amount}>{booking.amount}</td>
                  <td className={styles.amount}>{booking.guestName}</td>
                  <td className={styles.amount}>
                    <td>
                      <p style={{ width: "150px" }}>{booking.date}</p>
                    </td>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default page;
