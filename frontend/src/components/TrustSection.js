import React from "react";

export default function TrustSection() {
  const stats = [
    { number: "1,500+", label: "Students Enrolled" },
    { number: "20+", label: "Professional Courses" },
    { number: "4.8⭐", label: "Average Rating" },
    { number: "85%", label: "Students Got Jobs or Clients" },
  ];

  return (
    <section className="py-20 bg-gray-50">

      <div className="max-w-6xl mx-auto px-6">

        <h2 className="text-3xl font-bold text-center mb-12">
          Trusted by Students Worldwide
        </h2>

        <div className="grid md:grid-cols-4 gap-8 text-center">

          {stats.map((stat, index) => (

            <div
              key={index}
              className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition"
            >

              <h3 className="text-3xl font-bold text-primary mb-2">
                {stat.number}
              </h3>

              <p className="text-gray-600">
                {stat.label}
              </p>

            </div>

          ))}

        </div>

      </div>

    </section>
  );
}