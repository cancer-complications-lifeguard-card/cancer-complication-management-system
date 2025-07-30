"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Volume2, VolumeX, Settings, AlertCircle } from 'lucide-react';
import { useScreenReader } from '@/components/accessibility/screen-reader-announcer';

interface VoiceCommand {
  command: string;
  action: string;
  category: 'navigation' | 'emergency' | 'monitoring' | 'general';
}

const VOICE_COMMANDS: VoiceCommand[] = [
  // Navigation commands
  { command: '打开监测页面', action: '/dashboard/monitoring', category: 'navigation' },
  { command: '打开急救页面', action: '/dashboard/emergency', category: 'navigation' },
  { command: '打开知识库', action: '/dashboard/knowledge', category: 'navigation' },
  { command: '打开用户档案', action: '/dashboard/profile', category: 'navigation' },
  
  // Emergency commands
  { command: '紧急求助', action: 'emergency_call', category: 'emergency' },
  { command: '呼叫救护车', action: 'call_ambulance', category: 'emergency' },
  { command: '联系家人', action: 'contact_family', category: 'emergency' },
  { command: '显示医疗信息', action: 'show_medical_info', category: 'emergency' },
  
  // Monitoring commands
  { command: '记录症状', action: 'record_symptom', category: 'monitoring' },
  { command: '查看生命体征', action: 'view_vitals', category: 'monitoring' },
  { command: '检查用药提醒', action: 'check_medication', category: 'monitoring' },
  { command: '开始监测', action: 'start_monitoring', category: 'monitoring' },
  
  // General commands
  { command: '帮助', action: 'show_help', category: 'general' },
  { command: '设置', action: 'show_settings', category: 'general' },
  { command: '朗读当前页面', action: 'read_page', category: 'general' },
  { command: '重复上次结果', action: 'repeat_last', category: 'general' },
];

interface EnhancedVoiceCommandsProps {
  onCommand?: (action: string) => void;
  className?: string;
}

export function EnhancedVoiceCommands({ onCommand, className = "" }: EnhancedVoiceCommandsProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [lastCommand, setLastCommand] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showCommands, setShowCommands] = useState(false);
  const recognitionRef = useRef<any>(null);
  const speechSynthesisRef = useRef<any>(null);
  const { announce, announceAlert } = useScreenReader();

  useEffect(() => {
    // Check if browser supports speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'zh-CN';
      
      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
            setConfidence(event.results[i][0].confidence);
          } else {
            interimTranscript += transcript;
          }
        }
        
        setTranscript(finalTranscript || interimTranscript);
        
        if (finalTranscript) {
          handleVoiceCommand(finalTranscript.trim());
        }
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        announceAlert('warning', `语音识别出错: ${event.error}`);\n        setIsListening(false);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
    }
    
    // Check if browser supports speech synthesis
    if ('speechSynthesis' in window) {
      speechSynthesisRef.current = window.speechSynthesis;
    }
  }, []);

  const handleVoiceCommand = (spokenText: string) => {
    const normalizedText = spokenText.toLowerCase();
    
    // Find matching command
    const matchedCommand = VOICE_COMMANDS.find(cmd => 
      normalizedText.includes(cmd.command.toLowerCase()) ||
      cmd.command.toLowerCase().includes(normalizedText)
    );
    
    if (matchedCommand) {
      setLastCommand(matchedCommand.command);
      executeCommand(matchedCommand);
      announce(`已执行命令: ${matchedCommand.command}`, 'polite');
      speak(`好的，正在${matchedCommand.command}`);
    } else {
      announce('未识别的命令，请重试', 'polite');
      speak('抱歉，我没有理解您的指令，请重试');
    }
  };

  const executeCommand = (command: VoiceCommand) => {
    if (onCommand) {
      onCommand(command.action);
      return;
    }

    // Default command handling
    switch (command.action) {
      case 'emergency_call':
        announceAlert('critical', '正在启动紧急求助功能');
        break;
      case 'call_ambulance':
        announceAlert('critical', '正在呼叫救护车');
        break;
      case 'show_help':
        setShowCommands(true);
        announce('显示语音命令帮助', 'polite');
        break;
      case 'read_page':
        readCurrentPage();
        break;
      case 'repeat_last':
        if (lastCommand) {
          speak(`上次执行的命令是: ${lastCommand}`);
        } else {
          speak('没有上次执行的命令');
        }
        break;
      default:
        if (command.action.startsWith('/')) {
          // Navigation command
          window.location.href = command.action;
        }
        break;
    }
  };

  const speak = (text: string) => {
    if (speechSynthesisRef.current) {
      // Stop any current speech
      speechSynthesisRef.current.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      speechSynthesisRef.current.speak(utterance);
    }
  };

  const readCurrentPage = () => {
    const mainContent = document.querySelector('main') || document.querySelector('[role="main"]') || document.body;
    const textContent = mainContent?.textContent || '';
    const cleanText = textContent.replace(/\s+/g, ' ').trim();
    
    if (cleanText) {
      speak(cleanText.substring(0, 500) + (cleanText.length > 500 ? '...更多内容请继续探索' : ''));
    } else {
      speak('页面内容为空');
    }
  };

  const startListening = () => {
    if (recognitionRef.current && isSupported) {
      setTranscript('');
      setIsListening(true);
      announce('开始语音识别', 'polite');
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      announce('结束语音识别', 'polite');
    }
  };

  const stopSpeaking = () => {
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  if (!isSupported) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="flex items-center gap-2 text-muted-foreground">
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm">您的浏览器不支持语音识别功能</span>
        </div>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Mic className="h-5 w-5" />
            语音助手
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCommands(!showCommands)}
            className="min-h-[44px] min-w-[44px]"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            variant={isListening ? "destructive" : "default"}
            onClick={isListening ? stopListening : startListening}
            className="flex items-center gap-2 min-h-[44px]"
            disabled={isSpeaking}
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            {isListening ? '停止监听' : '开始语音识别'}
          </Button>

          {isSpeaking && (
            <Button
              variant="outline"
              onClick={stopSpeaking}
              className="flex items-center gap-2 min-h-[44px]"
            >
              <VolumeX className="h-4 w-4" />
              停止朗读
            </Button>
          )}
        </div>

        {/* Current transcript */}
        {transcript && (
          <div className="mb-4 p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">识别内容:</span>
              {confidence > 0 && (
                <Badge variant={confidence > 0.8 ? "default" : "secondary"}>
                  置信度: {Math.round(confidence * 100)}%
                </Badge>
              )}
            </div>
            <p className="text-sm">{transcript}</p>
          </div>
        )}

        {/* Last executed command */}
        {lastCommand && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <span className="text-sm font-medium text-green-800 dark:text-green-200">
              上次命令: {lastCommand}
            </span>
          </div>
        )}

        {/* Status indicators */}
        <div className="flex items-center gap-4 text-sm">
          <div className={`flex items-center gap-1 ${isListening ? 'text-green-600' : 'text-muted-foreground'}`}>
            <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
            {isListening ? '正在监听...' : '等待语音指令'}
          </div>
          
          {isSpeaking && (
            <div className="flex items-center gap-1 text-blue-600">
              <Volume2 className="h-4 w-4" />
              正在朗读...
            </div>
          )}
        </div>
      </Card>

      {/* Available commands */}
      {showCommands && (
        <Card className="p-4">
          <h4 className="font-semibold mb-3">可用语音命令</h4>
          <div className="space-y-3">
            {['navigation', 'emergency', 'monitoring', 'general'].map(category => (
              <div key={category}>
                <h5 className="text-sm font-medium text-muted-foreground mb-2 capitalize">
                  {category === 'navigation' ? '页面导航' :
                   category === 'emergency' ? '紧急功能' :
                   category === 'monitoring' ? '健康监测' : '通用功能'}
                </h5>
                <div className="grid gap-2">
                  {VOICE_COMMANDS.filter(cmd => cmd.category === category).map((cmd, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <span className="text-sm font-medium">"{cmd.command}"</span>
                      <Badge variant="outline" className="text-xs">
                        {cmd.category === 'emergency' ? '紧急' : '常规'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}