'use client'
import { useState } from "react";
import styles from "../ContactUs.module.css";
import { notifications } from "@mantine/notifications";
import ReCAPTCHA from "react-google-recaptcha";
import { BsChatDotsFill } from "react-icons/bs";

const services = [
  "Umrah Package",
  "Hajj Package",
  "Flight Booking",
  "Hotel Booking",
  "Visa Assistance",
  "Other",
];

const initialState = {
  name: "",
  email: "",
  phone: "",
  service: "",
  subject: "",
  message: "",
};
export default function Form() {
  const [formData, setFormData] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [captchaToken, setCaptchaToken] = useState(null);
  // Handle input change
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    // remove error on typing
    setErrors({
      ...errors,
      [e.target.name]: "",
    });
  };
  const handleCaptcha= (token) => {
    setCaptchaToken(token);
  };
  // Validation
  const validate = () => {
    let newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (
      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)
    ) {
      newErrors.email = "Invalid email address";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    }

    if (!formData.service.trim()) {
      newErrors.service = "Please select a service";
    }

    if (!formData.subject.trim()) {
      newErrors.subject = "Subject is required";
    }

    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;
    if (!captchaToken) {
      setErrorMsg("Please verify captcha");
      return;
    }
    try {
      setLoading(true);
      setErrorMsg("");

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to submit");
      const response = await res.json();
      notifications.show({
        title: 'Success',
        message: response?.Description,
        color: 'green',
      });
      setFormData(initialState);
    } catch (error) {
      setErrorMsg("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.contactform}>
      <h3 className={styles.formHeading}>Send Us a Message</h3>
      <form onSubmit={handleSubmit} className="php-email-form">
        <div className="row gy-4">

          {/* Name */}
          <div className="col-md-12">
            <label className="pb-2">Full Name *</label>
            <input
              type="text"
              name="name"
              className="form-control"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleChange}
            />
            {errors.name && <small className="text-danger">{errors.name}</small>}
          </div>

          {/* Email */}
          <div className="col-md-12">
            <label className="pb-2">Email Address *</label>
            <input
              type="email"
              name="email"
              className="form-control"
              placeholder="your.email@example.com"
              value={formData.email}
              onChange={handleChange}
            />
            {errors.email && <small className="text-danger">{errors.email}</small>}
          </div>

          {/* Phone Number */}
          <div className="col-md-12">
            <label className="pb-2">Phone Number *</label>
            <input
              type="tel"
              name="phone"
              className="form-control"
              placeholder="+44 XX XXXX XXXX"
              value={formData.phone}
              onChange={handleChange}
            />
            {errors.phone && <small className="text-danger">{errors.phone}</small>}
          </div>

          {/* Service Interested In */}
          <div className="col-md-12">
            <label className="pb-2">Service Interested In *</label>
            <select
              name="service"
              className="form-control"
              value={formData.service}
              onChange={handleChange}
            >
              <option value="">Select a service</option>
              {services.map((service) => (
                <option value={service} key={service}>
                  {service}
                </option>
              ))}
            </select>
            {errors.service && <small className="text-danger">{errors.service}</small>}
          </div>

          {/* Subject */}
          <div className="col-md-12">
            <label className="pb-2">Subject</label>
            <input
              type="text"
              name="subject"
              className="form-control"
              placeholder="What is this regarding?"
              value={formData.subject}
              onChange={handleChange}
            />
            {errors.subject && <small className="text-danger">{errors.subject}</small>}
          </div>

          {/* Message */}
          <div className="col-md-12 mb-2">
            <label className="pb-2">Message *</label>
            <textarea
              name="message"
              rows="6"
              className="form-control"
              placeholder="Tell us about your travel plans and requirements..."
              value={formData.message}
              onChange={handleChange}
            />
            {errors.message && <small className="text-danger">{errors.message}</small>}
          </div>

          <ReCAPTCHA
            sitekey="6LdH_IQsAAAAAP8J5zF09QteWVZjAjnWSJjrW64J"
            onChange={handleCaptcha}
          />

          {/* Success Message */}
          {errorMsg && (
            <div className="col-md-12 mt-2 text-success text-center">
              {errorMsg}
            </div>
          )}

          {/* Button */}
          <div className="col-md-12 text-center">
            <button
              className={`btn w-100 ${styles.submitBtn}`}
              type="submit"
              disabled={loading}
            >
              {loading ? (
                "Sending..."
              ) : (
                <>
                  <BsChatDotsFill className={styles.submitBtnIcon} /> Send via WhatsApp
                </>
              )}
            </button>
          </div>

        </div>
      </form>
    </div>
  );
}