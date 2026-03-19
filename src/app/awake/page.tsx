'use client';

import React from 'react';
import Link from 'next/link';

export default function AwakePage() {
  return (
    <div className="min-h-screen bg-white text-[#1b1d1e] font-sans selection:bg-[#4928fd]/10 selection:text-[#4928fd]">
      {/* Google Fonts Import */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter+Tight:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400&family=Instrument+Serif:ital@0;1&display=swap');
        
        :root {
          --font-inter-tight: 'Inter Tight', sans-serif;
          --font-instrument-serif: 'Instrument Serif', serif;
        }

        .awake-hero-heading {
          font-family: var(--font-inter-tight);
          font-size: 100px;
          font-weight: 500;
          line-height: 120px;
          color: rgb(27, 29, 30);
          text-align: center;
          max-width: 1100px;
          letter-spacing: -0.02em;
        }

        .awake-hero-heading em {
          font-family: var(--font-instrument-serif);
          font-style: italic;
          font-weight: 400;
          letter-spacing: -0.04em;
        }

        .awake-subheading {
          font-family: var(--font-inter-tight);
          font-size: 16px;
          line-height: 22.4px;
          color: rgba(27, 29, 30, 0.6);
          text-align: center;
          max-width: 700px;
          letter-spacing: 0.4px;
        }

        .navbar-link {
          font-family: var(--font-inter-tight);
          font-size: 15px;
          font-weight: 400;
          color: rgb(27, 29, 30);
          text-decoration: none;
          transition: opacity 0.2s ease;
        }

        .navbar-link:hover {
          opacity: 0.6;
        }

        @media (max-width: 1024px) {
          .awake-hero-heading {
            font-size: 72px;
            line-height: 80px;
          }
        }

        @media (max-width: 768px) {
          .awake-hero-heading {
            font-size: 55px;
            line-height: 60.5px;
          }
        }
      `}</style>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md">
        <div className="max-w-[1272px] mx-auto px-5 h-[90px] flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <img 
              src="https://cdn.prod.website-files.com/67a5fb8bc33c7f25ab4e52d9/67a5fbb8c1bbd60c8bd785ca_Frame%202.png" 
              alt="Awake Logo" 
              className="h-[32px] w-auto"
            />
          </Link>
          
          {/* Center Links */}
          <div className="hidden lg:flex items-center gap-8">
            {['Home', 'About us', 'Services', 'Work', 'Team', 'Pricing', 'Awards'].map((item) => (
              <Link key={item} href="#" className="navbar-link">
                {item}
              </Link>
            ))}
          </div>

          {/* Right side CTA */}
          <Link 
            href="/contact" 
            className="group flex items-center gap-2 bg-[#1b1d1e] text-white px-6 h-[52px] rounded-full transition-all hover:bg-black active:scale-[0.98]"
          >
            <span className="text-[15px] font-medium">Let's Collaborate</span>
            <div className="w-5 h-5 flex items-center justify-center bg-white/10 rounded-full group-hover:bg-white/20 transition-colors">
              <img 
                src="https://cdn.prod.website-files.com/67a5fb8bc33c7f25ab4e52d9/67a9e2599fa438b2b5ca91b6_arrow-top-right.png" 
                alt="arrow" 
                className="w-2 h-2 invert"
              />
            </div>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-[190px] pb-[120px] px-5 flex flex-col items-center">
        {/* Heading */}
        <h1 className="awake-hero-heading mb-4">
          Building bold brands with <em>thoughtful design</em>
        </h1>

        {/* Subheading */}
        <p className="awake-subheading mb-8">
          At Awake, we help small startups tackle the world's biggest challenges with tailored solutions, guiding you from strategy to success in a competitive market.
        </p>

        {/* Primary CTA */}
        <Link 
          href="/contact" 
          className="flex items-center justify-between bg-[#4928fd] text-white w-[256px] h-[64px] pl-6 pr-3 rounded-full transition-all hover:bg-[#3d21d4] active:scale-[0.98] mb-8"
        >
          <span className="text-[16px] font-medium">Get Started</span>
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
            <img 
              src="https://cdn.prod.website-files.com/67a5fb8bc33c7f25ab4e52d9/67a9e2599fa438b2b5ca91b6_arrow-top-right.png" 
              alt="arrow" 
              className="w-3 h-3"
            />
          </div>
        </Link>

        {/* Social Proof Section */}
        <div className="flex items-center gap-4">
          {/* Avatar Stack */}
          <div className="flex items-center">
            {[21, 22, 23, 24].map((id, index) => (
              <img 
                key={id}
                src={`https://cdn.prod.website-files.com/67a5fb8bc33c7f25ab4e52d9/67a9ddf${id === 21 || id === 22 ? '6' : '5'}${id === 21 ? '6ed69f30d2d060eb' : id === 22 ? '5b220093f413d434' : id === 23 ? '9fa3d48caaee99e7' : '02d7968dd3515d0d'}_Ellipse%20${id}.jpg`}
                alt={`Avatar ${index + 1}`}
                className="w-10 h-10 rounded-full border-2 border-white -ml-2.5 first:ml-0 object-cover"
              />
            ))}
          </div>

          {/* Review Info */}
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-0.5 mb-1">
              {[1, 2, 3, 4].map((i) => (
                <img 
                  key={i}
                  src="https://cdn.prod.website-files.com/67a5fb8bc33c7f25ab4e52d9/68e4fcb4e9e9d61bcda09919_star-icon.svg" 
                  alt="star" 
                  className="w-3.5 h-3.5"
                />
              ))}
              <img 
                src="https://cdn.prod.website-files.com/67a5fb8bc33c7f25ab4e52d9/68e4fcb4e9e9d61bcda09918_star-half-icon.svg" 
                alt="half star" 
                className="w-3.5 h-3.5"
              />
            </div>
            <span className="text-[14px] font-medium text-[rgba(27,29,30,0.6)]">
              Trusted by 200+ clients
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
