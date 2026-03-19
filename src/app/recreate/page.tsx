'use client';

import React from 'react';
import Link from 'next/link';

export default function RecreatePage() {
  return (
    <div className="min-h-screen bg-[#f7f7f5] text-[#0a0a0a] font-sans selection:bg-[#6c3ff5]/10 selection:text-[#6c3ff5]">
      {/* Global Style Injection for 1:1 Fonts */}
      <style jsx global>{`
        @import url('https://rsms.me/inter/inter.css');
        
        :root {
          --font-inter-display: 'Inter Display', 'Inter', sans-serif;
        }

        .hero-heading {
          font-family: var(--font-inter-display);
          font-size: 60px;
          font-weight: 600;
          color: rgb(10, 10, 10);
          line-height: 60px;
          letter-spacing: -1px;
          text-align: center;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .hero-subheading {
          font-family: 'Inter', sans-serif;
          font-size: 18px;
          line-height: 30.6px;
          letter-spacing: -0.5px;
          color: rgb(133, 133, 133);
          text-align: center;
        }

        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }

        @media (max-width: 768px) {
          .hero-heading {
            font-size: 40px;
            line-height: 44px;
            letter-spacing: -0.5px;
          }
        }
      `}</style>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#f7f7f5]/80 backdrop-blur-md border-b border-[#000000]/5">
        <div className="max-w-[1200px] mx-auto px-[30px] h-[80px] flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <svg width="26" height="26" viewBox="0 0 262 262" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M172.197 202.668L130.999 131.02L89.1807 206H8L89.8027 59.332L130.999 130.98L172.818 56H254L172.197 202.668Z" fill="#533AFD"/>
            </svg>
            <span className="text-[20px] font-bold tracking-tight">Nuave</span>
          </div>
          
          {/* Center Links */}
          <div className="hidden md:flex items-center gap-[40px]">
            {['Fitur', 'Harga', 'FAQ', 'Bantuan'].map((item) => (
              <Link key={item} href="#" className="text-[15px] font-medium text-[#0a0a0a] hover:opacity-70 transition-opacity">
                {item}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center">
            <Link href="/auth" className="text-[15px] font-medium text-[#0a0a0a] hover:opacity-70 transition-opacity">
              Masuk
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Section - Matches padding from builder-io.json */}
      <main className="relative flex flex-col items-center overflow-x-hidden pt-[160px] pb-[280px] px-[30px] w-full min-h-screen">
        <div className="flex flex-col items-center max-w-[1200px] w-full">
          
          {/* Content Wrapper - Matches the "gap: 102px" and "gap: 24px" from JSON */}
          <div className="flex flex-col items-center w-full gap-[102px]">
            
            {/* Heading, Subheading, and Button Stack - gap: 24px */}
            <div className="flex flex-col items-center w-full gap-[24px]">
              
              {/* Text Stack - gap: 16px */}
              <div className="flex flex-col items-center w-full gap-[16px] max-w-[800px]">
                <h1 className="hero-heading">
                  Lihat seberapa sering ChatGPT menyebut brand Anda
                </h1>
                <p className="hero-subheading max-w-[740px]">
                  Jutaan orang kini melakukan pencarian lewat AI. Nuave melacak brand Anda dalam jawaban ChatGPT dan memberi rekomendasi perbaikan.
                </p>
              </div>

              {/* Button */}
              <button 
                style={{ backgroundColor: 'rgb(108, 63, 245)', borderRadius: '12px' }}
                className="h-auto py-[14px] px-[22px] text-white font-semibold text-[16px] hover:opacity-90 transition-all active:scale-[0.98] w-fit"
              >
                Audit brand Anda — Gratis!
              </button>
            </div>

            {/* Mockup Indicators and Mockup Container */}
            <div className="flex flex-col items-center w-full gap-[40px]">
              
              {/* Indicators */}
              <div className="flex items-center gap-8 overflow-x-auto no-scrollbar max-w-full px-4">
                <div className="flex items-center gap-3 whitespace-nowrap">
                  <div className="w-6 h-6 flex items-center justify-center bg-black text-white text-[12px] font-bold rounded-full">1</div>
                  <span className="text-[16px] font-bold text-black">Audit Brand</span>
                </div>
                <div className="flex items-center gap-3 whitespace-nowrap opacity-40">
                  <div className="w-2 h-2 rounded-full bg-[#858585]"></div>
                  <span className="text-[16px] font-medium text-[#858585]">Rekomendasi Konten</span>
                </div>
                <div className="flex items-center gap-3 whitespace-nowrap opacity-40">
                  <div className="w-2 h-2 rounded-full bg-[#858585]"></div>
                  <span className="text-[16px] font-medium text-[#858585]">Monitoring Harian</span>
                </div>
              </div>

              {/* Hero Mockup */}
              <div className="relative w-full max-w-[1140px] aspect-[16/9] bg-white rounded-2xl border border-[#e5e7eb] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-white via-transparent to-[#533AFD]/5 pointer-events-none"></div>
                
                <div className="w-24 h-24 rounded-full bg-[#f9fafb] border border-[#e5e7eb] flex items-center justify-center shadow-inner relative z-10">
                  <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[16px] border-l-[#533AFD] border-b-[10px] border-b-transparent ml-1"></div>
                </div>

                {/* Framer Badge */}
                <div className="absolute bottom-5 right-5 h-[32px] pl-2 pr-3 bg-white border border-[#e5e7eb] rounded-[8px] shadow-sm flex items-center gap-2 z-20">
                  <svg width="10" height="15" viewBox="0 0 12 18" fill="none"><path d="M0 0H12V6H6L0 0Z" fill="black"/><path d="M0 6H6L12 12V18L0 6Z" fill="black"/><path d="M0 12H6V18L0 12Z" fill="black"/></svg>
                  <span className="text-[11px] font-bold tracking-tight">Made in Framer</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}



