"use client";

import { PrivyProvider } from '@privy-io/react-auth';
import React from 'react';

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <PrivyProvider
            appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || "insert-your-privy-app-id-here"}
            config={{
                loginMethods: ['twitter'],
                appearance: {
                    theme: 'dark',
                    accentColor: '#FFD700',
                    showWalletLoginFirst: false,
                },
            }}
        >
            {children}
        </PrivyProvider>
    );
}
