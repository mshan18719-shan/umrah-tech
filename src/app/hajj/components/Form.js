"use client";

import React, { useState, useMemo } from "react";
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
    debugger
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

      const response = await fetch("/api/hajj-interest/register", {
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
      alert("Thank you for your interest! We will contact you soon.");
      
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
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("There was an error submitting the form. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="row mb-3">
        <div className="col-md-6 col-sm-12 col-12 mt-2">
          <label className="form-label">First Name</label>
          <input
            type="text"
            className={`form-control ${errors.first_name ? "is-invalid" : ""}`}
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
          />
          {errors.first_name && (
            <div className="text-danger small mt-1">{errors.first_name}</div>
          )}
        </div>
        <div className="col-md-6 col-sm-12 col-12 mt-2">
          <label className="form-label">Last Name</label>
          <input
            type="text"
            className={`form-control ${errors.last_name ? "is-invalid" : ""}`}
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
          />
          {errors.last_name && (
            <div className="text-danger small mt-1">{errors.last_name}</div>
          )}
        </div>
        <div className="col-md-6 col-sm-12 col-12 mt-2">
          <label className="form-label">Email</label>
          <input
            type="email"
            className={`form-control ${errors.email ? "is-invalid" : ""}`}
            name="email"
            value={formData.email}
            onChange={handleChange}
          />
          {errors.email && (
            <div className="text-danger small mt-1">{errors.email}</div>
          )}
        </div>
        <div className="col-md-6 col-sm-12 col-12 mt-2">
          <label className="form-label">Country</label>
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
          <label className="form-label">City</label>
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
          <label className="form-label">Phone Number</label>
          <input
            type="tel"
            className={`form-control ${errors.phone_number ? "is-invalid" : ""}`}
            name="phone_number"
            value={formData.phone_number}
            onChange={handleChange}
          />
          {errors.phone_number && (
            <div className="text-danger small mt-1">{errors.phone_number}</div>
          )}
        </div>
        <div className="col-md-6 col-sm-12 col-12 mt-2">
          <label className="form-label">Number of Passengers</label>
          <input
            type="number"
            className={`form-control ${errors.number_of_passengers ? "is-invalid" : ""}`}
            name="number_of_passengers"
            value={formData.number_of_passengers}
            onChange={handleChange}
            min="1"
          />
          {errors.number_of_passengers && (
            <div className="text-danger small mt-1">{errors.number_of_passengers}</div>
          )}
        </div>
        <div className="col-md-6 col-sm-12 col-12 mt-2">
          <label className="form-label">Postal Code</label>
          <input
            type="text"
            className={`form-control ${errors.postal_code ? "is-invalid" : ""}`}
            name="postal_code"
            value={formData.postal_code}
            onChange={handleChange}
          />
          {errors.postal_code && (
            <div className="text-danger small mt-1">{errors.postal_code}</div>
          )}
        </div>
        <div className="col-md-12 col-sm-12 col-12 mt-2">
          <label className="form-label">Street Address</label>
          <input
            type="text"
            className={`form-control ${errors.street_address ? "is-invalid" : ""}`}
            name="street_address"
            value={formData.street_address}
            onChange={handleChange}
          />
          {errors.street_address && (
            <div className="text-danger small mt-1">{errors.street_address}</div>
          )}
        </div>
      </div>
      <button 
        type="submit" 
        className="btn btn-primary w-100"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Submitting..." : "Submit Interest"}
      </button>
    </form>
  );
}
