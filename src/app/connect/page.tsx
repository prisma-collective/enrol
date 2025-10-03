"use client";

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image'; 
import '../globals.css'; 

export default function WalletConnect() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WalletConnectContent />
    </Suspense>
  );
}

function WalletConnectContent() {
  const searchParams = useSearchParams();
  const name = searchParams.get('name');
  const submission_id = searchParams.get('submission_id');
  const respondent_id = searchParams.get('respondent_id');
  const stakeholderType = searchParams.get('type');

  useEffect(() => {
    // Logic to check if a wallet is already connected
    // If connected, redirect to a success page or dashboard
  }, []);
  
  const connectWallet = async () => {
    // Logic to connect to an existing wallet
    // Use a Cardano wallet library to handle the connection
  };
  
  const createWallet = async () => {
    // Logic to create a new wallet
    // Use a Cardano wallet library to handle wallet creation
  };

  return (
    <div className="h-screen relative">
      <div className="mesh-gradient absolute inset-0 z-10" />
      <div className="min-h-screen flex flex-col items-center justify-center relative z-20 pt-5 pb-5">
        <a href="https://prisma.events" target="_blank" rel="noopener noreferrer" className="mb-6">
          <Image 
              src="/logo_colour.svg" 
              alt="Prisma Events Logo" 
              className="h-16 w-auto animate-spin-slow" 
              width={64} // Specify width
              height={64} // Specify height
          />
        </a>

        <div className="container mx-auto px-16">
          <h1 className="text-4xl font-bold mb-8 text-center text-white">
            Welcome, {name}
          </h1>
        </div>

        <div className="container mx-auto px-16 max-w-2xl">
          {/* Static card containing the wallet connection form */}
          <div className="relative bg-gray-800 bg-opacity-70 rounded-xl border border-gray-600 shadow-lg overflow-hidden flex flex-col">
            <div className="p-6 flex flex-col items-center justify-center">
              <h2 className="text-2xl font-semibold text-white mb-4">
                Wallet Setup
              </h2>

              {/* Instructions */}
              <p className="text-gray-300 mb-6 text-center">
                To proceed with your registration, please connect your Cardano wallet or create a new one.
              </p>
              <p className="text-gray-300 mb-6 text-center">
                Submission ID: {submission_id}
              </p>
              <p className="text-gray-300 mb-6 text-center">
                Respondent ID: {respondent_id}
              </p>
              <p className="text-gray-300 mb-6 text-center">
                Stakeholder type: {stakeholderType}
              </p>

              {/* Wallet connection buttons */}
              <div className="flex flex-col space-y-4">
                {/* Connect existing wallet button */}
                <button
                  onClick={connectWallet} /* This function would handle wallet connection */
                  className="bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors duration-300"
                >
                  Connect Existing Wallet
                </button>

                {/* Create new wallet button */}
                <button
                  onClick={createWallet} /* This function would handle wallet creation */
                  className="bg-gray-800 text-white font-semibold py-3 px-6 rounded-lg hover:bg-green-700 transition-colors duration-300"
                >
                  Create New Wallet
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
