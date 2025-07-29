import { NextRequest, NextResponse } from 'next/server';
import { getEmergencyCardByCardId } from '@/lib/db/emergency-queries';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cardId = searchParams.get('cardId');

    if (!cardId) {
      return NextResponse.json({ error: 'Card ID is required' }, { status: 400 });
    }

    const card = await getEmergencyCardByCardId(cardId);
    
    if (!card) {
      return NextResponse.json({ error: 'Emergency card not found or inactive' }, { status: 404 });
    }

    // Return parsed emergency information for medical professionals
    const emergencyInfo = {
      cardId: card.cardId,
      patientInfo: JSON.parse(card.medicalInfo),
      emergencyContacts: JSON.parse(card.emergencyContacts),
      allergies: card.allergies ? JSON.parse(card.allergies) : null,
      medications: card.medications ? JSON.parse(card.medications) : null,
      medicalConditions: card.medicalConditions ? JSON.parse(card.medicalConditions) : null,
      bloodType: card.bloodType,
      insuranceInfo: card.insuranceInfo ? JSON.parse(card.insuranceInfo) : null,
      lastUpdated: card.lastUpdated,
    };

    return NextResponse.json(emergencyInfo);
  } catch (error) {
    console.error('Error scanning emergency card:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}