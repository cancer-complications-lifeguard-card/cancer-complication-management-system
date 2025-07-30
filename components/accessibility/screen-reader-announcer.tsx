"use client";

import { useEffect, useState } from 'react';

interface ScreenReaderAnnouncerProps {
  announcement?: string;
  priority?: 'polite' | 'assertive';
  delay?: number;
}

export function ScreenReaderAnnouncer({ 
  announcement, 
  priority = 'polite', 
  delay = 500 
}: ScreenReaderAnnouncerProps) {
  const [currentAnnouncement, setCurrentAnnouncement] = useState('');

  useEffect(() => {
    if (announcement) {
      // Clear any existing announcement
      setCurrentAnnouncement('');
      
      // Set new announcement after a brief delay
      const timer = setTimeout(() => {
        setCurrentAnnouncement(announcement);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [announcement, delay]);

  return (
    <div
      role="status"
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    >
      {currentAnnouncement}
    </div>
  );
}

// Custom hook for screen reader announcements
export function useScreenReader() {
  const [announcement, setAnnouncement] = useState<string>('');
  const [priority, setPriority] = useState<'polite' | 'assertive'>('polite');

  const announce = (message: string, urgency: 'polite' | 'assertive' = 'polite') => {
    setAnnouncement(''); // Clear first to trigger re-read
    setPriority(urgency);
    setTimeout(() => setAnnouncement(message), 100);
  };

  const announceVitalSigns = (heartRate: number, bloodPressure: string, temperature: number) => {
    const message = `Vital signs updated. Heart rate: ${heartRate} beats per minute. Blood pressure: ${bloodPressure}. Temperature: ${temperature} degrees Celsius.`;
    announce(message, 'polite');
  };

  const announceAlert = (level: string, message: string) => {
    const alertMessage = `${level} alert: ${message}`;
    announce(alertMessage, level === 'critical' ? 'assertive' : 'polite');
  };

  return {
    announcement,
    priority,
    announce,
    announceVitalSigns,
    announceAlert,
    component: <ScreenReaderAnnouncer announcement={announcement} priority={priority} />
  };
}