/**
 * AI-powered Alert Engine
 * Advanced analytics and machine learning for health monitoring alerts
 */

import { websocketManager } from './websocket-manager';
import { notificationManager } from '@/lib/pwa/notification-manager';

export interface VitalSignsRecord {
  timestamp: number;
  heartRate?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  temperature?: number;
  oxygenSaturation?: number;
  respiratoryRate?: number;
  deviceId?: string;
}

export interface PatientProfile {
  age: number;
  gender: 'male' | 'female';
  cancerType: string;
  stage: string;
  treatmentPhase: 'pre-treatment' | 'active-treatment' | 'post-treatment' | 'maintenance';
  medications: string[];
  comorbidities: string[];
  baselineVitals: {
    heartRate: number;
    bloodPressure: [number, number];
    temperature: number;
    oxygenSaturation: number;
  };
}

export interface AlertRule {
  id: string;
  name: string;
  condition: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metric: string;
  threshold: number;
  description: string;
  recommendations: string[];
  enabled: boolean;
  cancerSpecific?: boolean;
  treatmentSpecific?: boolean;
}

export interface TrendAnalysis {
  metric: string;
  trend: 'improving' | 'stable' | 'declining' | 'critical';
  confidence: number;
  timeframe: string;
  prediction?: {
    nextValue: number;
    timeToThreshold?: number;
    riskLevel: 'low' | 'medium' | 'high';
  };
}

export class AIAlertEngine {
  private static instance: AIAlertEngine;
  private patientProfile: PatientProfile | null = null;
  private vitalSignsHistory: VitalSignsRecord[] = [];
  private alertRules: AlertRule[] = [];
  private processingQueue: VitalSignsRecord[] = [];

  private constructor() {
    this.initializeDefaultRules();
  }

  static getInstance(): AIAlertEngine {
    if (!AIAlertEngine.instance) {
      AIAlertEngine.instance = new AIAlertEngine();
    }
    return AIAlertEngine.instance;
  }

  /**
   * Initialize with patient profile
   */
  initialize(profile: PatientProfile): void {
    this.patientProfile = profile;
    this.customizeRulesForPatient(profile);
    console.log('AI Alert Engine initialized for patient:', profile.cancerType);
  }

  /**
   * Process new vital signs data
   */
  async processVitalSigns(data: VitalSignsRecord): Promise<void> {
    // Add to history
    this.vitalSignsHistory.push(data);
    
    // Keep only last 1000 records for performance
    if (this.vitalSignsHistory.length > 1000) {
      this.vitalSignsHistory = this.vitalSignsHistory.slice(-1000);
    }

    // Add to processing queue for batch analysis
    this.processingQueue.push(data);
    
    // Immediate alert checking
    await this.checkImmediateAlerts(data);
    
    // Trend analysis (every 5 readings)
    if (this.processingQueue.length >= 5) {
      await this.performTrendAnalysis();
      this.processingQueue = [];
    }
  }

  /**
   * Check for immediate alerts
   */
  private async checkImmediateAlerts(data: VitalSignsRecord): Promise<void> {
    const alerts = [];

    for (const rule of this.alertRules) {
      if (!rule.enabled) continue;

      const alert = this.evaluateRule(rule, data);
      if (alert) {
        alerts.push(alert);
      }
    }

    // Process cancer-specific alerts
    const cancerAlerts = await this.checkCancerSpecificAlerts(data);
    alerts.push(...cancerAlerts);

    // Send alerts
    for (const alert of alerts) {
      await this.sendAlert(alert);
    }
  }

  /**
   * Evaluate a single alert rule
   */
  private evaluateRule(rule: AlertRule, data: VitalSignsRecord): any | null {
    const value = this.getMetricValue(data, rule.metric);
    if (value === undefined) return null;

    let triggered = false;
    let currentValue = value;

    // Evaluate condition
    switch (rule.condition) {
      case 'above':
        triggered = value > rule.threshold;
        break;
      case 'below':
        triggered = value < rule.threshold;
        break;
      case 'rapid_increase':
        triggered = this.checkRapidChange(rule.metric, 'increase');
        break;
      case 'rapid_decrease':
        triggered = this.checkRapidChange(rule.metric, 'decrease');
        break;
      case 'sustained_abnormal':
        triggered = this.checkSustainedAbnormal(rule.metric, rule.threshold);
        break;
    }

    if (triggered) {
      return {
        id: `${rule.id}_${Date.now()}`,
        ruleId: rule.id,
        severity: this.adjustSeverityForPatient(rule.severity),
        type: rule.name,
        metric: rule.metric,
        value: currentValue,
        threshold: rule.threshold,
        message: this.generateAlertMessage(rule, currentValue),
        recommendations: rule.recommendations,
        timestamp: data.timestamp,
        requiresImmediate: rule.severity === 'critical'
      };
    }

    return null;
  }

  /**
   * Check cancer-specific alerts
   */
  private async checkCancerSpecificAlerts(data: VitalSignsRecord): Promise<any[]> {
    if (!this.patientProfile) return [];

    const alerts = [];
    const cancerType = this.patientProfile.cancerType.toLowerCase();

    // Lung cancer specific monitoring
    if (cancerType.includes('lung')) {
      if (data.oxygenSaturation && data.oxygenSaturation < 92) {
        alerts.push({
          id: `lung_hypoxia_${Date.now()}`,
          severity: 'critical',
          type: 'lung_cancer_hypoxia',
          metric: 'oxygenSaturation',
          value: data.oxygenSaturation,
          threshold: 92,
          message: '肺癌患者血氧饱和度严重偏低，可能存在呼吸功能受损',
          recommendations: [
            '立即就医检查',
            '评估呼吸功能',
            '考虑氧气补充治疗'
          ],
          requiresImmediate: true
        });
      }
    }

    // Heart-related cancer monitoring (cardiotoxicity from chemotherapy)
    if (this.patientProfile.medications.some(med => 
        ['doxorubicin', 'trastuzumab', 'bevacizumab'].includes(med.toLowerCase()))) {
      
      if (data.heartRate && (data.heartRate < 50 || data.heartRate > 110)) {
        alerts.push({
          id: `cardiotoxicity_${Date.now()}`,
          severity: 'high',
          type: 'chemotherapy_cardiotoxicity',
          metric: 'heartRate',
          value: data.heartRate,
          threshold: data.heartRate < 50 ? 50 : 110,
          message: '化疗相关心脏毒性风险：心率异常',
          recommendations: [
            '联系肿瘤科医生',
            '考虑心电图检查',
            '评估心脏功能'
          ],
          requiresImmediate: data.heartRate < 45 || data.heartRate > 130
        });
      }
    }

    // Infection risk monitoring (common in immunocompromised patients)
    if (data.temperature && data.temperature >= 38.0) {
      const severity = data.temperature >= 39.0 ? 'critical' : 'high';
      alerts.push({
        id: `neutropenic_fever_${Date.now()}`,
        severity,
        type: 'neutropenic_fever',
        metric: 'temperature',
        value: data.temperature,
        threshold: 38.0,
        message: '癌症患者发热警报：可能存在感染风险',
        recommendations: [
          '立即就医',
          '血常规检查',
          '考虑抗生素治疗',
          '避免人群聚集'
        ],
        requiresImmediate: true
      });
    }

    return alerts;
  }

  /**
   * Perform trend analysis
   */
  private async performTrendAnalysis(): Promise<void> {
    const metrics = ['heartRate', 'bloodPressureSystolic', 'temperature', 'oxygenSaturation'];
    
    for (const metric of metrics) {
      const analysis = this.analyzeTrend(metric);
      if (analysis && analysis.trend === 'critical') {
        await this.sendTrendAlert(analysis);
      }
    }
  }

  /**
   * Analyze trend for a specific metric
   */
  private analyzeTrend(metric: string): TrendAnalysis | null {
    const recentData = this.vitalSignsHistory
      .slice(-20)
      .map(record => this.getMetricValue(record, metric))
      .filter(value => value !== undefined) as number[];

    if (recentData.length < 5) return null;

    // Simple linear regression for trend detection
    const n = recentData.length;
    const sumX = Array.from({length: n}, (_, i) => i).reduce((a, b) => a + b, 0);
    const sumY = recentData.reduce((a, b) => a + b, 0);
    const sumXY = recentData.reduce((sum, y, i) => sum + i * y, 0);
    const sumX2 = Array.from({length: n}, (_, i) => i * i).reduce((a, b) => a + b, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate confidence based on R-squared
    const yMean = sumY / n;
    const totalSumSquares = recentData.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
    const residualSumSquares = recentData.reduce((sum, y, i) => {
      const predicted = slope * i + intercept;
      return sum + Math.pow(y - predicted, 2);
    }, 0);
    
    const rSquared = 1 - (residualSumSquares / totalSumSquares);
    const confidence = Math.max(0, Math.min(1, rSquared));

    // Determine trend
    let trend: TrendAnalysis['trend'];
    if (Math.abs(slope) < 0.5) {
      trend = 'stable';
    } else if (slope > 0) {
      trend = this.isMetricImprovingWhenIncreasing(metric) ? 'improving' : 'declining';
    } else {
      trend = this.isMetricImprovingWhenIncreasing(metric) ? 'declining' : 'improving';
    }

    // Check for critical trends
    if (confidence > 0.7 && Math.abs(slope) > 2) {
      trend = 'critical';
    }

    return {
      metric,
      trend,
      confidence,
      timeframe: '20 readings',
      prediction: {
        nextValue: slope * n + intercept,
        riskLevel: confidence > 0.8 && Math.abs(slope) > 1.5 ? 'high' : 'medium'
      }
    };
  }

  /**
   * Check for rapid changes
   */
  private checkRapidChange(metric: string, direction: 'increase' | 'decrease'): boolean {
    const recent = this.vitalSignsHistory
      .slice(-5)
      .map(record => this.getMetricValue(record, metric))
      .filter(value => value !== undefined) as number[];

    if (recent.length < 3) return false;

    const changes = recent.slice(1).map((value, i) => value - recent[i]);
    const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length;

    const threshold = this.getRapidChangeThreshold(metric);
    
    if (direction === 'increase') {
      return avgChange > threshold;
    } else {
      return avgChange < -threshold;
    }
  }

  /**
   * Check for sustained abnormal values
   */
  private checkSustainedAbnormal(metric: string, threshold: number): boolean {
    const recent = this.vitalSignsHistory
      .slice(-10)
      .map(record => this.getMetricValue(record, metric))
      .filter(value => value !== undefined) as number[];

    if (recent.length < 5) return false;

    // Check if at least 80% of recent readings are abnormal
    const abnormalCount = recent.filter(value => 
      this.isMetricImprovingWhenIncreasing(metric) ? 
        value < threshold : value > threshold
    ).length;

    return abnormalCount / recent.length >= 0.8;
  }

  /**
   * Utility functions
   */
  private getMetricValue(data: VitalSignsRecord, metric: string): number | undefined {
    switch (metric) {
      case 'heartRate': return data.heartRate;
      case 'bloodPressureSystolic': return data.bloodPressureSystolic;
      case 'bloodPressureDiastolic': return data.bloodPressureDiastolic;
      case 'temperature': return data.temperature;
      case 'oxygenSaturation': return data.oxygenSaturation;
      case 'respiratoryRate': return data.respiratoryRate;
      default: return undefined;
    }
  }

  private isMetricImprovingWhenIncreasing(metric: string): boolean {
    // Metrics that are better when higher
    return ['oxygenSaturation'].includes(metric);
  }

  private getRapidChangeThreshold(metric: string): number {
    const thresholds: Record<string, number> = {
      heartRate: 10,
      bloodPressureSystolic: 15,
      bloodPressureDiastolic: 10,
      temperature: 0.5,
      oxygenSaturation: 3,
      respiratoryRate: 5
    };
    return thresholds[metric] || 5;
  }

  private adjustSeverityForPatient(severity: string): string {
    if (!this.patientProfile) return severity;

    // Increase severity for high-risk patients
    if (this.patientProfile.treatmentPhase === 'active-treatment') {
      if (severity === 'low') return 'medium';
      if (severity === 'medium') return 'high';
    }

    return severity;
  }

  private generateAlertMessage(rule: AlertRule, value: number): string {
    const metricNames: Record<string, string> = {
      heartRate: '心率',
      bloodPressureSystolic: '收缩压',
      bloodPressureDiastolic: '舒张压',
      temperature: '体温',
      oxygenSaturation: '血氧饱和度',
      respiratoryRate: '呼吸频率'
    };

    const metricName = metricNames[rule.metric] || rule.metric;
    return `${metricName}异常：当前值 ${value.toFixed(1)}，${rule.description}`;
  }

  /**
   * Send alert through appropriate channels
   */
  private async sendAlert(alert: any): Promise<void> {
    console.log('AI Alert triggered:', alert);

    // Send through WebSocket to real-time dashboard
    websocketManager.send({
      type: 'alert',
      timestamp: alert.timestamp,
      userId: 0, // Will be set by the server
      data: alert
    });

    // Send push notification for high priority alerts
    if (alert.severity === 'high' || alert.severity === 'critical') {
      await notificationManager.sendVitalSignsAlert(
        alert.metric,
        alert.value,
        alert.threshold,
        alert.severity === 'critical' ? 'high' : 'medium'
      );
    }
  }

  private async sendTrendAlert(analysis: TrendAnalysis): Promise<void> {
    const alert = {
      id: `trend_${analysis.metric}_${Date.now()}`,
      severity: 'medium',
      type: 'trend_analysis',
      metric: analysis.metric,
      message: `${analysis.metric}呈现${analysis.trend}趋势，置信度${(analysis.confidence * 100).toFixed(1)}%`,
      recommendations: ['密切监测数据变化', '如有不适及时就医'],
      timestamp: Date.now(),
      requiresImmediate: false
    };

    await this.sendAlert(alert);
  }

  /**
   * Initialize default alert rules
   */
  private initializeDefaultRules(): void {
    this.alertRules = [
      {
        id: 'heartrate_high',
        name: '心率过高',
        condition: 'above',
        severity: 'medium',
        metric: 'heartRate',
        threshold: 100,
        description: '心率超过正常范围上限',
        recommendations: ['休息片刻', '避免剧烈活动', '如持续异常请就医'],
        enabled: true
      },
      {
        id: 'heartrate_critical',
        name: '心率严重异常',
        condition: 'above',
        severity: 'critical',
        metric: 'heartRate',
        threshold: 130,
        description: '心率严重超标，需要立即医疗干预',
        recommendations: ['立即就医', '呼叫急救电话', '保持冷静'],
        enabled: true
      },
      {
        id: 'blood_pressure_high',
        name: '高血压警报',
        condition: 'above',
        severity: 'high',
        metric: 'bloodPressureSystolic',
        threshold: 160,
        description: '血压显著升高',
        recommendations: ['立即休息', '深呼吸放松', '联系医生'],
        enabled: true
      },
      {
        id: 'temperature_fever',
        name: '发热警报',
        condition: 'above',
        severity: 'high',
        metric: 'temperature',
        threshold: 38.0,
        description: '体温升高，可能存在感染',
        recommendations: ['多喝水', '物理降温', '及时就医'],
        enabled: true
      },
      {
        id: 'oxygen_low',
        name: '血氧不足',
        condition: 'below',
        severity: 'critical',
        metric: 'oxygenSaturation',
        threshold: 90,
        description: '血氧饱和度严重偏低',
        recommendations: ['立即就医', '吸氧治疗', '保持冷静'],
        enabled: true
      }
    ];
  }

  /**
   * Customize rules based on patient profile
   */
  private customizeRulesForPatient(profile: PatientProfile): void {
    // Adjust thresholds based on patient's baseline vitals
    this.alertRules.forEach(rule => {
      if (rule.metric === 'heartRate') {
        // Adjust heart rate thresholds based on age and baseline
        const ageAdjustment = profile.age > 65 ? 10 : 0;
        rule.threshold += ageAdjustment;
      }
      
      if (profile.treatmentPhase === 'active-treatment') {
        // Lower thresholds for patients undergoing treatment
        if (rule.metric === 'temperature' && rule.threshold > 37.5) {
          rule.threshold = 37.5; // More sensitive fever detection
        }
      }
    });

    // Add cancer-specific rules
    if (profile.cancerType.toLowerCase().includes('lung')) {
      this.alertRules.push({
        id: 'respiratory_distress',
        name: '呼吸困难',
        condition: 'above',
        severity: 'high',
        metric: 'respiratoryRate',
        threshold: 25,
        description: '肺癌患者呼吸频率异常升高',
        recommendations: ['立即休息', '检查呼吸道', '联系肿瘤科医生'],
        enabled: true,
        cancerSpecific: true
      });
    }
  }
}

// Export singleton instance
export const aiAlertEngine = AIAlertEngine.getInstance();