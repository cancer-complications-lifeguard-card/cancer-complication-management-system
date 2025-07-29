import { eq, and } from 'drizzle-orm';
import { db } from './drizzle';
import { emergencyCards, emergencyCallLogs, users, type EmergencyCard, type NewEmergencyCard, type EmergencyCallLog, type NewEmergencyCallLog } from './schema';
import QRCode from 'qrcode';

/**
 * Generate a unique 16-character card ID
 */
function generateCardId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate QR code from emergency card data
 */
async function generateQRCode(cardData: any): Promise<string> {
  try {
    const qrDataUrl = await QRCode.toDataURL(JSON.stringify(cardData), {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      margin: 1,
      width: 256,
    });
    return qrDataUrl;
  } catch (error) {
    console.error('QR Code generation failed:', error);
    return '';
  }
}

/**
 * Create a new emergency card for a user
 */
export async function createEmergencyCard(userId: number, cardData: {
  emergencyContacts: Array<{
    name: string;
    relationship: string;
    phone: string;
    isPrimary?: boolean;
  }>;
  medicalInfo: {
    patientName: string;
    age: number;
    cancerType?: string;
    treatmentPhase?: string;
    currentTreatments?: string[];
    criticalNotes?: string;
  };
  allergies?: string[];
  medications?: Array<{
    name: string;
    dosage: string;
    frequency: string;
  }>;
  medicalConditions?: string[];
  bloodType?: string;
  insuranceInfo?: {
    provider: string;
    policyNumber: string;
    groupNumber?: string;
  };
}): Promise<EmergencyCard> {
  const cardId = generateCardId();
  
  // Prepare QR code data
  const qrData = {
    cardId,
    patientName: cardData.medicalInfo.patientName,
    emergencyContacts: cardData.emergencyContacts,
    medicalInfo: cardData.medicalInfo,
    allergies: cardData.allergies,
    medications: cardData.medications,
    bloodType: cardData.bloodType,
    timestamp: new Date().toISOString(),
  };

  const qrCode = await generateQRCode(qrData);

  const newCard: NewEmergencyCard = {
    userId,
    cardId,
    qrCode,
    emergencyContacts: JSON.stringify(cardData.emergencyContacts),
    medicalInfo: JSON.stringify(cardData.medicalInfo),
    allergies: cardData.allergies ? JSON.stringify(cardData.allergies) : null,
    medications: cardData.medications ? JSON.stringify(cardData.medications) : null,
    medicalConditions: cardData.medicalConditions ? JSON.stringify(cardData.medicalConditions) : null,
    bloodType: cardData.bloodType || null,
    insuranceInfo: cardData.insuranceInfo ? JSON.stringify(cardData.insuranceInfo) : null,
  };

  const [card] = await db.insert(emergencyCards).values(newCard).returning();
  return card;
}

/**
 * Get emergency card by user ID
 */
export async function getEmergencyCardByUserId(userId: number): Promise<EmergencyCard | null> {
  const cards = await db
    .select()
    .from(emergencyCards)
    .where(and(eq(emergencyCards.userId, userId), eq(emergencyCards.isActive, true)))
    .limit(1);

  return cards[0] || null;
}

/**
 * Get emergency card by card ID (for QR code scanning)
 */
export async function getEmergencyCardByCardId(cardId: string): Promise<EmergencyCard | null> {
  const cards = await db
    .select()
    .from(emergencyCards)
    .where(and(eq(emergencyCards.cardId, cardId), eq(emergencyCards.isActive, true)))
    .limit(1);

  return cards[0] || null;
}

/**
 * Update emergency card information
 */
export async function updateEmergencyCard(cardId: string, updates: Partial<{
  emergencyContacts: any[];
  medicalInfo: any;
  allergies: string[];
  medications: any[];
  medicalConditions: string[];
  bloodType: string;
  insuranceInfo: any;
}>): Promise<EmergencyCard> {
  // Generate new QR code if critical data is updated
  const currentCard = await getEmergencyCardByCardId(cardId);
  if (!currentCard) {
    throw new Error('Emergency card not found');
  }

  let qrCode = currentCard.qrCode;
  if (updates.emergencyContacts || updates.medicalInfo || updates.allergies || updates.medications || updates.bloodType) {
    const qrData = {
      cardId,
      patientName: updates.medicalInfo?.patientName || JSON.parse(currentCard.medicalInfo).patientName,
      emergencyContacts: updates.emergencyContacts || JSON.parse(currentCard.emergencyContacts),
      medicalInfo: updates.medicalInfo || JSON.parse(currentCard.medicalInfo),
      allergies: updates.allergies || (currentCard.allergies ? JSON.parse(currentCard.allergies) : null),
      medications: updates.medications || (currentCard.medications ? JSON.parse(currentCard.medications) : null),
      bloodType: updates.bloodType || currentCard.bloodType,
      timestamp: new Date().toISOString(),
    };
    qrCode = await generateQRCode(qrData);
  }

  const updateData: any = {
    lastUpdated: new Date(),
    qrCode,
  };

  if (updates.emergencyContacts) updateData.emergencyContacts = JSON.stringify(updates.emergencyContacts);
  if (updates.medicalInfo) updateData.medicalInfo = JSON.stringify(updates.medicalInfo);
  if (updates.allergies) updateData.allergies = JSON.stringify(updates.allergies);
  if (updates.medications) updateData.medications = JSON.stringify(updates.medications);
  if (updates.medicalConditions) updateData.medicalConditions = JSON.stringify(updates.medicalConditions);
  if (updates.bloodType) updateData.bloodType = updates.bloodType;
  if (updates.insuranceInfo) updateData.insuranceInfo = JSON.stringify(updates.insuranceInfo);

  const [updatedCard] = await db
    .update(emergencyCards)
    .set(updateData)
    .where(eq(emergencyCards.cardId, cardId))
    .returning();

  return updatedCard;
}

/**
 * Deactivate emergency card
 */
export async function deactivateEmergencyCard(cardId: string): Promise<void> {
  await db
    .update(emergencyCards)
    .set({ isActive: false })
    .where(eq(emergencyCards.cardId, cardId));
}

/**
 * Log emergency call
 */
export async function logEmergencyCall(callData: {
  userId: number;
  emergencyCardId: number;
  callType: '120' | 'hospital' | 'family';
  phoneNumber: string;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  notes?: string;
}): Promise<EmergencyCallLog> {
  const newCallLog: NewEmergencyCallLog = {
    userId: callData.userId,
    emergencyCardId: callData.emergencyCardId,
    callType: callData.callType,
    phoneNumber: callData.phoneNumber,
    location: callData.location ? JSON.stringify(callData.location) : null,
    notes: callData.notes || null,
  };

  const [callLog] = await db.insert(emergencyCallLogs).values(newCallLog).returning();
  return callLog;
}

/**
 * Update emergency call status
 */
export async function updateEmergencyCallStatus(
  callId: number,
  status: 'initiated' | 'connected' | 'completed' | 'failed',
  duration?: number
): Promise<void> {
  const updateData: any = { callStatus: status };
  if (duration !== undefined) {
    updateData.callDuration = duration;
  }

  await db
    .update(emergencyCallLogs)
    .set(updateData)
    .where(eq(emergencyCallLogs.id, callId));
}

/**
 * Get emergency call history for a user
 */
export async function getEmergencyCallHistory(userId: number): Promise<EmergencyCallLog[]> {
  return await db
    .select()
    .from(emergencyCallLogs)
    .where(eq(emergencyCallLogs.userId, userId))
    .orderBy(emergencyCallLogs.timestamp);
}

/**
 * Get emergency card with parsed JSON fields for display
 */
export async function getEmergencyCardForDisplay(userId: number): Promise<any | null> {
  const card = await getEmergencyCardByUserId(userId);
  if (!card) return null;

  return {
    ...card,
    emergencyContacts: JSON.parse(card.emergencyContacts),
    medicalInfo: JSON.parse(card.medicalInfo),
    allergies: card.allergies ? JSON.parse(card.allergies) : null,
    medications: card.medications ? JSON.parse(card.medications) : null,
    medicalConditions: card.medicalConditions ? JSON.parse(card.medicalConditions) : null,
    insuranceInfo: card.insuranceInfo ? JSON.parse(card.insuranceInfo) : null,
  };
}

/**
 * Emergency numbers for different regions (China-focused)
 */
export const EMERGENCY_NUMBERS = {
  '120': {
    number: '120',
    name: '医疗急救电话',
    description: '全国统一医疗急救电话',
  },
  '110': {
    number: '110',
    name: '公安报警电话',
    description: '遇到危险或需要警察协助',
  },
  '119': {
    number: '119',
    name: '火警电话',
    description: '火灾报警和救援',
  },
  '122': {
    number: '122',
    name: '交通事故报警电话',
    description: '交通事故处理',
  },
};