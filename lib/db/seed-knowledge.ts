import { db } from './drizzle';
import { 
  medicalTerms, 
  complicationRiskTrees, 
  TermCategory, 
  RiskLevel,
  NewMedicalTerm,
  NewComplicationRiskTree
} from './schema';

// Sample medical terms
const sampleMedicalTerms: NewMedicalTerm[] = [
  // Cancer Types
  {
    term: '肺癌',
    definition: '起源于肺部组织的恶性肿瘤，是全球最常见的癌症类型之一。主要分为小细胞肺癌和非小细胞肺癌两大类。',
    category: TermCategory.CANCER_TYPE,
    aliases: ['肺部肿瘤', '支气管癌', '肺部恶性肿瘤'],
    severity: RiskLevel.HIGH,
    relatedTerms: [2, 3, 4] // Will be updated after insertion
  },
  {
    term: '乳腺癌',
    definition: '发生在乳腺组织的恶性肿瘤，是女性最常见的恶性肿瘤之一。早期发现和治疗预后较好。',
    category: TermCategory.CANCER_TYPE,
    aliases: ['乳房癌', '乳腺恶性肿瘤'],
    severity: RiskLevel.HIGH,
    relatedTerms: [5, 6]
  },
  {
    term: '化疗',
    definition: '化学疗法，使用化学药物杀死癌细胞或阻止其生长繁殖的治疗方法。是癌症治疗的重要手段之一。',
    category: TermCategory.TREATMENT,
    aliases: ['化学疗法', '化学治疗'],
    severity: RiskLevel.MEDIUM,
    relatedTerms: [1, 4]
  },
  {
    term: '放疗',
    definition: '放射疗法，利用高能射线杀死癌细胞或缩小肿瘤的治疗方法。可以单独使用或与其他治疗方法联合使用。',
    category: TermCategory.TREATMENT,
    aliases: ['放射疗法', '放射治疗'],
    severity: RiskLevel.MEDIUM,
    relatedTerms: [1, 3]
  },
  {
    term: '恶心呕吐',
    definition: '癌症治疗过程中常见的副作用，特别是在化疗和放疗期间。可能严重影响患者的生活质量。',
    category: TermCategory.SYMPTOM,
    aliases: ['恶心', '呕吐', '消化道反应'],
    severity: RiskLevel.MEDIUM,
    relatedTerms: [3, 4]
  },
  {
    term: '淋巴转移',
    definition: '癌细胞通过淋巴系统扩散到其他部位的过程。是癌症进展的重要指标之一。',
    category: TermCategory.COMPLICATION,
    aliases: ['淋巴结转移', '淋巴扩散'],
    severity: RiskLevel.HIGH,
    relatedTerms: [1, 2]
  },
  {
    term: '白细胞减少',
    definition: '血液中白细胞数量降低，常见于化疗后，可能导致感染风险增加。',
    category: TermCategory.COMPLICATION,
    aliases: ['白血球减少', '粒细胞减少'],
    severity: RiskLevel.HIGH,
    relatedTerms: [3, 8]
  },
  {
    term: '免疫抑制',
    definition: '机体免疫系统功能降低，常见于癌症治疗期间，增加感染和其他并发症的风险。',
    category: TermCategory.COMPLICATION,
    aliases: ['免疫功能低下', '免疫缺陷'],
    severity: RiskLevel.HIGH,
    relatedTerms: [7, 9]
  },
  {
    term: '感染',
    definition: '病原体侵入机体导致的疾病状态。癌症患者由于免疫力降低，容易发生各种感染。',
    category: TermCategory.COMPLICATION,
    aliases: ['感染症', '继发感染'],
    severity: RiskLevel.CRITICAL,
    relatedTerms: [7, 8]
  },
  {
    term: '胃癌',
    definition: '发生在胃部的恶性肿瘤，早期症状不明显，晚期可能出现腹痛、消化不良等症状。',
    category: TermCategory.CANCER_TYPE,
    aliases: ['胃部恶性肿瘤', '胃肿瘤'],
    severity: RiskLevel.HIGH,
    relatedTerms: [3, 4]
  }
];

// Sample complication risk trees
const sampleRiskTrees: NewComplicationRiskTree[] = [
  // Lung Cancer Risk Tree
  {
    cancerType: '肺癌',
    complicationName: '呼吸系统并发症',
    description: '肺癌患者最常见的并发症类型，包括各种呼吸功能障碍',
    riskLevel: RiskLevel.HIGH,
    probability: '80-90%',
    timeframe: '治疗期间及术后',
    symptoms: ['呼吸困难', '咳嗽', '胸痛', '咳血'],
    riskFactors: ['吸烟史', '肿瘤位置', '肺功能状态', '年龄'],
    preventionMeasures: ['戒烟', '呼吸训练', '定期监测', '预防感染'],
    treatmentOptions: ['氧疗', '支气管扩张剂', '物理治疗', '手术干预'],
    parentId: null
  },
  {
    cancerType: '肺癌',
    complicationName: '肺炎',
    description: '肺癌患者常见的感染性并发症，可能危及生命',
    riskLevel: RiskLevel.CRITICAL,
    probability: '30-40%',
    timeframe: '治疗期间',
    symptoms: ['发热', '咳嗽', '呼吸困难', '胸痛'],
    riskFactors: ['免疫力低下', '手术创伤', '化疗副作用', '原有肺部疾病'],
    preventionMeasures: ['预防性抗感染', '营养支持', '避免人群聚集', '疫苗接种'],
    treatmentOptions: ['抗生素治疗', '支持性治疗', '氧疗', '重症监护'],
    parentId: 1 // Child of 呼吸系统并发症
  },
  {
    cancerType: '肺癌',
    complicationName: '胸腔积液',
    description: '胸腔内液体异常积聚，影响呼吸功能',
    riskLevel: RiskLevel.HIGH,
    probability: '20-30%',
    timeframe: '疾病进展期',
    symptoms: ['呼吸困难', '胸痛', '咳嗽', '胸闷'],
    riskFactors: ['癌症晚期', '胸膜转移', '心功能不全', '低蛋白血症'],
    preventionMeasures: ['早期诊断', '积极治疗原发病', '营养支持', '定期检查'],
    treatmentOptions: ['胸腔穿刺', '胸腔引流', '化疗', '胸膜固定术'],
    parentId: 1
  },
  {
    cancerType: '肺癌',
    complicationName: '血液系统并发症',
    description: '肺癌治疗过程中的血液学相关并发症',
    riskLevel: RiskLevel.MEDIUM,
    probability: '60-70%',
    timeframe: '化疗期间',
    symptoms: ['乏力', '易感染', '出血倾向', '贫血'],
    riskFactors: ['化疗药物', '放疗', '骨髓抑制', '营养不良'],
    preventionMeasures: ['血常规监测', '营养支持', '预防感染', '合理用药'],
    treatmentOptions: ['输血', '生长因子', '抗感染', '支持治疗'],
    parentId: null
  },
  {
    cancerType: '肺癌',
    complicationName: '白细胞减少症',
    description: '化疗后常见的血液学并发症，增加感染风险',
    riskLevel: RiskLevel.HIGH,
    probability: '50-60%',
    timeframe: '化疗后7-14天',
    symptoms: ['发热', '乏力', '易感染', '口腔溃疡'],
    riskFactors: ['化疗强度', '年龄', '营养状态', '既往化疗史'],
    preventionMeasures: ['预防性用药', '营养支持', '避免感染源', '定期监测'],
    treatmentOptions: ['G-CSF', '抗感染', '支持治疗', '调整化疗方案'],
    parentId: 4 // Child of 血液系统并发症
  },
  // Breast Cancer Risk Tree
  {
    cancerType: '乳腺癌',
    complicationName: '手术相关并发症',
    description: '乳腺癌手术可能出现的各种并发症',
    riskLevel: RiskLevel.MEDIUM,
    probability: '20-30%',
    timeframe: '术后早期',
    symptoms: ['疼痛', '水肿', '感染', '功能障碍'],
    riskFactors: ['手术范围', '年龄', '既往病史', '术后护理'],
    preventionMeasures: ['术前评估', '无菌操作', '术后护理', '康复训练'],
    treatmentOptions: ['抗感染', '物理治疗', '疼痛管理', '功能锻炼'],
    parentId: null
  },
  {
    cancerType: '乳腺癌',
    complicationName: '淋巴水肿',
    description: '淋巴结清扫后可能出现的上肢水肿',
    riskLevel: RiskLevel.MEDIUM,
    probability: '15-25%',
    timeframe: '术后数月至数年',
    symptoms: ['上肢肿胀', '沉重感', '活动受限', '皮肤变化'],
    riskFactors: ['淋巴结清扫', '放疗', '感染', '肥胖'],
    preventionMeasures: ['避免损伤', '预防感染', '适当锻炼', '体重控制'],
    treatmentOptions: ['压迫治疗', '物理治疗', '药物治疗', '手术治疗'],
    parentId: 6 // Child of 手术相关并发症
  }
];

export async function seedKnowledgeGraph() {
  try {
    console.log('🌱 Seeding knowledge graph...');
    
    // Insert medical terms
    console.log('📚 Inserting medical terms...');
    const insertedTerms = await db.insert(medicalTerms).values(sampleMedicalTerms).returning();
    console.log(`✅ Inserted ${insertedTerms.length} medical terms`);
    
    // Insert risk trees
    console.log('🌳 Inserting risk trees...');
    const insertedRiskTrees = await db.insert(complicationRiskTrees).values(sampleRiskTrees).returning();
    console.log(`✅ Inserted ${insertedRiskTrees.length} risk tree nodes`);
    
    console.log('🎉 Knowledge graph seeding completed successfully!');
    return {
      terms: insertedTerms,
      riskTrees: insertedRiskTrees
    };
  } catch (error) {
    console.error('❌ Error seeding knowledge graph:', error);
    throw error;
  }
}

// Run seeding if called directly
if (require.main === module) {
  seedKnowledgeGraph()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}