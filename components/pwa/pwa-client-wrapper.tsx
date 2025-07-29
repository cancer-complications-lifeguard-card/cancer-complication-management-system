'use client';

import dynamic from 'next/dynamic';

// Dynamic import with no SSR to prevent server-side issues
const PWAInstallPrompt = dynamic(() => import('./pwa-install-prompt'), {
  ssr: false,
  loading: () => null
});

interface PWAClientWrapperProps {
  showDetails?: boolean;
}

export default function PWAClientWrapper({ showDetails = false }: PWAClientWrapperProps) {
  return <PWAInstallPrompt showDetails={showDetails} />;
}