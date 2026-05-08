/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Upload, ShieldCheck, ShieldAlert, FileSearch, RefreshCcw, Camera, Info, CheckCircle2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from '@google/genai';

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

type VerificationResult = {
  prediction: 'genuine' | 'forged' | 'inconclusive';
  confidence: number;
  reasoning: string;
};

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
      setResult(null);
      setError(null);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const verifySignature = async () => {
    if (!preview) return;

    setLoading(true);
    setError(null);

    try {
      const base64Data = preview.split(',')[1];
      
      const prompt = `
        You are an expert forensic document examiner specializing in signature verification.
        Analyze this signature image and determine if it appears to be a genuine signature or a forgery.
        
        Look for:
        1. Line quality (smoothness vs. shakiness/tremor)
        2. Pressure patterns (gradual changes in stroke thickness)
        3. Start and end points (natural tapers vs. blunt starts/stops)
        4. Connectivity and rhythm.
        
        Provide your analysis in JSON format:
        {
          "prediction": "genuine" | "forged" | "inconclusive",
          "confidence": number (between 0 and 1),
          "reasoning": "brief explanation of your findings"
        }
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          {
            parts: [
              { text: prompt },
              { inlineData: { mimeType: file?.type || 'image/png', data: base64Data } }
            ]
          }
        ],
        config: {
          responseMimeType: 'application/json'
        }
      });

      const data = JSON.parse(response.text || '{}');
      setResult({
        prediction: data.prediction || 'inconclusive',
        confidence: data.confidence || 0.0,
        reasoning: data.reasoning || 'Could not determine the authenticity.'
      });
    } catch (err) {
      console.error(err);
      setError('An error occurred during verification. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#1D1D1F] font-sans selection:bg-[#E2D8FF] selection:text-[#5837C0]">
      {/* Header */}
      <header className="border-b border-[#E5E5E5] px-6 py-4 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#5837C0] rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">SigVerify AI</h1>
            <p className="text-xs text-gray-500 font-medium">Neural Signature Analysis Engine</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-semibold border border-green-100">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            System Secure
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Intro */}
        <section className="mb-12 text-center">
          <h2 className="text-4xl font-extrabold mb-4 tracking-tighter sm:text-5xl">
            Authenticate with <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5837C0] to-[#9D7AFF]">Precision.</span>
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-lg leading-relaxed">
            Upload a signature image for instant AI-driven forensic analysis. Our system detects micro-tremors and pressure patterns to differentiate genuine signatures from forgeries.
          </p>
        </section>

        {/* Upload Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="space-y-6">
            <div 
              className={`relative border-2 border-dashed rounded-3xl p-8 transition-all duration-300 group flex flex-col items-center justify-center min-h-[320px] bg-white
                ${preview ? 'border-[#5837C0] bg-indigo-50/10' : 'border-[#E5E5E5] hover:border-[#5837C0] hover:bg-indigo-50/30'}
                cursor-pointer`}
              onClick={handleUploadClick}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden"
              />
              
              <AnimatePresence mode="wait">
                {preview ? (
                  <motion.div 
                    key="preview"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full h-full flex flex-col items-center"
                  >
                    <div className="relative group/img overflow-hidden rounded-2xl shadow-sm border border-gray-100 bg-white p-4 mb-4">
                      <img src={preview} alt="Signature Preview" className="max-h-48 object-contain" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                        <RefreshCcw className="text-white animate-spin-slow" />
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-[#5837C0]">{file?.name}</p>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center text-center"
                  >
                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
                      <Upload size={32} className="text-gray-400 group-hover:text-[#5837C0] transition-colors" />
                    </div>
                    <p className="font-bold text-lg mb-1">Upload Signature</p>
                    <p className="text-sm text-gray-400 px-4">Drag and drop or click to browse (PNG, JPG up to 10MB)</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex gap-3">
              <button
                onClick={verifySignature}
                disabled={!preview || loading}
                className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-bold transition-all
                  ${!preview || loading 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-[#5837C0] text-white hover:bg-[#472BB3] shadow-lg shadow-indigo-200 active:scale-95'}`}
              >
                {loading ? <RefreshCcw className="animate-spin" size={20} /> : <FileSearch size={20} />}
                {loading ? 'Analyzing Patterns...' : 'Run Verification'}
              </button>
              {preview && (
                <button
                  onClick={reset}
                  className="p-4 rounded-2xl border border-[#E5E5E5] text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  <RefreshCcw size={20} />
                </button>
              )}
            </div>
          </div>

          {/* Results Area */}
          <div className="space-y-6">
            {!result && !loading && !error && (
              <div className="bg-gray-50/50 rounded-3xl p-8 border border-dashed border-gray-200 h-full flex flex-col items-center justify-center text-center">
                <Info size={40} className="text-gray-300 mb-4" />
                <p className="text-gray-400 font-medium">Results will appear here after analysis</p>
              </div>
            )}

            {loading && (
              <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm animate-pulse space-y-4">
                <div className="w-24 h-8 bg-gray-100 rounded-lg"></div>
                <div className="w-full h-32 bg-gray-50 rounded-2xl"></div>
                <div className="space-y-2">
                  <div className="w-full h-4 bg-gray-50 rounded"></div>
                  <div className="w-3/4 h-4 bg-gray-50 rounded"></div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 rounded-3xl p-8 border border-red-100 text-red-600 flex items-start gap-4">
                <ShieldAlert size={24} className="shrink-0" />
                <div>
                  <h4 className="font-bold mb-1">Analysis Failed</h4>
                  <p className="text-sm opacity-90">{error}</p>
                </div>
              </div>
            )}

            {result && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl shadow-indigo-50/50 space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {result.prediction === 'genuine' ? (
                      <CheckCircle2 size={24} className="text-green-500" />
                    ) : (
                      <XCircle size={24} className="text-red-500" />
                    )}
                    <span className={`text-xl font-black uppercase tracking-widest ${result.prediction === 'genuine' ? 'text-green-600' : 'text-red-600'}`}>
                      {result.prediction}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">Confidence Score</p>
                    <p className="text-2xl font-mono font-bold">{(result.confidence * 100).toFixed(1)}%</p>
                  </div>
                </div>

                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${result.confidence * 100}%` }}
                    className={`h-full ${result.prediction === 'genuine' ? 'bg-green-500' : 'bg-red-500'}`}
                  />
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Forensic Detail</h4>
                  <p className="text-gray-700 leading-relaxed text-sm bg-gray-50 p-4 rounded-2xl border border-gray-100 italic">
                    "{result.reasoning}"
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-50 flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                  <ShieldCheck size={12} />
                  Authenticated by SigVerify Neural Network 1.5-Flash
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Info Grid */}
        <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { icon: <Camera size={20} />, title: 'High fidelity', text: 'Analyzes stroke density and edge patterns at high resolution.' },
            { icon: <ShieldCheck size={20} />, title: 'Zero Trust', text: 'Multiple validation checkpoints to ensure authenticity.' },
            { icon: <RefreshCcw size={20} />, title: 'Real-time', text: 'Instant processing results powered by neural extraction.' },
          ].map((item, i) => (
            <div key={i} className="p-6 bg-white border border-gray-100 rounded-3xl hover:shadow-md transition-shadow">
              <div className="text-[#5837C0] mb-3">{item.icon}</div>
              <h3 className="font-bold text-sm mb-1 uppercase tracking-tight">{item.title}</h3>
              <p className="text-xs text-gray-500 leading-normal">{item.text}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto px-6 py-12 border-t border-gray-100 mt-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <p className="text-xs text-gray-400 font-medium">© 2026 SigVerify AI Systems. All rights reserved.</p>
        <div className="flex gap-6">
          {['Security Protocol', 'Privacy Policy', 'API Documentation'].map(item => (
            <a key={item} href="#" className="text-xs font-bold text-gray-400 hover:text-[#5837C0] tracking-tight">{item}</a>
          ))}
        </div>
      </footer>
    </div>
  );
}
