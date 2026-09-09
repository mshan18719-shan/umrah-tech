"use client";
import React, { useState, useMemo } from "react";
import styles from "../HajjPage.module.css";
import { FaKaaba } from "react-icons/fa";
import { FaRegBell } from "react-icons/fa";
import { MdOutlineMailOutline } from "react-icons/md";
import { GoBook } from "react-icons/go";
import { Country, City } from "country-state-city";
import { Select } from "@mantine/core";
export default function Form() {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    country: "",
    city: "",
    phone_number: "",
    number_of_passengers: "",
    postal_code: "",
    street_address: "",
  });

  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const countries = useMemo(() => Country.getAllCountries(), []);

  const cities = useMemo(() => {
    if (formData.country) {
      const cityList = City.getCitiesOfCountry(formData.country);
      const uniqueCities = Array.from(
        new Map(cityList.map((city) => [city.name, city])).values()
      );
      return uniqueCities.map((city) => ({
        value: city.name,
        label: city.name,
      }));
    }
    return [];
  }, [formData.country]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      // Reset city when country changes
      ...(name === "country" && { city: "" }),
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.first_name) {
      newErrors.first_name = "First name is required";
    }

    if (!formData.last_name) {
      newErrors.last_name = "Last name is required";
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.country) {
      newErrors.country = "Country is required";
    }

    if (!formData.city) {
      newErrors.city = "City is required";
    }

    if (!formData.phone_number) {
      newErrors.phone_number = "Phone number is required";
    } else if (!/^[\d\s\-\+\(\)]+$/.test(formData.phone_number)) {
      newErrors.phone_number = "Please enter a valid phone number";
    }

    if (!formData.number_of_passengers) {
      newErrors.number_of_passengers = "Number of passengers is required";
    } else if (isNaN(formData.number_of_passengers) || parseInt(formData.number_of_passengers) < 1) {
      newErrors.number_of_passengers = "Please enter a valid number";
    }

    if (!formData.postal_code) {
      newErrors.postal_code = "Postal code is required";
    }

    if (!formData.street_address) {
      newErrors.street_address = "Street address is required";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setIsSubmitting(true);

    try {
      // Get country name from country code
      const selectedCountry = countries.find(
        (country) => country.isoCode === formData.country
      );
      const countryName = selectedCountry ? selectedCountry.name : formData.country;

      // Prepare payload with country name instead of code
      const payload = {
        ...formData,
        country: countryName,
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hajj-interest/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to submit form");
      }

      const data = await response.json();
      if (data.Success) {
        setSuccessMsg(data?.Description || "Your Hajj interest request has been submitted successfully.");
        setErrorMsg("");
        // Reset form
        setFormData({
          first_name: "",
          last_name: "",
          email: "",
          country: "",
          city: "",
          phone_number: "",
          number_of_passengers: "",
          postal_code: "",
          street_address: "",
        });
        setErrors({});
      } else {
        setErrorMsg(data?.Description || "There was an error submitting the Hajj interest. Please try again.");
        setSuccessMsg("");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setErrorMsg("There was an error submitting the Hajj interest. Please try again.");
      setSuccessMsg("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <section className={`py-5 ${styles.svgbg}`}>
        <div className="container">
          <h2 className="fw-bold text-center mb-3 text-light">
            Stay Updated for Hajj Packages
          </h2>
          <p className="text-center mb-4 text-light">
            Due to limited quotas each year, Hajj packages sell out quickly.
            Register your interest to receive updates about:
          </p>

          <div className="row w-75 mx-auto">
            <div class="col-md-3 d-flex justify-content-center align-items-center flex-column">
              <div className={`${styles.formicon}`}>
                <FaKaaba color="#02245E" size={30} />
              </div>
              <p className="mt-2 text-light">Hajj package releases</p>
            </div>{" "}
            <div class="col-md-3 d-flex justify-content-center align-items-center flex-column">
              <div className={`${styles.formicon}`}>
                <FaRegBell color="#02245E" size={30} />
              </div>
              <p className="mt-2 text-light">Booking announcements</p>
            </div>{" "}
            <div class="col-md-3 d-flex justify-content-center align-items-center flex-column">
              <div className={`${styles.formicon}`}>
                <GoBook color="#02245E" size={30} />
              </div>
              <p className="mt-2 text-light">Important travel guidance</p>
            </div>{" "}
            <div class="col-md-3 d-flex justify-content-center align-items-center flex-column">
              <div className={`${styles.formicon}`}>
                <MdOutlineMailOutline color="#02245E" size={30} />
              </div>
              <p className="mt-2 text-light">Preparation resources</p>
            </div>
          </div>

          <div className={`row p-4 mt-4 bg-light rounded-4 shadow-sm mx-auto ${styles.formwidth}`}>
            <h4 className={`fw-bold text-center mb-3 ${styles.prepHeading}`}>
              Join the Hajj Waiting List
            </h4>
            <p className="text-center mb-4 text-muted">
              Be the first to know when packages are available
            </p>

            <form onSubmit={handleSubmit}>
              <div className="row mb-3">
                <div className="col-md-6 col-sm-12 col-12 mt-2">
                  <label className="form-label">First Name <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className={`form-control ${errors.first_name ? "is-invalid" : ""}`}
                    name="first_name"
                    placeholder="Enter your first name"
                    value={formData.first_name}
                    onChange={handleChange}
                  />
                  {errors.first_name && (
                    <div className="text-danger small mt-1">{errors.first_name}</div>
                  )}
                </div>
                <div className="col-md-6 col-sm-12 col-12 mt-2">
                  <label className="form-label">Last Name <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className={`form-control ${errors.last_name ? "is-invalid" : ""}`}
                    name="last_name"
                    placeholder="Enter your last name"
                    value={formData.last_name}
                    onChange={handleChange}
                  />
                  {errors.last_name && (
                    <div className="text-danger small mt-1">{errors.last_name}</div>
                  )}
                </div>
                <div className="col-md-6 col-sm-12 col-12 mt-2">
                  <label className="form-label">Email <span className="text-danger">*</span></label>
                  <input
                    type="email"
                    className={`form-control ${errors.email ? "is-invalid" : ""}`}
                    name="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                  {errors.email && (
                    <div className="text-danger small mt-1">{errors.email}</div>
                  )}
                </div>
                <div className="col-md-6 col-sm-12 col-12 mt-2">
                  <label className="form-label">Country <span className="text-danger">*</span></label>
                  <select
                    className={`form-control ${errors.country ? "is-invalid" : ""}`}
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                  >
                    <option value="">Select Country</option>
                    {countries.map((country) => (
                      <option key={country.isoCode} value={country.isoCode}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                  {errors.country && (
                    <div className="text-danger small mt-1">{errors.country}</div>
                  )}
                </div>
                <div className="col-md-6 col-sm-12 col-12 mt-2">
                  <label className="form-label">City <span className="text-danger">*</span></label>
                  <Select
                    placeholder="Select or search city"
                    data={cities}
                    value={formData.city}
                    onChange={(value) => handleChange({ target: { name: 'city', value: value || '' } })}
                    disabled={!formData.country}
                    searchable
                    clearable
                    nothingFoundMessage="No cities found"
                    error={errors.city}
                    maxDropdownHeight={400}
                    limit={50}
                    classNames={{
                      input: errors.city ? "is-invalid" : "",
                    }}
                  />
                  {errors.city && (
                    <div className="text-danger small mt-1">{errors.city}</div>
                  )}
                </div>
                <div className="col-md-6 col-sm-12 col-12 mt-2">
                  <label className="form-label">Phone Number <span className="text-danger">*</span></label>
                  <input
                    type="tel"
                    className={`form-control ${errors.phone_number ? "is-invalid" : ""}`}
                    name="phone_number"
                    placeholder="Enter your phone number"
                    value={formData.phone_number}
                    onChange={handleChange}
                  />
                  {errors.phone_number && (
                    <div className="text-danger small mt-1">{errors.phone_number}</div>
                  )}
                </div>
                <div className="col-md-6 col-sm-12 col-12 mt-2">
                  <label className="form-label">Number of Passengers <span className="text-danger">*</span></label>
                  <input
                    type="number"
                    className={`form-control ${errors.number_of_passengers ? "is-invalid" : ""}`}
                    name="number_of_passengers"
                    placeholder="Enter number of passengers"
                    value={formData.number_of_passengers}
                    onChange={handleChange}
                    min="1"
                  />
                  {errors.number_of_passengers && (
                    <div className="text-danger small mt-1">{errors.number_of_passengers}</div>
                  )}
                </div>
                <div className="col-md-6 col-sm-12 col-12 mt-2">
                  <label className="form-label">Postal Code <span className="text-danger">*</span> </label>
                  <input
                    type="text"
                    className={`form-control ${errors.postal_code ? "is-invalid" : ""}`}
                    name="postal_code"
                    placeholder="Enter your postal code"
                    value={formData.postal_code}
                    onChange={handleChange}
                  />
                  {errors.postal_code && (
                    <div className="text-danger small mt-1">{errors.postal_code}</div>
                  )}
                </div>
                <div className="col-md-12 col-sm-12 col-12 mt-2">
                  <label className="form-label">Street Address <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className={`form-control ${errors.street_address ? "is-invalid" : ""}`}
                    name="street_address"
                    placeholder="Enter your street address"
                    value={formData.street_address}
                    onChange={handleChange}
                  />
                  {errors.street_address && (
                    <div className="text-danger small mt-1">{errors.street_address}</div>
                  )}
                </div>
              </div>
              {errorMsg && (
                <div class="alert alert-danger" role="alert">
                  {errorMsg}
                </div>
              )}
              {successMsg && (
                <div class="alert alert-success" role="alert">
                  {successMsg}
                </div>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`btn btn-warning  ${styles.btntextyello} w-100`}
              >
                {isSubmitting ? "Submitting..." : "Register Your Interest"}
              </button>
              <p className="text-center small text-muted mt-3 mb-0">
                By submitting this form, you agree to receive updates about Hajj
                packages from UmrahTech
              </p>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
