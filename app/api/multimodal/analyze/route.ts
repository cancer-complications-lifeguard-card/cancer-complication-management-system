import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';

interface SymptomAnalysisRequest {
  type: 'text' | 'voice' | 'image';
  data: {
    text?: string;
    voice?: {
      transcript: string;
      confidence: number;
      audioData?: string; // base64 encoded audio
    };
    image?: {
      data: string; // base64 encoded image
      metadata?: any;
    };
  };
  context?: {
    patientId?: number;
    medicalHistory?: any[];
    currentMedications?: any[];
    allergies?: any[];
  };
}

interface AnalysisResult {
  severity: 'low' | 'moderate' | 'high' | 'critical';
  confidence: number;
  symptoms: string[];
  recommendations: string[];
  urgency: number;
  specialtyRecommended?: string;
  followUpRequired: boolean;
  analysisDetails: {
    nlpAnalysis?: any;
    imageAnalysis?: any;
    voiceAnalysis?: any;
  };
}

// Mock medical AI analysis functions
const analyzeTextSymptoms = async (text: string): Promise<any> => {
  // In a real implementation, this would call medical NLP services
  const symptoms = extractSymptomsFromText(text);
  const severity = assessSeverityFromSymptoms(symptoms);
  
  return {
    detectedSymptoms: symptoms,
    severity,
    confidence: 0.85,
    keyPhrases: extractKeyPhrases(text),
    medicalTerms: extractMedicalTerms(text)
  };
};

const analyzeVoiceData = async (voiceData: any): Promise<any> => {
  // Mock voice analysis - in real implementation, would analyze:
  // - Speech patterns (speed, pauses, breathing)
  // - Voice quality changes indicating pain/distress
  // - Emotional state from voice tone
  
  const textAnalysis = await analyzeTextSymptoms(voiceData.transcript);
  
  return {
    ...textAnalysis,
    voiceFeatures: {
      speechRate: 'normal',
      pausePattern: 'regular',
      voiceQuality: 'clear',
      emotionalState: 'concerned',
      distressLevel: 0.3
    },
    originalConfidence: voiceData.confidence
  };
};

const analyzeImageData = async (imageData: string): Promise<any> => {
  // Mock image analysis - in real implementation, would use medical image AI:
  // - Skin condition detection
  // - Wound assessment
  // - Rash identification
  // - Tumor detection
  // - Medical document OCR
  
  await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate processing time
  
  return {
    imageType: 'skin_condition',
    findings: [
      {
        condition: '皮肤红斑',
        confidence: 0.88,
        location: 'detected_region_1',
        severity: 'mild'
      },
      {
        condition: '轻微肿胀',
        confidence: 0.72,
        location: 'detected_region_2',
        severity: 'mild'
      }
    ],
    recommendations: [
      '建议皮肤科医生检查',
      '避免抓挠患处',
      '保持患处清洁干燥'
    ],
    qualityScore: 0.9,
    technicalMetrics: {
      resolution: 'adequate',
      lighting: 'good',
      focus: 'sharp'
    }
  };
};

// Helper functions
const extractSymptomsFromText = (text: string): string[] => {
  const symptomKeywords = [
    '疼痛', '头痛', '腹痛', '胸痛', '关节痛',
    '发热', '发烧', '高烧', '低烧',
    '恶心', '呕吐', '头晕', '乏力',
    '腹泻', '便秘', '皮疹', '瘙痒',
    '咳嗽', '呼吸困难', '胸闷',
    '失眠', '焦虑', '抑郁',
    '食欲不振', '体重下降', '肿胀'
  ];
  
  return symptomKeywords.filter(symptom => text.includes(symptom));
};

const extractKeyPhrases = (text: string): string[] => {
  // Simple phrase extraction - in real implementation, use NLP
  const phrases = text.split(/[。！？.!?]/).filter(phrase => phrase.trim().length > 0);
  return phrases.map(phrase => phrase.trim()).slice(0, 5);
};

const extractMedicalTerms = (text: string): string[] => {
  const medicalTerms = [
    '化疗', '放疗', '手术', '免疫治疗',
    '血常规', 'CT', 'MRI', 'PET-CT',
    '肿瘤标志物', 'CEA', 'CA199', 'AFP',
    '白细胞', '血小板', '血红蛋白',
    '肝功能', '肾功能', '心电图'
  ];
  
  return medicalTerms.filter(term => text.includes(term));
};

const assessSeverityFromSymptoms = (symptoms: string[]): 'low' | 'moderate' | 'high' | 'critical' => {
  const criticalSymptoms = ['呼吸困难', '胸痛', '昏迷', '大出血', '严重疼痛'];
  const highSymptoms = ['高烧', '剧烈疼痛', '呕吐不止', '心律不齐'];
  const moderateSymptoms = ['发热', '疼痛', '恶心', '头晕'];
  
  if (symptoms.some(s => criticalSymptoms.includes(s))) return 'critical';
  if (symptoms.some(s => highSymptoms.includes(s))) return 'high';
  if (symptoms.some(s => moderateSymptoms.includes(s))) return 'moderate';
  return 'low';
};

const generateRecommendations = (severity: string, symptoms: string[]): string[] => {
  const baseRecommendations = {
    critical: [
      '立即前往急诊科就医',
      '拨打120急救电话',
      '准备医疗卡片和用药清单',
      '通知紧急联系人'
    ],
    high: [
      '尽快就医，建议24小时内',
      '准备详细症状记录',
      '携带既往病历和检查报告',
      '如症状加重立即急诊'
    ],
    moderate: [
      '建议48小时内门诊就医',
      '密切观察症状变化',
      '记录症状日记',
      '保持充分休息'
    ],
    low: [
      '继续观察，注意症状变化',
      '保持良好作息',
      '如症状持续或加重及时就医',
      '可先咨询在线医生'
    ]
  };
  
  return baseRecommendations[severity as keyof typeof baseRecommendations] || baseRecommendations.low;
};

const determineSpecialty = (symptoms: string[]): string | undefined => {
  if (symptoms.some(s => ['皮疹', '瘙痒', '红斑'].includes(s))) return '皮肤科';
  if (symptoms.some(s => ['胸痛', '呼吸困难', '心律不齐'].includes(s))) return '心内科';
  if (symptoms.some(s => ['腹痛', '恶心', '呕吐', '腹泻'].includes(s))) return '消化内科';
  if (symptoms.some(s => ['头痛', '头晕', '昏迷'].includes(s))) return '神经内科';
  if (symptoms.some(s => ['发热', '乏力'].includes(s))) return '内科';
  return undefined;
};

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: SymptomAnalysisRequest = await request.json();
    const { type, data, context } = body;

    let analysisResult: Record<string, unknown>;
    let detectedSymptoms: string[] = [];

    // Perform analysis based on input type
    switch (type) {
      case 'text':
        if (!data.text) {
          return NextResponse.json({ error: 'Text data required' }, { status: 400 });
        }
        analysisResult = await analyzeTextSymptoms(data.text);
        detectedSymptoms = analysisResult.detectedSymptoms;
        break;

      case 'voice':
        if (!data.voice?.transcript) {
          return NextResponse.json({ error: 'Voice transcript required' }, { status: 400 });
        }
        analysisResult = await analyzeVoiceData(data.voice);
        detectedSymptoms = analysisResult.detectedSymptoms;
        break;

      case 'image':
        if (!data.image?.data) {
          return NextResponse.json({ error: 'Image data required' }, { status: 400 });
        }
        analysisResult = await analyzeImageData();
        detectedSymptoms = (analysisResult.findings as Array<{condition: string}> | undefined)?.map((f) => f.condition) || [];
        break;

      default:
        return NextResponse.json({ error: 'Invalid analysis type' }, { status: 400 });
    }

    // Generate comprehensive result
    const severity = analysisResult.severity || assessSeverityFromSymptoms(detectedSymptoms);
    const urgency = severity === 'critical' ? 4 : severity === 'high' ? 3 : severity === 'moderate' ? 2 : 1;
    const recommendations = generateRecommendations(severity, detectedSymptoms);
    const specialtyRecommended = determineSpecialty(detectedSymptoms);

    const result: AnalysisResult = {
      severity,
      confidence: analysisResult.confidence || 0.8,
      symptoms: detectedSymptoms,
      recommendations,
      urgency,
      specialtyRecommended,
      followUpRequired: urgency >= 2,
      analysisDetails: {
        [type === 'text' ? 'nlpAnalysis' : type === 'voice' ? 'voiceAnalysis' : 'imageAnalysis']: analysisResult
      }
    };

    // Log the analysis for medical records (in real implementation)
    console.log(`Multimodal analysis for user ${session.user.id}:`, {
      type,
      severity,
      symptoms: detectedSymptoms,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString(),
      analysisId: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
    });

  } catch (error) {
    console.error('Multimodal analysis error:', error);
    return NextResponse.json(
      { error: 'Analysis failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return available analysis capabilities
    return NextResponse.json({
      success: true,
      capabilities: {
        textAnalysis: {
          supported: true,
          languages: ['zh-CN', 'en-US'],
          features: ['symptom_extraction', 'severity_assessment', 'medical_term_recognition']
        },
        voiceAnalysis: {
          supported: true,
          languages: ['zh-CN', 'en-US'],
          features: ['speech_to_text', 'voice_quality_analysis', 'emotional_state_detection']
        },
        imageAnalysis: {
          supported: true,
          formats: ['jpeg', 'png', 'webp'],
          maxSize: '10MB',
          features: ['skin_condition_detection', 'wound_assessment', 'document_ocr']
        }
      }
    });

  } catch (error) {
    console.error('Error fetching multimodal capabilities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch capabilities' },
      { status: 500 }
    );
  }
}