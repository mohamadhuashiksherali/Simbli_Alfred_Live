import React, { useState } from "react";
import "./FAQ.css";

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(-1); // No question open by default

  const faqData = [
    {
      question: "What is Alfred?",
      answer:
        "Alfred is an AI-powered Social Media Agent that helps creators, brands, and agencies create, design, and schedule content automatically. It writes captions, designs visuals, suggests hashtags, and optimizes post timing - all based on your brand voice and audience insights.",
    },
    {
      question: "How is Alfred different from tools like Buffer or Hootsuite?",
      answer:
        "Unlike traditional tools that only schedule posts, Alfred creates, learns, and optimizes your content using AI. It understands your tone, audience behavior, and performance data to continuously improve results.",
    },
    {
      question: "Do I need any technical skills to use Alfred?",
      answer:
        "No. Alfred is designed for simplicity - sign up, set your preferences, and start creating in minutes.",
    },
    {
      question: "What platforms does Alfred support?",
      answer: "Alfred integrates with all major platforms: LinkedIn, Instagram, Facebook, and X.Support for YouTube and Pinterest is coming soon."
    },
    {
      question: "Can Alfred create visuals and captions automatically?",
      answer:
        "Yes. Alfred uses Generative AI to design visuals and Natural Language Processing (NLP) to craft captions, hashtags, and CTAs - tailored to each platform’s best practices.",
    },
    {
      question: "How does Alfred ensure post quality and accuracy?",
      answer:
        "Every post goes through an AI quality check for tone, grammar, and relevance. You can review, edit, and approve before anything goes live.",
    },
    {
      question: "What pricing plans are available?",
      answer:
      (
        <>
       <p style={{ fontSize: "16px", color: "#022C33" }}>Alfred offers flexible plans to suit every user:</p>
        <ul style={{ paddingLeft: "20px", listStyleType: "disc" }}>
          <li><strong>Basic:( $39 per month )</strong> - For Solo Creators.</li>
          <li><strong>Standard:( $59 per month )</strong> - For Growing Brands.</li>
          <li><strong>Pro:( $99 per month )</strong> - For Teams and Agencies.</li>
        </ul>
        <p style={{ fontSize: "16px", color: "#666" }}>All plans include content generation, design, and scheduling tools.</p>
      </>
      )
    },
    {
      question: "Can I try Alfred for free?",
      answer: "Yes.You can start with a 7-day free trial.",
    },
    {
      question: "How do I cancel my subscription?",
      answer:
        "You can cancel anytime directly from your Alfred dashboard. Your plan will remain active until the end of your billing period, and you won’t be charged again after cancellation.",
    },
    {
      question: "What is your refund policy?",
      answer:
        "No refunds are provided. Once a payment is processed, it’s considered final due to AI resource and infrastructure usage. You can cancel anytime to stop future billing, but prior payments are non-refundable.",
    },
    {
      question: "Is my data safe with Alfred?",
      answer:
        "Yes. Alfred follows strict data encryption and privacy protocols.Your content and credentials are fully secured and never shared with third parties.",
    },
    {
      question: "How can I reach support?",
      answer: (
        <>
          You can reach us anytime at{" "}
          <a
            href="mailto:support@simbli.ai"
            style={{ textDecoration: "underline", color: "inherit" }}
          >
            support@simbli.ai
          </a>{" "}
          or via in-app chat. Our AI assistant and human support team are
          available to help you 24/7.
        </>
      ),
    },
  ];

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? -1 : index);
  };

  return (
    <section className="faq-section">
      <div className="faq-container container">
        <h2 className="faq-title">Frequently Asking Questions</h2>
        <div className="faq-accordion">
          {faqData.map((item, index) => (
            <div key={index} className="faq-item">
              <button
                className={`faq-question ${
                  openIndex === index ? "faq-question-open" : ""
                }`}
                onClick={() => toggleAccordion(index)}
                aria-expanded={openIndex === index}
              >
                <span className="faq-question-text">{item.question}</span>
                <span className="faq-arrow">
                  {openIndex === index ? (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M6 15L12 9L18 15"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M6 9L12 15L18 9"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
              </button>
              {openIndex === index && (
                <div className="faq-answer">
                  <p className="faq-answer-text">{item.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
