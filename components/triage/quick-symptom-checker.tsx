'use client';

import { useState } from 'react';
import { AlertTriangle, CheckCircle, Clock, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface QuickSymptomCheckerProps {
  onCompleteAssessment?: () => void;
}

interface QuickAssessmentResult {
  urgency: 'emergency' | 'urgent' | 'moderate' | 'low';
  message: string;
  actions: string[];
}

const quickQuestions = [
  {
    id: 'breathing',
    question: '您是否出现严重呼吸困难？',
    emergency: true,
  },
  {
    id: 'chest_pain',
    question: '您是否出现剧烈胸痛？',
    emergency: true,
  },
  {
    id: 'consciousness',
    question: '您是否感到意识模糊或头晕？',
    urgent: true,
  },
  {
    id: 'fever',
    question: '您的体温是否超过38.5°C？',
    urgent: true,
  },
  {
    id: 'bleeding',
    question: '您是否出现异常出血？',
    urgent: true,
  },
  {
    id: 'severe_pain',
    question: '您的疼痛程度是否超过8分（满分10分）？',
    moderate: true,
  },
];

export function QuickSymptomChecker({ onCompleteAssessment }: QuickSymptomCheckerProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [result, setResult] = useState<QuickAssessmentResult | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const handleAnswer = (answer: boolean) => {
    const question = quickQuestions[currentQuestion];
    const newAnswers = { ...answers, [question.id]: answer };
    setAnswers(newAnswers);

    // Check for emergency conditions
    if (answer && question.emergency) {
      setResult({
        urgency: 'emergency',
        message: '您的症状可能需要紧急医疗处理',
        actions: [
          '立即拨打120急救电话',
          '前往最近的急诊科',
          '如有家人陪同更好'
        ],
      });
      setIsComplete(true);
      return;
    }

    // Move to next question or complete assessment
    if (currentQuestion < quickQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      completeAssessment(newAnswers);
    }
  };

  const completeAssessment = (finalAnswers: Record<string, boolean>) => {
    let urgentCount = 0;
    let moderateCount = 0;

    quickQuestions.forEach(question => {
      if (finalAnswers[question.id]) {
        if (question.urgent) urgentCount++;
        if (question.moderate) moderateCount++;
      }
    });

    let assessment: QuickAssessmentResult;

    if (urgentCount >= 2) {
      assessment = {
        urgency: 'urgent',
        message: '您需要尽快就医',
        actions: [
          '2-4小时内前往急诊科',
          '联系您的主治医生',
          '密切监测症状变化'
        ],
      };
    } else if (urgentCount >= 1 || moderateCount >= 2) {
      assessment = {
        urgency: 'moderate',
        message: '建议您在24小时内就医',
        actions: [
          '预约门诊或急诊',
          '观察症状发展',
          '如症状加重立即就医'
        ],
      };
    } else {
      assessment = {
        urgency: 'low',
        message: '您的症状相对较轻',
        actions: [
          '居家观察和休息',
          '充分饮水',
          '如症状持续或加重请就医'
        ],
      };
    }

    setResult(assessment);
    setIsComplete(true);
  };

  const resetChecker = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setResult(null);
    setIsComplete(false);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'emergency':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'urgent':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'emergency':
        return <AlertTriangle className="h-5 w-5" />;
      case 'urgent':
        return <Clock className="h-5 w-5" />;
      case 'moderate':
        return <Clock className="h-5 w-5" />;
      case 'low':
        return <CheckCircle className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  if (isComplete && result) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center">快速评估结果</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <Badge className={`${getUrgencyColor(result.urgency)} text-lg px-4 py-2 mb-4`}>
                <div className="flex items-center gap-2">
                  {getUrgencyIcon(result.urgency)}
                  {result.urgency === 'emergency' && '紧急情况'}
                  {result.urgency === 'urgent' && '需要尽快就医'}
                  {result.urgency === 'moderate' && '中等紧急'}
                  {result.urgency === 'low' && '症状较轻'}
                </div>
              </Badge>
              <p className="text-lg font-medium mb-4">{result.message}</p>
            </div>

            <Card className="bg-gray-50">
              <CardHeader>
                <CardTitle className="text-sm">建议行动</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.actions.map((action, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {result.urgency === 'emergency' && (
              <div className="flex gap-2">
                <Button className="flex-1 bg-red-600 hover:bg-red-700">
                  <Phone className="h-4 w-4 mr-2" />
                  拨打120
                </Button>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={resetChecker} className="flex-1">
                重新评估
              </Button>
              <Button onClick={onCompleteAssessment} className="flex-1">
                详细评估
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center">
          快速症状检查 ({currentQuestion + 1}/{quickQuestions.length})
        </CardTitle>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
          <div
            className="bg-primary h-2 rounded-full transition-all"
            style={{
              width: `${((currentQuestion + 1) / quickQuestions.length) * 100}%`
            }}
          ></div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-xl font-medium mb-4">
              {quickQuestions[currentQuestion].question}
            </h3>
            <p className="text-gray-600 text-sm">
              请根据您目前的症状如实回答
            </p>
          </div>

          <RadioGroup className="space-y-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="yes" onClick={() => handleAnswer(true)} />
              <Label htmlFor="yes" className="cursor-pointer flex-1 p-4 border rounded-lg hover:bg-gray-50">
                是的，我有这个症状
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="no" onClick={() => handleAnswer(false)} />
              <Label htmlFor="no" className="cursor-pointer flex-1 p-4 border rounded-lg hover:bg-gray-50">
                没有这个症状
              </Label>
            </div>
          </RadioGroup>

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
              disabled={currentQuestion === 0}
            >
              上一题
            </Button>
            <Button variant="outline" onClick={resetChecker}>
              重新开始
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}