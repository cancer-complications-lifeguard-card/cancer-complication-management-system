import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { pushSubscriptions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { subscription, userAgent } = await request.json();
    
    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: 'Invalid subscription data' },
        { status: 400 }
      );
    }
    
    // For now, we'll store with a mock user ID
    // In production, this should come from authentication
    const userId = 'demo-user';
    
    // Check if subscription already exists
    const existingSubscription = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, subscription.endpoint))
      .limit(1);
    
    if (existingSubscription.length > 0) {
      // Update existing subscription
      await db
        .update(pushSubscriptions)
        .set({
          p256dhKey: subscription.keys?.p256dh,
          authKey: subscription.keys?.auth,
          userAgent: userAgent || null,
          updatedAt: new Date()
        })
        .where(eq(pushSubscriptions.endpoint, subscription.endpoint));
    } else {
      // Create new subscription
      await db.insert(pushSubscriptions).values({
        userId,
        endpoint: subscription.endpoint,
        p256dhKey: subscription.keys?.p256dh,
        authKey: subscription.keys?.auth,
        userAgent: userAgent || null,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Push subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to save subscription' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { endpoint } = await request.json();
    
    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint required' },
        { status: 400 }
      );
    }
    
    await db
      .delete(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, endpoint));
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Push subscription deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete subscription' },
      { status: 500 }
    );
  }
}