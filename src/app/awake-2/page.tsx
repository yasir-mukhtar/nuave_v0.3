'use client';

import React from 'react';
import Link from 'next/link';

const avatars = [
  { src: 'https://cdn.prod.website-files.com/67a5fb8bc33c7f25ab4e52d9/67a9ddf66ed69f30d2d060eb_Ellipse%2021.jpg', alt: 'avatar-1' },
  { src: 'https://cdn.prod.website-files.com/67a5fb8bc33c7f25ab4e52d9/67a9ddf65b220093f413d434_Ellipse%2022.jpg', alt: 'avatar-2' },
  { src: 'https://cdn.prod.website-files.com/67a5fb8bc33c7f25ab4e52d9/67a9ddf59fa3d48caaee99e7_Ellipse%2023.jpg', alt: 'avatar-3' },
  { src: 'https://cdn.prod.website-files.com/67a5fb8bc33c7f25ab4e52d9/67a9ddf502d7968dd3515d0d_Ellipse%2024.jpg', alt: 'avatar-4' },
];

const navLinks = ['Home', 'About us', 'Services', 'Work', 'Team', 'Pricing', 'Awards'];

export default function Awake2Page() {
  return (
    <div style={{ fontFamily: '"Inter Tight", sans-serif', fontSize: 14, fontWeight: 400, lineHeight: '20px', color: '#1b1d1e', backgroundColor: '#fff', minHeight: '100vh' }}>
      {/* Google Fonts + Marquee Animation */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter+Tight:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Instrument+Serif:ital@0;1&display=swap');

        @keyframes marquee-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>

      {/* Navigation */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, backgroundColor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
        <div style={{ maxWidth: 1272, marginLeft: 'auto', marginRight: 'auto', paddingLeft: 20, paddingRight: 20, height: 90, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <Link href="#" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <img
              src="https://cdn.prod.website-files.com/67a5fb8bc33c7f25ab4e52d9/67a5fbb8c1bbd60c8bd785ca_Frame%202.png"
              alt="Awake Logo"
              style={{ height: 32, width: 'auto' }}
            />
          </Link>

          {/* Center Nav Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, backgroundColor: '#f5f5f5', borderRadius: 32, padding: '6px 8px' }}>
            {navLinks.map((item) => (
              <Link
                key={item}
                href="#"
                style={{
                  fontFamily: '"Inter Tight", sans-serif',
                  fontSize: 15,
                  fontWeight: 400,
                  color: '#1b1d1e',
                  textDecoration: 'none',
                  padding: '8px 16px',
                  borderRadius: 24,
                  backgroundColor: item === 'Home' ? '#fff' : 'transparent',
                  boxShadow: item === 'Home' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  transition: 'opacity 0.2s ease',
                }}
              >
                {item}
              </Link>
            ))}
          </div>

          {/* Right CTA */}
          <Link
            href="#"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              backgroundColor: '#1b1d1e',
              color: '#fff',
              paddingLeft: 20,
              paddingRight: 6,
              height: 52,
              borderRadius: 26,
              textDecoration: 'none',
              fontFamily: '"Inter Tight", sans-serif',
              fontSize: 15,
              fontWeight: 500,
            }}
          >
            <span>Let&apos;s Collaborate</span>
            <div style={{
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255,255,255,0.15)',
              borderRadius: '50%',
            }}>
              <img
                src="https://cdn.prod.website-files.com/67a5fb8bc33c7f25ab4e52d9/67a9e2599fa438b2b5ca91b6_arrow-top-right.png"
                alt="arrow"
                style={{ width: 11, height: 11, filter: 'invert(1)' }}
              />
            </div>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ paddingTop: 190, paddingBottom: 60, position: 'relative', backgroundColor: '#fff' }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: 'auto',
          marginRight: 'auto',
          maxWidth: 1272,
          paddingLeft: 20,
          paddingRight: 20,
          textAlign: 'center',
        }}>
          {/* Heading */}
          <h1 style={{
            fontFamily: '"Inter Tight", sans-serif',
            fontSize: 100,
            fontWeight: 500,
            lineHeight: '120px',
            color: '#1b1d1e',
            textAlign: 'center',
            maxWidth: 1100,
            margin: 0,
          }}>
            Building bold brands with{' '}
            <span style={{
              fontFamily: '"Instrument Serif", serif',
              fontStyle: 'italic',
              fontWeight: 400,
              letterSpacing: -2,
            }}>
              thoughtful design
            </span>
          </h1>

          {/* Subheading */}
          <p style={{
            fontFamily: '"Inter Tight", sans-serif',
            fontSize: 16,
            lineHeight: '22.4px',
            letterSpacing: 0.4,
            color: 'rgba(27, 29, 30, 0.6)',
            textAlign: 'center',
            maxWidth: 700,
            marginLeft: 'auto',
            marginRight: 'auto',
            paddingTop: 16,
            marginTop: 0,
            marginBottom: 0,
          }}>
            At Awake, we help small startups tackle the world&apos;s biggest challenges with tailored solutions, guiding you from strategy to success in a competitive market.
          </p>

          {/* CTA + Social Proof Row */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px 32px',
            marginTop: 32,
          }}>
            {/* Get Started Button */}
            <div style={{ textAlign: 'center' }}>
              <Link
                href="#"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: 'rgb(73, 40, 253)',
                  border: '1px solid rgb(73, 40, 253)',
                  borderRadius: 33,
                  width: 256,
                  height: 64,
                  paddingLeft: 20,
                  paddingRight: 12,
                  paddingTop: 8,
                  paddingBottom: 8,
                  textDecoration: 'none',
                  cursor: 'pointer',
                  boxSizing: 'border-box',
                }}
              >
                <div style={{
                  color: '#fff',
                  fontSize: 16,
                  fontWeight: 500,
                  lineHeight: '22.4px',
                  fontFamily: '"Inter Tight", sans-serif',
                  textAlign: 'left',
                }}>
                  Get Started
                </div>
                <div style={{
                  width: 40,
                  height: 40,
                  backgroundColor: '#fff',
                  borderRadius: 45,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <img
                    src="https://cdn.prod.website-files.com/67a5fb8bc33c7f25ab4e52d9/67a9e2599fa438b2b5ca91b6_arrow-top-right.png"
                    alt="arrow-top"
                    loading="lazy"
                    style={{ maxWidth: '100%', verticalAlign: 'middle' }}
                  />
                </div>
              </Link>
            </div>

            {/* Social Proof */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* Avatar Stack */}
              <div style={{ textAlign: 'center' }}>
                {avatars.map((avatar, index) => (
                  <img
                    key={avatar.alt}
                    src={avatar.src}
                    alt={avatar.alt}
                    loading="lazy"
                    width={40}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '100%',
                      border: '2px solid #fff',
                      display: 'inline-block',
                      marginLeft: index === 0 ? 0 : -9,
                      verticalAlign: 'middle',
                      objectFit: 'cover',
                    }}
                  />
                ))}
              </div>

              {/* Stars + Text */}
              <div style={{ textAlign: 'left' }}>
                {/* Stars */}
                <div style={{ marginBottom: 2 }}>
                  {[1, 2, 3, 4].map((i) => (
                    <img
                      key={`star-${i}`}
                      src="https://cdn.prod.website-files.com/67a5fb8bc33c7f25ab4e52d9/68e4fcb4e9e9d61bcda09919_star-icon.svg"
                      alt="star-icon"
                      loading="lazy"
                      style={{ display: 'inline-block', maxWidth: '100%', verticalAlign: 'middle' }}
                    />
                  ))}
                  <img
                    src="https://cdn.prod.website-files.com/67a5fb8bc33c7f25ab4e52d9/68e4fcb4e9e9d61bcda09918_star-half-icon.svg"
                    alt="star-icon"
                    loading="lazy"
                    style={{ display: 'inline-block', maxWidth: '100%', verticalAlign: 'middle' }}
                  />
                </div>
                <p style={{
                  color: 'rgba(27, 29, 30, 0.6)',
                  fontSize: 16,
                  margin: 0,
                  fontFamily: '"Inter Tight", sans-serif',
                }}>
                  Trusted by 200+ clients
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom gradient overlay */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 200,
          background: 'linear-gradient(to bottom, transparent 0%, rgba(255,243,230,0.3) 50%, rgba(230,240,255,0.3) 100%)',
          pointerEvents: 'none',
        }} />
      </section>

      {/* Trust / Logo Marquee Section */}
      <section style={{
        paddingTop: 80,
        fontFamily: '"Inter Tight", sans-serif',
        fontSize: 14,
        fontWeight: 400,
        lineHeight: '20px',
        backgroundColor: '#fff',
      }}>
        <div style={{ marginLeft: 'auto', marginRight: 'auto', maxWidth: 1272 }}>
          {/* "Loved by" text with gradient lines */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            paddingLeft: 25,
            paddingRight: 25,
          }}>
            <div style={{
              backgroundImage: 'linear-gradient(90deg, rgba(27, 30, 29, 0), rgba(27, 29, 30, 0.1) 80%)',
              height: 2,
              maxWidth: 170,
              width: 1920,
            }} />
            <p style={{
              color: 'rgba(27, 29, 30, 0.6)',
              fontSize: 16,
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 20,
              marginBottom: 20,
              whiteSpace: 'nowrap',
            }}>
              Loved by 100,00+ big and small brands around the worlds
            </p>
            <div style={{
              backgroundImage: 'linear-gradient(90deg, rgba(27, 29, 30, 0.1), rgba(27, 30, 29, 0) 81%)',
              height: 2,
              maxWidth: 210,
              width: 210,
            }} />
          </div>

          {/* Logo Marquee */}
          <div style={{
            marginLeft: 'auto',
            marginRight: 'auto',
            maxWidth: 1385,
            overflow: 'hidden',
            position: 'relative',
          }}>
            <div style={{
              display: 'flex',
              gap: 10,
              paddingTop: 20,
              width: 2880,
              animation: 'marquee-scroll 30s linear infinite',
            }}>
              {/* First set of logos */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'space-around', width: 1440 }}>
                {[
                  'https://cdn.prod.website-files.com/67a5fb8bc33c7f25ab4e52d9/68e4f1b2e90a76715c1a1806_brand-icon-2.svg',
                  'https://cdn.prod.website-files.com/67a5fb8bc33c7f25ab4e52d9/68e4f1b2e90a76715c1a1809_brand-icon-5.svg',
                  'https://cdn.prod.website-files.com/67a5fb8bc33c7f25ab4e52d9/68e4f1b2e90a76715c1a1808_brand-icon-3.svg',
                  'https://cdn.prod.website-files.com/67a5fb8bc33c7f25ab4e52d9/68e4f1b2e90a76715c1a1807_brand-icon-1.svg',
                  'https://cdn.prod.website-files.com/67a5fb8bc33c7f25ab4e52d9/68e4f1b2e90a76715c1a1805_brand-icon-4.svg',
                  'https://cdn.prod.website-files.com/67a5fb8bc33c7f25ab4e52d9/68e4f1b2e90a76715c1a1806_brand-icon-2.svg',
                  'https://cdn.prod.website-files.com/67a5fb8bc33c7f25ab4e52d9/68e4f1b2e90a76715c1a1809_brand-icon-5.svg',
                  'https://cdn.prod.website-files.com/67a5fb8bc33c7f25ab4e52d9/68e4f1b2e90a76715c1a1808_brand-icon-3.svg',
                ].map((src, i) => (
                  <img
                    key={`logo-a-${i}`}
                    src={src}
                    alt="logo"
                    loading="eager"
                    width={260}
                    style={{ maxWidth: 140, minWidth: 140, width: 140, verticalAlign: 'middle' }}
                  />
                ))}
              </div>
              {/* Duplicate set for seamless loop */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'space-around', width: 1440 }}>
                {[
                  'https://cdn.prod.website-files.com/67a5fb8bc33c7f25ab4e52d9/68e4f1b2e90a76715c1a1806_brand-icon-2.svg',
                  'https://cdn.prod.website-files.com/67a5fb8bc33c7f25ab4e52d9/68e4f1b2e90a76715c1a1809_brand-icon-5.svg',
                  'https://cdn.prod.website-files.com/67a5fb8bc33c7f25ab4e52d9/68e4f1b2e90a76715c1a1808_brand-icon-3.svg',
                  'https://cdn.prod.website-files.com/67a5fb8bc33c7f25ab4e52d9/68e4f1b2e90a76715c1a1807_brand-icon-1.svg',
                  'https://cdn.prod.website-files.com/67a5fb8bc33c7f25ab4e52d9/68e4f1b2e90a76715c1a1805_brand-icon-4.svg',
                  'https://cdn.prod.website-files.com/67a5fb8bc33c7f25ab4e52d9/68e4f1b2e90a76715c1a1806_brand-icon-2.svg',
                  'https://cdn.prod.website-files.com/67a5fb8bc33c7f25ab4e52d9/68e4f1b2e90a76715c1a1809_brand-icon-5.svg',
                  'https://cdn.prod.website-files.com/67a5fb8bc33c7f25ab4e52d9/68e4f1b2e90a76715c1a1807_brand-icon-1.svg',
                ].map((src, i) => (
                  <img
                    key={`logo-b-${i}`}
                    src={src}
                    alt="logo"
                    loading="eager"
                    width={260}
                    style={{ maxWidth: 140, minWidth: 140, width: 140, verticalAlign: 'middle' }}
                  />
                ))}
              </div>
            </div>

            {/* Left fade overlay */}
            <div style={{
              backgroundImage: 'linear-gradient(90deg, rgb(255, 255, 255), rgba(255, 255, 255, 0) 75%)',
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              width: '16%',
            }} />
            {/* Right fade overlay */}
            <div style={{
              backgroundImage: 'linear-gradient(90deg, rgba(255, 255, 255, 0), rgb(255, 255, 255) 75%)',
              position: 'absolute',
              top: 0,
              bottom: 0,
              right: 0,
              width: '16%',
            }} />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section style={{
        paddingTop: 80,
        paddingBottom: 80,
        fontFamily: '"Inter Tight", sans-serif',
        backgroundColor: '#fff',
      }}>
        <div style={{
          marginLeft: 'auto',
          marginRight: 'auto',
          maxWidth: 1272,
          paddingLeft: 20,
          paddingRight: 20,
        }}>
          {/* Heading */}
          <h2 style={{
            fontFamily: '"Inter Tight", sans-serif',
            fontSize: 48,
            fontWeight: 500,
            lineHeight: '57.6px',
            color: '#1b1d1e',
            textAlign: 'center',
            maxWidth: 800,
            marginLeft: 'auto',
            marginRight: 'auto',
            marginTop: 0,
            marginBottom: 0,
          }}>
            Crafting exceptional, well experienced & technology driven strategie
            <span style={{ color: 'rgba(27, 29, 30, 0.3)' }}>s to drive impactful results with</span>
          </h2>

          {/* Tags: Creativity, Innovation, Strategy */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            marginTop: 20,
            marginBottom: 48,
          }}>
            {/* Creativity */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              backgroundColor: 'rgba(255, 165, 80, 0.1)',
              border: '1px solid rgba(255, 165, 80, 0.3)',
              borderRadius: 24,
              paddingLeft: 14,
              paddingRight: 18,
              paddingTop: 8,
              paddingBottom: 8,
              fontFamily: '"Instrument Serif", serif',
              fontStyle: 'italic',
              fontSize: 20,
              color: 'rgb(220, 130, 50)',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
              Creativity
            </div>
            {/* Innovation */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              backgroundColor: 'rgba(100, 200, 150, 0.1)',
              border: '1px solid rgba(100, 200, 150, 0.3)',
              borderRadius: 24,
              paddingLeft: 14,
              paddingRight: 18,
              paddingTop: 8,
              paddingBottom: 8,
              fontFamily: '"Instrument Serif", serif',
              fontStyle: 'italic',
              fontSize: 20,
              color: 'rgb(60, 160, 100)',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              Innovation
            </div>
            {/* Strategy */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              backgroundColor: 'rgba(150, 100, 220, 0.1)',
              border: '1px solid rgba(150, 100, 220, 0.3)',
              borderRadius: 24,
              paddingLeft: 14,
              paddingRight: 18,
              paddingTop: 8,
              paddingBottom: 8,
              fontFamily: '"Instrument Serif", serif',
              fontStyle: 'italic',
              fontSize: 20,
              color: 'rgb(130, 80, 200)',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
              </svg>
              Strategy
            </div>
          </div>

          {/* Stats Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 20,
          }}>
            {[
              { number: '40', label: 'Total Projects Completed' },
              { number: '15', label: 'Years of Experience' },
              { number: '12', label: 'Design Awards' },
            ].map((stat) => (
              <div key={stat.label} style={{
                backgroundColor: 'rgb(247, 247, 247)',
                borderRadius: 20,
                paddingTop: 48,
                paddingBottom: 32,
                paddingLeft: 40,
                paddingRight: 40,
                textAlign: 'center',
              }}>
                <div style={{
                  fontFamily: '"Inter Tight", sans-serif',
                  fontSize: 120,
                  fontWeight: 500,
                  lineHeight: '1',
                  color: '#1b1d1e',
                  marginBottom: 16,
                  position: 'relative',
                  display: 'inline-block',
                }}>
                  <span style={{
                    position: 'absolute',
                    top: 8,
                    left: -20,
                    fontSize: 28,
                    fontWeight: 400,
                    color: 'rgba(27, 29, 30, 0.4)',
                  }}>+</span>
                  {stat.number}
                </div>
                <p style={{
                  fontFamily: '"Inter Tight", sans-serif',
                  fontSize: 16,
                  fontWeight: 400,
                  color: 'rgba(27, 29, 30, 0.6)',
                  margin: 0,
                  marginTop: 8,
                }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
