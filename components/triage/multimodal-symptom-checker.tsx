'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MessageCircle, 
  Mic, 
  Camera, 
  Send, 
  Loader2, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Brain
} from 'lucide-react';
import { VoiceInput } from '../interface/voice-input';
import { ImageInput } from '../interface/image-input';

interface SymptomData {
  text?: string;
  voice?: {
    transcript: string;
    confidence: number;
  };
  images?: Record<string, unknown>[];
  timestamp: string;
}

interface TriageResult {
  severity: 'low' | 'moderate' | 'high' | 'critical';
  recommendations: string[];
  nextSteps: string[];
  urgency: number;
  confidence: number;
  analysis: {
    textAnalysis?: Record<string, unknown>;
    imageAnalysis?: Record<string, unknown>;
    voiceAnalysis?: Record<string, unknown>;
  };
}

interface MultimodalSymptomCheckerProps {
  userId: number;
  onTriageResult?: (result: TriageResult) => void;
  onSymptomSubmit?: (symptomData: SymptomData) => void;
  className?: string;
}

export function MultimodalSymptomChecker({
  userId,
  onTriageResult,
  onSymptomSubmit,
  className = ''
}: MultimodalSymptomCheckerProps) {
  const [activeTab, setActiveTab] = useState('text');
  const [textInput, setTextInput] = useState('');
  const [voiceData, setVoiceData] = useState<{transcript: string; confidence: number} | null>(null);
  const [images, setImages] = useState<Record<string, unknown>[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const handleTextSubmit = useCallback(async () => {
    if (!textInput.trim()) return;
    
    const symptomData: SymptomData = {
      text: textInput.trim(),
      timestamp: new Date().toISOString()
    };
    
    await processSymptoms(symptomData);
  }, [textInput]);

  const handleVoiceTranscription = useCallback((transcript: string, confidence: number) => {
    const voiceData = { transcript, confidence };
    setVoiceData(voiceData);
    
    const symptomData: SymptomData = {
      voice: voiceData,
      timestamp: new Date().toISOString()
    };
    
    processSymptoms(symptomData);
  }, []);

  const handleImagesSelected = useCallback((selectedImages: Record<string, unknown>[]) => {
    setImages(selectedImages);
  }, []);

  const handleImageAnalyze = useCallback(async () => {
    // Mock image analysis - in real implementation, this would call an AI service
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      detectedSymptoms: ['皮肤红斑', '轻微肿胀'],
      severity: 'moderate',
      confidence: 0.85,
      recommendations: ['监测变化', '如症状加重请及时就医']
    };
  }, []);

  const processSymptoms = async (symptomData: SymptomData) => {
    setIsProcessing(true);
    setError(null);
    setProgress(0);
    
    try {
      // Submit symptom data
      onSymptomSubmit?.(symptomData);
      
      // Simulate AI analysis progress
      for (let i = 0; i <= 100; i += 10) {
        setProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Mock AI triage analysis
      const mockResult: TriageResult = await performTriageAnalysis(symptomData);
      
      setTriageResult(mockResult);
      onTriageResult?.(mockResult);
      
    } catch (err) {
      setError('症状分析失败，请重试');
      console.error('Symptom processing error:', err);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const performTriageAnalysis = async (symptomData: SymptomData): Promise<TriageResult> => {
    // Mock AI analysis - in real implementation, this would call medical AI services
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const symptoms = symptomData.text || symptomData.voice?.transcript || '';
    
    // Simple keyword-based severity assessment (mock)
    let severity: TriageResult['severity'] = 'low';
    let urgency = 1;
    
    const criticalKeywords = ['严重疼痛', '呼吸困难', '胸闷', '昏迷', '大出血'];
    const highKeywords = ['剧烈疼痛', '高烧', '呕吐不止', '心律不齐'];
    const moderateKeywords = ['疼痛', '发热', '恶心', '头晕'];
    
    if (criticalKeywords.some(keyword => symptoms.includes(keyword))) {
      severity = 'critical';
      urgency = 4;
    } else if (highKeywords.some(keyword => symptoms.includes(keyword))) {
      severity = 'high';
      urgency = 3;
    } else if (moderateKeywords.some(keyword => symptoms.includes(keyword))) {
      severity = 'moderate';
      urgency = 2;
    }
    
    const recommendations = getRecommendations(severity);
    const nextSteps = getNextSteps(severity);
    
    return {
      severity,
      recommendations,
      nextSteps,
      urgency,
      confidence: symptomData.voice?.confidence || 0.8,
      analysis: {
        textAnalysis: symptomData.text ? { keySymptoms: extractKeywords(symptoms) } : undefined,
        voiceAnalysis: symptomData.voice ? { confidence: symptomData.voice.confidence } : undefined,
        imageAnalysis: images.length > 0 ? { imagesAnalyzed: images.length } : undefined
      }
    };
  };

  const extractKeywords = (text: string): string[] => {
    const keywords = ['疼痛', '发热', '恶心', '头晕', '呕吐', '腹泻', '皮疹', '肿胀'];
    return keywords.filter(keyword => text.includes(keyword));
  };

  const getRecommendations = (severity: TriageResult['severity']): string[] => {
    switch (severity) {
      case 'critical':
        return [
          '立即前往最近的急诊科',
          '拨打120急救电话',
          '准备医疗卡片和药物清单',
          '通知紧急联系人'
        ];
      case 'high':
        return [
          '尽快就医，不要延误',
          '准备相关病历资料',
          '如症状恶化立即前往急诊',
          '联系您的主治医生'
        ];
      case 'moderate':
        return [
          '建议24小时内就医',
          '密切观察症状变化',
          '记录症状详细信息',
          '可先联系家庭医生咨询'
        ];
      default:
        return [
          '继续观察症状',
          '保持充分休息',
          '如症状持续或加重请及时就医',
          '记录症状日记'
        ];
    }
  };

  const getNextSteps = (severity: TriageResult['severity']): string[] => {
    switch (severity) {
      case 'critical':
        return [
          '立即寻求紧急医疗救助',
          '准备前往医院',
          '携带所有相关医疗文件'
        ];
      case 'high':
        return [
          '预约专科医生',
          '准备症状描述',
          '整理最近的检查报告'
        ];
      case 'moderate':
        return [
          '安排门诊预约',
          '准备问诊清单',
          '继续监测症状'
        ];
      default:
        return [
          '继续自我观察',
          '记录症状变化',
          '定期自我评估'
        ];
    }
  };

  const getSeverityColor = (severity: TriageResult['severity']) => {
    switch (severity) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'moderate': return 'bg-yellow-500 text-black';
      default: return 'bg-green-500 text-white';
    }
  };

  const getSeverityIcon = (severity: TriageResult['severity']) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-5 w-5" />;
      case 'high': return <AlertTriangle className="h-5 w-5" />;
      case 'moderate': return <Clock className="h-5 w-5" />;
      default: return <CheckCircle2 className="h-5 w-5" />;
    }
  };

  const reset = () => {
    setTextInput('');
    setVoiceData(null);
    setImages([]);
    setTriageResult(null);
    setError(null);
    setProgress(0);
    setActiveTab('text');
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-6 w-6" />
            智能症状评估
          </CardTitle>
          <p className="text-sm text-gray-600">
            通过文字、语音或图片描述您的症状，获得AI智能评估和建议
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {isProcessing && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">AI正在分析您的症状...</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="text" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                文字描述
              </TabsTrigger>
              <TabsTrigger value="voice" className="flex items-center gap-2">
                <Mic className="h-4 w-4" />
                语音输入
              </TabsTrigger>
              <TabsTrigger value="image" className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                图片上传
              </TabsTrigger>
            </TabsList>

            <TabsContent value="text" className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">请详细描述您的症状：</label>
                <Textarea
                  placeholder="例如：我今天早上开始感到恶心，伴有轻微头痛，体温38.2度..."
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  rows={4}
                />
                <p className="text-xs text-gray-500">
                  提示：请详细描述症状的开始时间、严重程度、持续时间和伴随症状
                </p>
              </div>
              <Button
                onClick={handleTextSubmit}
                disabled={!textInput.trim() || isProcessing}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                开始评估
              </Button>
            </TabsContent>

            <TabsContent value="voice" className="space-y-4">
              <VoiceInput
                onTranscription={handleVoiceTranscription}
                placeholder="点击开始录音，描述您的症状..."
                language="zh-CN"
                continuous={false}
              />
              {voiceData && (
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <p className="text-sm text-green-800">
                    <strong>识别结果 (准确度: {Math.round(voiceData.confidence * 100)}%):</strong>
                  </p>
                  <p className="text-sm mt-1">{voiceData.transcript}</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="image" className="space-y-4">
              <ImageInput
                onImagesSelected={handleImagesSelected}
                onImageAnalyze={handleImageAnalyze}
                maxFiles={3}
                maxSizeMB={5}
                enableCamera={true}
                enableMetadata={true}
              />
              {images.length > 0 && (
                <Button
                  onClick={() => processSymptoms({ images, timestamp: new Date().toISOString() })}
                  disabled={isProcessing}
                  className="w-full"
                >
                  <Brain className="h-4 w-4 mr-2" />
                  分析图片症状
                </Button>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Triage Results */}
      {triageResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-6 w-6" />
              AI评估结果
              <Badge className={`ml-2 ${getSeverityColor(triageResult.severity)}`}>
                {getSeverityIcon(triageResult.severity)}
                <span className="ml-1">
                  {triageResult.severity === 'critical' ? '紧急' :
                   triageResult.severity === 'high' ? '高风险' :
                   triageResult.severity === 'moderate' ? '中等风险' : '低风险'}
                </span>
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">紧急程度</h4>
                <div className="flex items-center gap-2">
                  <Progress value={triageResult.urgency * 25} className="flex-1" />
                  <span className="text-sm text-gray-600">
                    {triageResult.urgency}/4
                  </span>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">评估信心度</h4>
                <div className="flex items-center gap-2">
                  <Progress value={triageResult.confidence * 100} className="flex-1" />
                  <span className="text-sm text-gray-600">
                    {Math.round(triageResult.confidence * 100)}%
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">建议措施</h4>
              <ul className="space-y-1 text-sm">
                {triageResult.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">后续步骤</h4>
              <ol className="space-y-1 text-sm">
                {triageResult.nextSteps.map((step, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Badge variant="outline" className="text-xs">{index + 1}</Badge>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={reset}>
                重新评估
              </Button>
              
              {triageResult.urgency >= 3 && (
                <Button 
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => window.location.href = 'tel:120'}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  拨打急救电话
                </Button>
              )}
            </div>

            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
              <p><strong>免责声明：</strong>此评估仅供参考，不能替代专业医疗诊断。如有疑虑，请及时咨询医疗专业人士。</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}