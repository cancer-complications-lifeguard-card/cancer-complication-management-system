import { eq, like, ilike, and, or, desc, asc, inArray, sql } from 'drizzle-orm';
import { db } from './drizzle';
import {
  nccnGuidelines,
  drugInteractions,
  clinicalTrials,
  knowledgeArticles,
  userKnowledgeInteractions,
  type NCCNGuideline,
  type NewNCCNGuideline,
  type DrugInteraction,
  type NewDrugInteraction,
  type ClinicalTrial,
  type NewClinicalTrial,
  type KnowledgeArticle,
  type NewKnowledgeArticle,
  type UserKnowledgeInteraction,
  type NewUserKnowledgeInteraction,
} from './schema';

// NCCN Guidelines Functions
export async function searchNCCNGuidelines(params: {
  query?: string;
  cancerType?: string;
  category?: string;
  limit?: number;
  offset?: number;
}): Promise<NCCNGuideline[]> {
  const { query, cancerType, category, limit = 20, offset = 0 } = params;
  
  let whereConditions = [eq(nccnGuidelines.isActive, true)];
  
  if (query) {
    whereConditions.push(
      or(
        ilike(nccnGuidelines.title, `%${query}%`),
        ilike(nccnGuidelines.summary, `%${query}%`),
        sql`${nccnGuidelines.keywords} ILIKE ${`%${query}%`}`
      )!
    );
  }
  
  if (cancerType) {
    whereConditions.push(eq(nccnGuidelines.cancerType, cancerType));
  }
  
  if (category) {
    whereConditions.push(eq(nccnGuidelines.category, category));
  }
  
  return await db
    .select()
    .from(nccnGuidelines)
    .where(and(...whereConditions))
    .orderBy(desc(nccnGuidelines.effectiveDate))
    .limit(limit)
    .offset(offset);
}

export async function getNCCNGuidelineById(id: number): Promise<NCCNGuideline | null> {
  const guidelines = await db
    .select()
    .from(nccnGuidelines)
    .where(and(eq(nccnGuidelines.id, id), eq(nccnGuidelines.isActive, true)))
    .limit(1);
  
  return guidelines[0] || null;
}

export async function getNCCNGuidelinesByCategory(cancerType: string, category?: string): Promise<NCCNGuideline[]> {
  let whereConditions = [
    eq(nccnGuidelines.cancerType, cancerType),
    eq(nccnGuidelines.isActive, true)
  ];
  
  if (category) {
    whereConditions.push(eq(nccnGuidelines.category, category));
  }
  
  return await db
    .select()
    .from(nccnGuidelines)
    .where(and(...whereConditions))
    .orderBy(desc(nccnGuidelines.effectiveDate));
}

export async function createNCCNGuideline(guideline: NewNCCNGuideline): Promise<NCCNGuideline> {
  const [newGuideline] = await db.insert(nccnGuidelines).values(guideline).returning();
  return newGuideline;
}

// Drug Interactions Functions
export async function checkDrugInteractions(drugNames: string[]): Promise<DrugInteraction[]> {
  if (drugNames.length < 2) return [];
  
  const interactions = [];
  
  // Check all combinations of drugs
  for (let i = 0; i < drugNames.length; i++) {
    for (let j = i + 1; j < drugNames.length; j++) {
      const drugA = drugNames[i].toLowerCase();
      const drugB = drugNames[j].toLowerCase();
      
      const interaction = await db
        .select()
        .from(drugInteractions)
        .where(
          and(
            eq(drugInteractions.isActive, true),
            or(
              and(
                ilike(drugInteractions.drugA, `%${drugA}%`),
                ilike(drugInteractions.drugB, `%${drugB}%`)
              ),
              and(
                ilike(drugInteractions.drugA, `%${drugB}%`),
                ilike(drugInteractions.drugB, `%${drugA}%`)
              )
            )
          )
        );
      
      interactions.push(...interaction);
    }
  }
  
  return interactions;
}

export async function searchDrugInteractions(drugName: string): Promise<DrugInteraction[]> {
  return await db
    .select()
    .from(drugInteractions)
    .where(
      and(
        eq(drugInteractions.isActive, true),
        or(
          ilike(drugInteractions.drugA, `%${drugName}%`),
          ilike(drugInteractions.drugB, `%${drugName}%`)
        )
      )
    )
    .orderBy(desc(drugInteractions.severity));
}

export async function getDrugInteractionsBySeverity(severity: string): Promise<DrugInteraction[]> {
  return await db
    .select()
    .from(drugInteractions)
    .where(
      and(
        eq(drugInteractions.severity, severity),
        eq(drugInteractions.isActive, true)
      )
    )
    .orderBy(asc(drugInteractions.drugA));
}

export async function createDrugInteraction(interaction: NewDrugInteraction): Promise<DrugInteraction> {
  const [newInteraction] = await db.insert(drugInteractions).values(interaction).returning();
  return newInteraction;
}

// Clinical Trials Functions
export async function searchClinicalTrials(params: {
  query?: string;
  cancerTypes?: string[];
  phase?: string;
  status?: string;
  location?: string;
  limit?: number;
  offset?: number;
}): Promise<ClinicalTrial[]> {
  const { query, cancerTypes, phase, status, location, limit = 20, offset = 0 } = params;
  
  let whereConditions = [eq(clinicalTrials.isActive, true)];
  
  if (query) {
    whereConditions.push(
      or(
        ilike(clinicalTrials.title, `%${query}%`),
        ilike(clinicalTrials.briefSummary, `%${query}%`),
        ilike(clinicalTrials.detailedDescription, `%${query}%`)
      )!
    );
  }
  
  if (cancerTypes && cancerTypes.length > 0) {
    whereConditions.push(
      or(
        ...cancerTypes.map(type => 
          sql`${clinicalTrials.cancerTypes} ILIKE ${`%${type}%`}`
        )
      )!
    );
  }
  
  if (phase) {
    whereConditions.push(eq(clinicalTrials.phase, phase));
  }
  
  if (status) {
    whereConditions.push(eq(clinicalTrials.status, status));
  }
  
  if (location) {
    whereConditions.push(sql`${clinicalTrials.locations} ILIKE ${`%${location}%`}`);
  }
  
  return await db
    .select()
    .from(clinicalTrials)
    .where(and(...whereConditions))
    .orderBy(desc(clinicalTrials.lastUpdated))
    .limit(limit)
    .offset(offset);
}

export async function getClinicalTrialByNctId(nctId: string): Promise<ClinicalTrial | null> {
  const trials = await db
    .select()
    .from(clinicalTrials)
    .where(and(eq(clinicalTrials.nctId, nctId), eq(clinicalTrials.isActive, true)))
    .limit(1);
  
  return trials[0] || null;
}

export async function getRecruitingTrialsByCancerType(cancerType: string): Promise<ClinicalTrial[]> {
  return await db
    .select()
    .from(clinicalTrials)
    .where(
      and(
        eq(clinicalTrials.status, 'recruiting'),
        sql`${clinicalTrials.cancerTypes} ILIKE ${`%${cancerType}%`}`,
        eq(clinicalTrials.isActive, true)
      )
    )
    .orderBy(desc(clinicalTrials.startDate));
}

export async function createClinicalTrial(trial: NewClinicalTrial): Promise<ClinicalTrial> {
  const [newTrial] = await db.insert(clinicalTrials).values(trial).returning();
  return newTrial;
}

// Knowledge Articles Functions
export async function searchKnowledgeArticles(params: {
  query?: string;
  category?: string;
  subcategory?: string;
  cancerTypes?: string[];
  targetAudience?: string;
  readingLevel?: string;
  limit?: number;
  offset?: number;
}): Promise<KnowledgeArticle[]> {
  const { 
    query, 
    category, 
    subcategory, 
    cancerTypes, 
    targetAudience, 
    readingLevel, 
    limit = 20, 
    offset = 0 
  } = params;
  
  let whereConditions = [
    eq(knowledgeArticles.isPublished, true)
  ];
  
  if (query) {
    whereConditions.push(
      or(
        ilike(knowledgeArticles.title, `%${query}%`),
        ilike(knowledgeArticles.content, `%${query}%`),
        ilike(knowledgeArticles.summary, `%${query}%`),
        sql`${knowledgeArticles.keywords} ILIKE ${`%${query}%`}`
      )!
    );
  }
  
  if (category) {
    whereConditions.push(eq(knowledgeArticles.category, category));
  }
  
  if (subcategory) {
    whereConditions.push(eq(knowledgeArticles.subcategory, subcategory));
  }
  
  if (cancerTypes && cancerTypes.length > 0) {
    whereConditions.push(
      or(
        ...cancerTypes.map(type => 
          sql`${knowledgeArticles.cancerTypes} ILIKE ${`%${type}%`}`
        )
      )!
    );
  }
  
  if (targetAudience) {
    whereConditions.push(eq(knowledgeArticles.targetAudience, targetAudience));
  }
  
  if (readingLevel) {
    whereConditions.push(eq(knowledgeArticles.readingLevel, readingLevel));
  }
  
  return await db
    .select()
    .from(knowledgeArticles)
    .where(and(...whereConditions))
    .orderBy(desc(knowledgeArticles.lastUpdated))
    .limit(limit)
    .offset(offset);
}

export async function getFeaturedArticles(limit: number = 5): Promise<KnowledgeArticle[]> {
  return await db
    .select()
    .from(knowledgeArticles)
    .where(
      and(
        eq(knowledgeArticles.isFeatured, true),
        eq(knowledgeArticles.isPublished, true)
      )
    )
    .orderBy(desc(knowledgeArticles.rating), desc(knowledgeArticles.viewCount))
    .limit(limit);
}

export async function getPopularArticles(limit: number = 10): Promise<KnowledgeArticle[]> {
  return await db
    .select()
    .from(knowledgeArticles)
    .where(eq(knowledgeArticles.isPublished, true))
    .orderBy(desc(knowledgeArticles.viewCount))
    .limit(limit);
}

export async function getKnowledgeArticleById(id: number): Promise<KnowledgeArticle | null> {
  const articles = await db
    .select()
    .from(knowledgeArticles)
    .where(and(eq(knowledgeArticles.id, id), eq(knowledgeArticles.isPublished, true)))
    .limit(1);
  
  return articles[0] || null;
}

export async function incrementArticleViewCount(id: number): Promise<void> {
  await db
    .update(knowledgeArticles)
    .set({ viewCount: sql`${knowledgeArticles.viewCount} + 1` })
    .where(eq(knowledgeArticles.id, id));
}

export async function rateArticle(id: number, newRating: number): Promise<void> {
  const article = await getKnowledgeArticleById(id);
  if (!article) return;
  
  const currentRating = parseFloat(article.rating || '0');
  const currentCount = article.ratingCount || 0;
  
  const newCount = currentCount + 1;
  const updatedRating = ((currentRating * currentCount) + newRating) / newCount;
  
  await db
    .update(knowledgeArticles)
    .set({ 
      rating: updatedRating.toFixed(2),
      ratingCount: newCount
    })
    .where(eq(knowledgeArticles.id, id));
}

export async function createKnowledgeArticle(article: NewKnowledgeArticle): Promise<KnowledgeArticle> {
  const [newArticle] = await db.insert(knowledgeArticles).values(article).returning();
  return newArticle;
}

// User Knowledge Interactions Functions
export async function logKnowledgeInteraction(interaction: NewUserKnowledgeInteraction): Promise<UserKnowledgeInteraction> {
  const [newInteraction] = await db.insert(userKnowledgeInteractions).values(interaction).returning();
  return newInteraction;
}

export async function getUserKnowledgeHistory(
  userId: number,
  contentType?: string,
  limit: number = 50
): Promise<UserKnowledgeInteraction[]> {
  let whereConditions = [eq(userKnowledgeInteractions.userId, userId)];
  
  if (contentType) {
    whereConditions.push(eq(userKnowledgeInteractions.contentType, contentType));
  }
  
  return await db
    .select()
    .from(userKnowledgeInteractions)
    .where(and(...whereConditions))
    .orderBy(desc(userKnowledgeInteractions.timestamp))
    .limit(limit);
}

export async function getUserBookmarks(userId: number): Promise<UserKnowledgeInteraction[]> {
  return await db
    .select()
    .from(userKnowledgeInteractions)
    .where(
      and(
        eq(userKnowledgeInteractions.userId, userId),
        eq(userKnowledgeInteractions.interactionType, 'bookmark')
      )
    )
    .orderBy(desc(userKnowledgeInteractions.timestamp));
}

export async function getPopularContent(contentType: string, limit: number = 10): Promise<any[]> {
  const result = await db
    .select({
      contentId: userKnowledgeInteractions.contentId,
      viewCount: sql<number>`COUNT(*)`.as('view_count')
    })
    .from(userKnowledgeInteractions)
    .where(
      and(
        eq(userKnowledgeInteractions.contentType, contentType),
        eq(userKnowledgeInteractions.interactionType, 'view')
      )
    )
    .groupBy(userKnowledgeInteractions.contentId)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(limit);
  
  return result;
}

// Utility Functions
export async function getKnowledgeBaseStats(): Promise<{
  nccnGuidelines: number;
  drugInteractions: number;
  clinicalTrials: number;
  knowledgeArticles: number;
  totalInteractions: number;
}> {
  const [
    guidelinesCount,
    interactionsCount,
    trialsCount,
    articlesCount,
    userInteractionsCount
  ] = await Promise.all([
    db.select({ count: sql<number>`COUNT(*)` }).from(nccnGuidelines).where(eq(nccnGuidelines.isActive, true)),
    db.select({ count: sql<number>`COUNT(*)` }).from(drugInteractions).where(eq(drugInteractions.isActive, true)),
    db.select({ count: sql<number>`COUNT(*)` }).from(clinicalTrials).where(eq(clinicalTrials.isActive, true)),
    db.select({ count: sql<number>`COUNT(*)` }).from(knowledgeArticles).where(eq(knowledgeArticles.isPublished, true)),
    db.select({ count: sql<number>`COUNT(*)` }).from(userKnowledgeInteractions)
  ]);
  
  return {
    nccnGuidelines: guidelinesCount[0]?.count || 0,
    drugInteractions: interactionsCount[0]?.count || 0,
    clinicalTrials: trialsCount[0]?.count || 0,
    knowledgeArticles: articlesCount[0]?.count || 0,
    totalInteractions: userInteractionsCount[0]?.count || 0,
  };
}

export async function searchAllKnowledgeContent(query: string, limit: number = 20): Promise<{
  guidelines: NCCNGuideline[];
  drugInteractions: DrugInteraction[];
  clinicalTrials: ClinicalTrial[];
  articles: KnowledgeArticle[];
}> {
  const [guidelines, drugInteractions, trials, articles] = await Promise.all([
    searchNCCNGuidelines({ query, limit: Math.ceil(limit / 4) }),
    searchDrugInteractions(query),
    searchClinicalTrials({ query, limit: Math.ceil(limit / 4) }),
    searchKnowledgeArticles({ query, limit: Math.ceil(limit / 4) })
  ]);
  
  return {
    guidelines,
    drugInteractions: drugInteractions.slice(0, Math.ceil(limit / 4)),
    clinicalTrials: trials,
    articles
  };
}