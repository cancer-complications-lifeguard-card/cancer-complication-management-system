import { desc, eq, like, and, isNull, inArray } from 'drizzle-orm';
import { db } from './drizzle';
import { 
  medicalTerms, 
  complicationRiskTrees, 
  knowledgeInteractions,
  users,
  TermCategory,
  RiskLevel,
  InteractionType,
  ActivityType 
} from './schema';
import type { 
  MedicalTerm, 
  NewMedicalTerm, 
  ComplicationRiskTree, 
  NewComplicationRiskTree,
  KnowledgeInteraction,
  NewKnowledgeInteraction
} from './schema';

// Medical Terms Operations
export async function searchMedicalTerms(query: string, category?: TermCategory) {
  const conditions = [
    like(medicalTerms.term, `%${query}%`)
  ];
  
  if (category) {
    conditions.push(eq(medicalTerms.category, category));
  }

  return await db
    .select()
    .from(medicalTerms)
    .where(and(...conditions))
    .orderBy(medicalTerms.term)
    .limit(20);
}

export async function getMedicalTermById(id: number) {
  const result = await db
    .select()
    .from(medicalTerms)
    .where(eq(medicalTerms.id, id))
    .limit(1);
  
  return result[0] || null;
}

export async function getMedicalTermsByCategory(category: TermCategory) {
  return await db
    .select()
    .from(medicalTerms)
    .where(eq(medicalTerms.category, category))
    .orderBy(medicalTerms.term);
}

export async function getRelatedTerms(termId: number) {
  const term = await getMedicalTermById(termId);
  if (!term?.relatedTerms) return [];
  
  const relatedIds = term.relatedTerms as number[];
  if (relatedIds.length === 0) return [];
  
  return await db
    .select()
    .from(medicalTerms)
    .where(inArray(medicalTerms.id, relatedIds));
}

export async function createMedicalTerm(term: NewMedicalTerm) {
  const result = await db
    .insert(medicalTerms)
    .values(term)
    .returning();
  
  return result[0];
}

export async function updateMedicalTerm(id: number, updates: Partial<NewMedicalTerm>) {
  const result = await db
    .update(medicalTerms)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(medicalTerms.id, id))
    .returning();
  
  return result[0];
}

// Complication Risk Trees Operations
export async function getRiskTreeByCancerType(cancerType: string) {
  return await db
    .select()
    .from(complicationRiskTrees)
    .where(eq(complicationRiskTrees.cancerType, cancerType))
    .orderBy(complicationRiskTrees.riskLevel, complicationRiskTrees.complicationName);
}

export async function getRiskTreeNode(id: number) {
  const result = await db
    .select()
    .from(complicationRiskTrees)
    .where(eq(complicationRiskTrees.id, id))
    .limit(1);
  
  return result[0] || null;
}

export async function getRiskTreeChildren(parentId: number) {
  return await db
    .select()
    .from(complicationRiskTrees)
    .where(eq(complicationRiskTrees.parentId, parentId))
    .orderBy(complicationRiskTrees.riskLevel, complicationRiskTrees.complicationName);
}

export async function getRiskTreeRoots(cancerType: string) {
  return await db
    .select()
    .from(complicationRiskTrees)
    .where(
      and(
        eq(complicationRiskTrees.cancerType, cancerType),
        isNull(complicationRiskTrees.parentId)
      )
    )
    .orderBy(complicationRiskTrees.riskLevel, complicationRiskTrees.complicationName);
}

export async function getHighRiskComplications(cancerType: string) {
  return await db
    .select()
    .from(complicationRiskTrees)
    .where(
      and(
        eq(complicationRiskTrees.cancerType, cancerType),
        inArray(complicationRiskTrees.riskLevel, [RiskLevel.HIGH, RiskLevel.CRITICAL])
      )
    )
    .orderBy(complicationRiskTrees.riskLevel, complicationRiskTrees.complicationName);
}

export async function createRiskTreeNode(node: NewComplicationRiskTree) {
  const result = await db
    .insert(complicationRiskTrees)
    .values(node)
    .returning();
  
  return result[0];
}

export async function updateRiskTreeNode(id: number, updates: Partial<NewComplicationRiskTree>) {
  const result = await db
    .update(complicationRiskTrees)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(complicationRiskTrees.id, id))
    .returning();
  
  return result[0];
}

// Knowledge Interactions Operations
export async function logKnowledgeInteraction(interaction: NewKnowledgeInteraction) {
  const result = await db
    .insert(knowledgeInteractions)
    .values(interaction)
    .returning();
  
  return result[0];
}

export async function getUserKnowledgeInteractions(userId: number, limit = 50) {
  return await db
    .select()
    .from(knowledgeInteractions)
    .where(eq(knowledgeInteractions.userId, userId))
    .orderBy(desc(knowledgeInteractions.timestamp))
    .limit(limit);
}

export async function getPopularTerms(limit = 10) {
  return await db
    .select({
      resourceId: knowledgeInteractions.resourceId,
      count: knowledgeInteractions.resourceId, // This would need a proper count aggregation
      term: medicalTerms
    })
    .from(knowledgeInteractions)
    .innerJoin(medicalTerms, eq(knowledgeInteractions.resourceId, medicalTerms.id))
    .where(eq(knowledgeInteractions.resourceType, 'medical_term'))
    .groupBy(knowledgeInteractions.resourceId, medicalTerms.id)
    .orderBy(desc(knowledgeInteractions.resourceId))
    .limit(limit);
}

// Helper function to build hierarchical risk tree
export async function buildRiskTreeHierarchy(cancerType: string): Promise<ComplicationRiskTree[]> {
  const roots = await getRiskTreeRoots(cancerType);
  
  const buildChildren = async (node: ComplicationRiskTree): Promise<ComplicationRiskTree & { children: ComplicationRiskTree[] }> => {
    const children = await getRiskTreeChildren(node.id);
    const childrenWithSubChildren = await Promise.all(
      children.map(child => buildChildren(child))
    );
    
    return {
      ...node,
      children: childrenWithSubChildren
    };
  };
  
  return await Promise.all(roots.map(root => buildChildren(root)));
}

// Search across all knowledge resources
export async function searchKnowledge(query: string, userId?: number) {
  const termResults = await searchMedicalTerms(query);
  
  const riskTreeResults = await db
    .select()
    .from(complicationRiskTrees)
    .where(
      like(complicationRiskTrees.complicationName, `%${query}%`)
    )
    .limit(10);
  
  // Log search interaction if user is provided
  if (userId) {
    await logKnowledgeInteraction({
      userId,
      interactionType: InteractionType.SEARCH_QUERY,
      resourceType: 'search',
      resourceId: 0,
      query,
      metadata: {
        termResults: termResults.length,
        riskTreeResults: riskTreeResults.length,
        timestamp: new Date().toISOString()
      }
    });
  }
  
  return {
    terms: termResults,
    riskTrees: riskTreeResults,
    totalResults: termResults.length + riskTreeResults.length
  };
}