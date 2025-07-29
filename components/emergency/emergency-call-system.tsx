'use client';

import { useState, useEffect } from 'react';
import { Phone, MapPin, Clock, AlertTriangle, Heart, PhoneCall, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
// Emergency numbers constant (moved from database layer to avoid client-side DB issues)
const EMERGENCY_NUMBERS = {
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

interface EmergencyCall {
  id: number;
  callType: string;
  phoneNumber: string;
  timestamp: string;
  callStatus: string;
  callDuration?: number;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
}

interface EmergencyCallSystemProps {
  userId: number;
  emergencyCardId?: number;
}

interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  isPrimary?: boolean;
}

export function EmergencyCallSystem({ userId, emergencyCardId }: EmergencyCallSystemProps) {
  const [callHistory, setCallHistory] = useState<EmergencyCall[]>([]);
  const [currentCall, setCurrentCall] = useState<EmergencyCall | null>(null);
  const [showCallDialog, setShowCallDialog] = useState(false);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);

  useEffect(() => {
    fetchCallHistory();
    fetchEmergencyCard();
    getCurrentLocation();
  }, [userId]);

  const fetchCallHistory = async () => {
    try {
      const response = await fetch('/api/emergency-calls');
      if (response.ok) {
        const data = await response.json();
        setCallHistory(data);
      }
    } catch (error) {
      console.error('Error fetching call history:', error);
    }
  };

  const fetchEmergencyCard = async () => {
    try {
      const response = await fetch('/api/emergency-cards');
      if (response.ok) {
        const data = await response.json();
        if (data && data.emergencyContacts) {
          setEmergencyContacts(data.emergencyContacts);
        }
      }
    } catch (error) {
      console.error('Error fetching emergency card:', error);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  };

  const initiateCall = async (callType: '120' | 'hospital' | 'family', phoneNumber: string, contactName?: string) => {
    if (!emergencyCardId) {
      alert('请先创建急救卡');
      return;
    }

    try {
      // Log the call
      const callData = {
        emergencyCardId,
        callType,
        phoneNumber,
        location: userLocation,
        notes: contactName ? `呼叫联系人: ${contactName}` : undefined,
      };

      const response = await fetch('/api/emergency-calls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(callData),
      });

      if (response.ok) {
        const callLog = await response.json();
        setCurrentCall(callLog);
        setShowCallDialog(true);
        
        // Initiate actual phone call
        window.location.href = `tel:${phoneNumber}`;
        
        // Update call status after a delay (simulating call duration)
        setTimeout(() => {
          updateCallStatus(callLog.id, 'connected');
        }, 2000);
      }
    } catch (error) {
      console.error('Error initiating call:', error);
    }
  };

  const updateCallStatus = async (callId: number, status: string, duration?: number) => {
    try {
      await fetch('/api/emergency-calls', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ callId, status, duration }),
      });
      
      fetchCallHistory();
    } catch (error) {
      console.error('Error updating call status:', error);
    }
  };

  const handleEmergencyCall = (type: '120' | 'hospital' | 'family', number: string, name?: string) => {
    setSelectedContact({ type, number, name });
    setShowCallDialog(true);
  };

  const confirmCall = () => {
    if (selectedContact) {
      initiateCall(selectedContact.type, selectedContact.number, selectedContact.name);
      setSelectedContact(null);
    }
  };

  const getCallStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'connected':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCallStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return '已完成';
      case 'connected':
        return '已接通';
      case 'failed':
        return '呼叫失败';
      case 'initiated':
        return '呼叫中';
      default:
        return status;
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Emergency Call Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 120 Emergency Call */}
        <Card className="border-red-200 hover:border-red-300 transition-colors">
          <CardHeader className="pb-3">
            <CardTitle className="text-red-700 flex items-center gap-2">
              <Phone className="h-5 w-5" />
              120 急救电话
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              {EMERGENCY_NUMBERS['120'].description}
            </p>
            <Button 
              onClick={() => handleEmergencyCall('120', '120')}
              className="w-full bg-red-600 hover:bg-red-700"
              size="lg"
            >
              <PhoneCall className="h-4 w-4 mr-2" />
              呼叫 120
            </Button>
          </CardContent>
        </Card>

        {/* Other Emergency Numbers */}
        <Card className="border-orange-200 hover:border-orange-300 transition-colors">
          <CardHeader className="pb-3">
            <CardTitle className="text-orange-700 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              其他紧急电话
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.values(EMERGENCY_NUMBERS).slice(1).map((emergency) => (
                <Button 
                  key={emergency.number}
                  variant="outline" 
                  onClick={() => handleEmergencyCall('hospital', emergency.number)}
                  className="w-full justify-start"
                  size="sm"
                >
                  <Phone className="h-3 w-3 mr-2" />
                  {emergency.number} - {emergency.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Emergency Contacts */}
      {emergencyContacts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              紧急联系人
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {emergencyContacts.map((contact, index) => (
                <div key={index} className="p-3 border rounded-lg flex justify-between items-center">
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {contact.name}
                      {contact.isPrimary && (
                        <Badge variant="default" className="text-xs">主要</Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">{contact.relationship}</div>
                    <div className="text-sm text-gray-500">{contact.phone}</div>
                  </div>
                  <Button 
                    onClick={() => handleEmergencyCall('family', contact.phone, contact.name)}
                    size="sm"
                    variant="outline"
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Call History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            通话记录
          </CardTitle>
        </CardHeader>
        <CardContent>
          {callHistory.length === 0 ? (
            <div className="text-center py-8">
              <Phone className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">暂无通话记录</p>
            </div>
          ) : (
            <div className="space-y-3">
              {callHistory.slice(0, 10).map((call) => (
                <div key={call.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-full">
                      <Phone className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">{call.phoneNumber}</div>
                      <div className="text-sm text-gray-600">
                        {call.callType === '120' && '急救电话'}
                        {call.callType === 'hospital' && '医院电话'}
                        {call.callType === 'family' && '家属联系'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(call.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getCallStatusColor(call.callStatus)}>
                      {getCallStatusLabel(call.callStatus)}
                    </Badge>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatDuration(call.callDuration)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Call Confirmation Dialog */}
      <Dialog open={showCallDialog} onOpenChange={setShowCallDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-700">确认紧急呼叫</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div>
                <div className="font-medium">
                  {selectedContact?.type === '120' && '即将呼叫 120 急救电话'}
                  {selectedContact?.type === 'hospital' && '即将呼叫医院电话'}
                  {selectedContact?.type === 'family' && `即将呼叫 ${selectedContact?.name}`}
                </div>
                <div className="text-sm text-gray-600">
                  号码: {selectedContact?.number}
                </div>
              </div>
            </div>
            
            {userLocation && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>当前位置: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}</span>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button onClick={confirmCall} className="flex-1 bg-red-600 hover:bg-red-700">
                <PhoneCall className="h-4 w-4 mr-2" />
                确认呼叫
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCallDialog(false);
                  setSelectedContact(null);
                }}
                className="flex-1"
              >
                取消
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}