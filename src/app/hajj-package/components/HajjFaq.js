"use client";
import React, { useState, useMemo } from "react";
import { Accordion, Tabs } from "@mantine/core";
import styles from "../HajjPage.module.css";
function HajjFaq() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const faqData = [
    {
      id: "q1",
      category: "general",
      question: "What are the services offered by UmrahTech?",
      answer:
        "UmrahTech offers complete Hajj and Umrah services, such as visa processing, flights, hotel bookings, ground transportation, guided tours, and Ziyarat tours, to be able to make the journey smooth and spiritually complete.",
    },
    {
      id: "q2",
      category: "hajj",
      question: "When am I supposed to book my Hajj package?",
      answer:
        "Your Hajj package is better booked in advance. Advanced reservations guarantee a better room, and booked flights for Hajj.",
    },
    {
      id: "q3",
      category: "visa",
      question: "What is the duration of the visa processing for Umrah?",
      answer:
        "The accuracy of the documents and the approval of the Saudi authorities can bring the process of Umrah visa processing to 5-10 working days. We support each process to make sure that it is approved in time.",
    },
    {
      id: "q4",
      category: "booking",
      question: "Is it possible to upgrade my hotel once it is booked?",
      answer:
        "Yes. Upgrading of your hotel is also available after booking, depending on availability. With the assistance of our team, we will be able to choose alternatives that are comfortable to you and within your budget.",
    },
    {
      id: "q5",
      category: "general",
      question: "Do you offer ground services at Hajj and Umrah?",
      answer:
        "Yes, we have an entire ground package with airport transfers, intercity transport, and local travel in Makkah and Madinah to have a smooth stay.",
    },
    {
      id: "q6",
      category: "visa",
      question: "Are children to be given a separate visa for Hajj or Umrah?",
      answer:
        "Yes, each child should have their own visa. Every child has to possess an authentic passport and a visa application as per the Saudi regulations.",
    },
    {
      id: "q7",
      category: "umrah",
      question: "What Ziyarat are there in your packages?",
      answer:
        "Our Ziyarat normally involves tours to major Islamic and historical places in Makkah and Madinah. This can be Jabal al-Noor, Jabal al-Thawr, Mina, Muzdalifah, and Arafat in Makkah. Madinah Ziyarat commonly encompasses Masjid Quba, Masjid Qiblatain, Jannat al-Baqi, and Uhud, but the places can vary according to the packages.",
    },
    {
      id: "q8",
      category: "umrah",
      question: "What are the things to do before going to Umrah?",
      answer:
        "You must take your passport and your visa papers, visit orientation programs, learn the rituals of Umrah, pack the right clothes, and take necessary vaccinations before travelling.",
    },
    {
      id: "q9",
      category: "general",
      question: "Do you include accommodations in the packages?",
      answer:
        "Yes. Our hotels are in strategic locations, close to the Haram in Makkah and Madinah, and are either comfortable or premium, depending on the package that you have chosen.",
    },
    {
      id: "q10",
      category: "booking",
      question: "What is the booking procedure for my Hajj or Umrah package?",
      answer:
        "Booking is easy; make a call to UmrahTech on our site, by phone, or at the office. Your pilgrimage planning will be easy, as our advisors will be directing you through the whole process.",
    },
  ];

  const filteredFaqs = useMemo(() => {
    let filtered = faqData;

    // Filter by category
    if (activeTab !== "all") {
      filtered = filtered.filter((faq) => faq.category === activeTab);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (faq) =>
          faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    return filtered;
  }, [activeTab, searchQuery]);

  return (
    <>
      <section className="py-5" style={{background: "linear-gradient(to right, #e8f5e9, #b6d8d5)"}}>
        <div class="container">
          <h2 className={`fw-bold text-center mb-3 ${styles.prepHeading}`}>
            Frequently Asked Questions
          </h2>
          <p className="text-center mb-4 text-muted">
            Everything you need to know about our Hajj packages
          </p>

        
          

            {/* FAQ Accordion */}
            <div className="row justify-content-center">
              <div className="col-lg-10">
                <Accordion
                  defaultValue="q1"
                  radius="lg"
                  variant="separated"
                  classNames={{
                    item: "faq-item shadow-sm mb-3 border",
                    control: "faq-control",
                    panel: "faq-panel",
                  }}
                >
                  {filteredFaqs.map((faq) => (
                    <Accordion.Item key={faq.id} value={faq.id}>
                      <Accordion.Control
                        icon={
                          <span
                            className="text-success me-2"
                            style={{ fontSize: "1.3rem" }}
                          >
                            {faq.icon}
                          </span>
                        }
                      >
                        <span className="fw-semibold">{faq.question}</span>
                      </Accordion.Control>
                      <Accordion.Panel>
                        <p
                          className="text-muted mb-0"
                          style={{ lineHeight: "1.8" }}
                        >
                          {faq.answer}
                        </p>
                      </Accordion.Panel>
                    </Accordion.Item>
                  ))}
                </Accordion>
              </div>
            </div>
          </div>
        
      </section>
    </>
  );
}

export default HajjFaq;
