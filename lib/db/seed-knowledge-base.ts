import { db } from './drizzle';
import { 
  nccnGuidelines, 
  drugInteractions, 
  clinicalTrials, 
  knowledgeArticles 
} from './schema';

export async function seedKnowledgeBase() {
  console.log('Seeding knowledge base...');

  try {
    // Seed NCCN Guidelines
    const guidelinesToInsert = [
      {
        guidelineId: 'NCCN-BREAST-2024.1',
        title: '乳腺癌治疗指南 2024版',
        summary: 'NCCN乳腺癌治疗指南包含了从早期到晚期乳腺癌的综合治疗方案',
        cancerType: '乳腺癌',
        category: '治疗指南',
        version: 'v2024.1',
        effectiveDate: new Date('2024-01-01'),
        content: '本指南涵盖了乳腺癌的诊断、分期、治疗和随访管理的全面内容...',
        keywords: '乳腺癌,治疗,化疗,靶向治疗,免疫治疗',
        isActive: true
      },
      {
        guidelineId: 'NCCN-LUNG-2024.1',
        title: '肺癌治疗指南 2024版',
        summary: 'NCCN肺癌治疗指南提供了非小细胞肺癌和小细胞肺癌的标准治疗方案',
        cancerType: '肺癌',
        category: '治疗指南',
        version: 'v2024.1',
        effectiveDate: new Date('2024-01-01'),
        content: '本指南包括肺癌的筛查、诊断、分期和治疗的详细建议...',
        keywords: '肺癌,非小细胞肺癌,小细胞肺癌,靶向治疗',
        isActive: true
      },
      {
        guidelineId: 'NCCN-COLORECTAL-2024.1',
        title: '结直肠癌治疗指南 2024版',
        summary: 'NCCN结直肠癌治疗指南涵盖了结肠癌和直肠癌的综合管理策略',
        cancerType: '结直肠癌',
        category: '治疗指南',
        version: 'v2024.1',
        effectiveDate: new Date('2024-01-01'),
        content: '本指南详细描述了结直肠癌的筛查、诊断、手术和辅助治疗...',
        keywords: '结直肠癌,手术,化疗,靶向治疗',
        isActive: true
      }
    ];

    await db.insert(nccnGuidelines).values(guidelinesToInsert);

    // Seed Drug Interactions
    const interactionsToInsert = [
      {
        drugA: '华法林',
        drugB: '阿司匹林',
        interactionType: 'major',
        severity: 'major',
        clinicalEffect: '出血时间延长，增加严重出血的风险',
        mechanism: '两种药物都具有抗凝血作用，联用时效应叠加',
        management: '如必须联用，需要密切监测INR值和出血征象，考虑降低华法林剂量',
        references: 'Chest 2012;141(2 Suppl):e44S-e88S',
        isActive: true
      },
      {
        drugA: '紫杉醇',
        drugB: '卡马西平',
        interactionType: 'major',
        severity: 'major',
        clinicalEffect: '紫杉醇的抗肿瘤效果可能降低',
        mechanism: '卡马西平诱导CYP3A4酶，加速紫杉醇的代谢',
        management: '避免联用，如必须联用需要增加紫杉醇剂量并密切监测治疗效果',
        references: 'Clinical Cancer Research 2018;24:1234-1241',
        isActive: true
      },
      {
        drugA: '地塞米松',
        drugB: '伊曲康唑',
        interactionType: 'moderate',
        severity: 'moderate',
        clinicalEffect: '可能增加地塞米松的副作用',
        mechanism: '伊曲康唑抑制CYP3A4酶，减缓地塞米松的代谢',
        management: '联用时需要监测地塞米松的副作用，必要时调整剂量',
        references: 'Drug Metabolism and Disposition 2019;47:876-883',
        isActive: true
      },
      {
        drugA: '奥美拉唑',
        drugB: '氯吡格雷',
        interactionType: 'moderate',
        severity: 'moderate',
        clinicalEffect: '氯吡格雷的心血管保护作用可能减弱',
        mechanism: '奥美拉唑抑制CYP2C19酶，影响氯吡格雷的活化',
        management: '考虑使用其他质子泵抑制剂，或监测血小板聚集功能',
        references: 'JAMA 2009;301:937-944',
        isActive: true
      }
    ];

    await db.insert(drugInteractions).values(interactionsToInsert);

    // Seed Clinical Trials
    const trialsToInsert = [
      {
        nctId: 'NCT05123456',
        title: '乳腺癌新型靶向药物联合化疗的III期临床试验',
        briefSummary: '评估新型CDK4/6抑制剂联合内分泌治疗在HR+/HER2-晚期乳腺癌患者中的疗效和安全性',
        detailedDescription: '这是一项随机、双盲、安慰剂对照的III期临床试验，旨在评估新型CDK4/6抑制剂联合氟维司群在激素受体阳性、HER2阴性的晚期乳腺癌患者中的疗效...',
        cancerTypes: '乳腺癌',
        phase: 'Phase 3',
        status: 'recruiting',
        primaryPurpose: 'treatment',
        interventions: 'CDK4/6抑制剂,氟维司群,安慰剂',


        eligibilityCriteria: '18岁以上,确诊HR+/HER2-晚期乳腺癌,ECOG评分0-2',
        locations: '北京,上海,广州,深圳',
        contacts: 'contact@clinicaltrial.com',
        startDate: new Date('2024-01-15'),
        completionDate: new Date('2026-12-31'),
        lastUpdated: new Date('2024-01-15'),



        isActive: true
      },
      {
        nctId: 'NCT05234567',
        title: '肺癌免疫治疗联合放疗的II期临床试验',
        briefSummary: '研究PD-L1抑制剂联合立体定向放疗在局部晚期非小细胞肺癌患者中的安全性和有效性',
        detailedDescription: '这是一项单臂II期临床试验，评估PD-L1抑制剂联合立体定向放疗在不可手术的局部晚期非小细胞肺癌患者中的治疗效果...',
        cancerTypes: '肺癌,非小细胞肺癌',
        phase: 'Phase 2',
        status: 'recruiting',
        primaryPurpose: 'treatment',
        interventions: 'PD-L1抑制剂,立体定向放疗',


        eligibilityCriteria: '18岁以上,确诊局部晚期NSCLC,不可手术切除',
        locations: '上海,杭州,南京,苏州',
        contacts: 'lungcancer@hospital.com',
        startDate: new Date('2024-02-01'),
        completionDate: new Date('2026-06-30'),
        lastUpdated: new Date('2024-02-01'),


        isActive: true
      }
    ];

    await db.insert(clinicalTrials).values(trialsToInsert);

    // Seed Knowledge Articles
    const articlesToInsert = [
      {
        title: '癌症化疗期间的营养管理指南',
        summary: '详细介绍癌症患者在化疗期间如何进行合理的营养补充和饮食调理',
        content: '化疗期间的营养管理对癌症患者的治疗效果和生活质量至关重要。本文详细介绍了化疗期间的营养需求、常见营养问题及其解决方案...',
        category: '营养管理',
        subcategory: '化疗营养',
        cancerTypes: '乳腺癌,肺癌,结直肠癌',
        targetAudience: 'patient',
        readingLevel: 'basic',
        keywords: '化疗,营养,饮食,副作用管理',
        isFeatured: true,
        isPublished: true,
        references: '中国抗癌协会肿瘤营养专业委员会指南',
        relatedArticles: '化疗副作用管理,癌症患者运动指南',
        medicalReviewDate: new Date('2024-01-01'),
        nextReviewDate: new Date('2024-07-01'),
        viewCount: 1250,
        rating: '4.5',
        ratingCount: 23
      },
      {
        title: '癌症患者的心理调适与支持',
        summary: '帮助癌症患者和家属了解如何面对诊断后的心理冲击，建立积极的应对策略',
        content: '癌症诊断往往给患者和家属带来巨大的心理冲击。本文从心理学角度分析癌症患者常见的心理反应，并提供实用的心理调适方法...',
        category: '心理健康',
        subcategory: '心理调适',
        cancerTypes: '所有癌症类型',
        targetAudience: 'all',
        readingLevel: 'basic',
        keywords: '心理健康,心理调适,情绪管理,家属支持',
        isFeatured: true,
        isPublished: true,
        references: '中华医学会精神医学分会,癌症心理学研究',
        relatedArticles: '家属如何提供支持,癌症患者社交指南',
        medicalReviewDate: new Date('2024-01-01'),
        nextReviewDate: new Date('2024-07-01'),

        viewCount: 2180,
        rating: '4.7',
        ratingCount: 45
      },
      {
        title: '理解癌症分期：TNM系统详解',
        summary: '深入解释癌症TNM分期系统，帮助患者理解自己的病情严重程度和治疗选择',
        content: 'TNM分期系统是国际通用的癌症分期标准。本文详细解释T（原发肿瘤）、N（淋巴结）、M（远处转移）各项指标的含义...',
        category: '疾病知识',
        subcategory: '癌症分期',
        cancerTypes: '所有癌症类型',
        targetAudience: 'patient',
        readingLevel: 'intermediate',
        keywords: 'TNM分期,癌症分期,肿瘤评估',
        isFeatured: false,
        isPublished: true,
        references: 'AJCC Cancer Staging Manual 8th Edition',
        relatedArticles: '癌症治疗方案选择,预后评估指南',
        medicalReviewDate: new Date('2024-01-01'),
        nextReviewDate: new Date('2024-07-01'),
        viewCount: 890,
        rating: '4.3',
        ratingCount: 15
      },
      {
        title: '靶向治疗药物的副作用管理',
        summary: '详细介绍各类靶向治疗药物的常见副作用及其预防和处理方法',
        content: '靶向治疗是现代癌症治疗的重要手段，但也会产生特定的副作用。本文系统介绍不同类型靶向药物的副作用及管理策略...',
        category: '治疗知识',
        subcategory: '副作用管理',
        cancerTypes: '乳腺癌,肺癌,结直肠癌',
        targetAudience: 'patient',
        readingLevel: 'intermediate',
        keywords: '靶向治疗,副作用,药物管理',
        isFeatured: false,
        isPublished: true,
        references: '中国临床肿瘤学会靶向治疗指南',
        relatedArticles: '靶向药物选择指南,免疫治疗副作用',
        medicalReviewDate: new Date('2024-01-01'),
        nextReviewDate: new Date('2024-07-01'),
        viewCount: 1560,
        rating: '4.6',
        ratingCount: 28
      }
    ];

    await db.insert(knowledgeArticles).values(articlesToInsert);

    console.log('Knowledge base seeded successfully!');
    
    return {
      guidelines: guidelinesToInsert.length,
      interactions: interactionsToInsert.length,
      trials: trialsToInsert.length,
      articles: articlesToInsert.length
    };

  } catch (error) {
    console.error('Error seeding knowledge base:', error);
    throw error;
  }
}