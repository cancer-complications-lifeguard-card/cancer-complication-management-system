'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Volume2, Loader2, Play, Pause, RotateCcw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface VoiceInputProps {
  onTranscription: (text: string, confidence: number) => void;
  onError?: (error: string) => void;
  placeholder?: string;
  language?: string;
  continuous?: boolean;
  className?: string;
}

export function VoiceInput({
  onTranscription,
  onError,
  placeholder = "点击麦克风开始语音输入...",
  language = 'zh-CN',
  continuous = false,
  className = ''
}: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    // Check for browser support
    const SpeechRecognition = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      setError('您的浏览器不支持语音识别功能。请使用最新版本的Chrome、Edge或Safari。');
      return;
    }

    // Initialize Speech Recognition
    const recognition = new SpeechRecognition();
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.lang = language;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      setIsProcessing(false);
    };

    recognition.onaudiostart = () => {
      setupAudioLevelMeter();
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';
      let maxConfidence = 0;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        const confidence = result[0].confidence || 0;

        if (result.isFinal) {
          finalTranscript += transcript;
          maxConfidence = Math.max(maxConfidence, confidence);
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        setTranscript(finalTranscript.trim());
        setConfidence(maxConfidence);
        onTranscription(finalTranscript.trim(), maxConfidence);
        
        if (!continuous) {
          stopListening();
        }
      } else if (interimTranscript) {
        setTranscript(interimTranscript.trim());
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      let errorMessage = '语音识别出错';
      
      switch (event.error) {
        case 'no-speech':
          errorMessage = '未检测到语音，请重试';
          break;
        case 'audio-capture':
          errorMessage = '无法访问麦克风，请检查权限设置';
          break;
        case 'not-allowed':
          errorMessage = '麦克风访问被拒绝，请在浏览器设置中允许麦克风权限';
          break;
        case 'network':
          errorMessage = '网络连接问题，请检查网络连接';
          break;
        case 'service-not-allowed':
          errorMessage = '语音服务不可用';
          break;
      }
      
      setError(errorMessage);
      onError?.(errorMessage);
      setIsListening(false);
      setIsProcessing(false);
      cleanupAudioMeter();
    };

    recognition.onend = () => {
      setIsListening(false);
      setIsProcessing(false);
      cleanupAudioMeter();
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      cleanupAudioMeter();
    };
  }, [language, continuous, onTranscription, onError, setupAudioLevelMeter]);

  const setupAudioLevelMeter = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);

      microphoneRef.current.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      
      const updateAudioLevel = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((acc, value) => acc + value, 0) / dataArray.length;
          setAudioLevel(average);
          
          if (isListening) {
            animationRef.current = requestAnimationFrame(updateAudioLevel);
          }
        }
      };
      
      updateAudioLevel();
    } catch (error) {
      console.error('Error setting up audio meter:', error);
    }
  }, [isListening]);

  const cleanupAudioMeter = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    if (microphoneRef.current) {
      microphoneRef.current.disconnect();
      microphoneRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setAudioLevel(0);
  };

  const startListening = () => {
    if (!recognitionRef.current || !isSupported) return;
    
    setTranscript('');
    setConfidence(0);
    setError(null);
    setIsProcessing(true);
    
    try {
      recognitionRef.current.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setError('启动语音识别失败，请重试');
      setIsProcessing(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const clearTranscript = () => {
    setTranscript('');
    setConfidence(0);
    setError(null);
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      utterance.rate = 0.9;
      utterance.pitch = 1;
      speechSynthesis.speak(utterance);
    }
  };

  if (!isSupported) {
    return (
      <Alert className="border-orange-200 bg-orange-50">
        <AlertDescription className="text-orange-800">
          {error || '您的浏览器不支持语音识别功能'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Mic className="h-5 w-5" />
            语音输入
          </CardTitle>
          <div className="flex items-center gap-2">
            {confidence > 0 && (
              <Badge variant={confidence > 0.8 ? 'default' : confidence > 0.6 ? 'secondary' : 'outline'}>
                准确度: {Math.round(confidence * 100)}%
              </Badge>
            )}
            {transcript && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => speakText(transcript)}
                title="朗读内容"
              >
                <Volume2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Audio Level Meter */}
        {isListening && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">音量:</span>
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all duration-100"
                style={{ width: `${Math.min(audioLevel * 2, 100)}%` }}
              />
            </div>
            <Badge variant="outline" className="text-xs">
              {Math.round(audioLevel)}
            </Badge>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex gap-3 justify-center">
          <Button
            onClick={isListening ? stopListening : startListening}
            disabled={isProcessing}
            className={`flex items-center gap-2 ${
              isListening ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isListening ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
            {isProcessing ? '准备中...' : isListening ? '停止录音' : '开始录音'}
          </Button>
          
          {transcript && (
            <Button
              variant="outline"
              onClick={clearTranscript}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              清空
            </Button>
          )}
        </div>

        {/* Transcript Display */}
        <div className="min-h-[80px] p-3 bg-gray-50 rounded-lg border">
          {transcript ? (
            <p className="text-gray-800 leading-relaxed">{transcript}</p>
          ) : (
            <p className="text-gray-500 italic">{placeholder}</p>
          )}
        </div>

        {/* Voice Commands Help */}
        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>语音指令示例:</strong></p>
          <div className="grid grid-cols-2 gap-2">
            <p>• "我今天感到恶心"</p>
            <p>• "记录体温38.5度"</p>
            <p>• "查找附近医院"</p>
            <p>• "设置用药提醒"</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}