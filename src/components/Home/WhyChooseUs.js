import { BiShield, BiAward, BiHeartSquare, BiSolidPlane, BiDollar } from "react-icons/bi";
import { BsClock } from "react-icons/bs";
const features = [
  {
    icon: <BiShield size={32} className="text-success"/>,
    title: "Secure Booking",
    description: "Your payments and personal information are protected with bank-level security",
  },
  {
    icon: <BsClock size={32} className="text-success"/>,
    title: "24/7 Support",
    description: "Round-the-clock customer service to assist you whenever you need help",
  },
  {
    icon: <BiAward size={32} className="text-success" />,
    title: "Best Price Guarantee",
    description: "Find a lower price elsewhere? We'll match it and give you an extra discount",
  },
  {
    icon: <BiHeartSquare size={32} className="text-success"/>,
    title: "Trusted by Millions",
    description: "Over 2 million satisfied customers have booked their dream trips with us",
  },
  {
    icon: <BiSolidPlane size={32} className="text-success"/>,
    title: "Global Network",
    description: "Access to 500,000+ hotels and 1,000+ airlines worldwide",
  },
  {
    icon: <BiDollar size={32} className="text-success"/>,
    title: "No Hidden Fees",
    description: "Transparent pricing with no surprise charges at checkout",
  },
];

export function WhyChooseUs() {
  return (
    <section className="why-choose-us py-5 bg-light">
      <div className="container">
        <div className="text-center mb-5">
          <h2 className="fw-bold fs-2 mb-3 heading-color">Why Choose Alhijaz Tours?</h2>
          <p className="text-muted fs-5">
            We make travel planning simple, secure, and affordable
          </p>
        </div>

        <div className="row">
          {features.map((feature, index) => (
            <div key={index} className="col-12 col-md-6 col-lg-4 mb-4">
              <div className="card h-100 text-center feature-card">
                <div className="card-body">
                  <div className="icon-wrapper mb-3">
                   {feature.icon}
                  </div>
                  <h5 className="card-title fw-semibold">{feature.title}</h5>
                  <p className="card-text text-muted">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
