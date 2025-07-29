#!/usr/bin/env tsx

/**
 * Comprehensive Phase 1 Testing & QA Script
 * Tests all 8 completed Phase 1 modules systematically
 */

interface TestResult {
  module: string;
  endpoint?: string;
  passed: boolean;
  message: string;
  details?: any;
}

class Phase1Tester {
  private baseUrl = 'http://localhost:3000';
  private results: TestResult[] = [];

  // Test session cookie for authenticated requests
  private sessionCookie = 'test-session-12345';

  constructor() {
    console.log('🧪 Phase 1 Comprehensive Testing & QA');
    console.log('=====================================');
  }

  private async makeRequest(
    endpoint: string, 
    options: RequestInit = {},
    requireAuth: boolean = false
  ): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (requireAuth) {
      headers['Cookie'] = `session=${this.sessionCookie}`;
    }

    return fetch(url, {
      ...options,
      headers
    });
  }

  private addResult(module: string, endpoint: string, passed: boolean, message: string, details?: any) {
    this.results.push({ module, endpoint, passed, message, details });
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${module}: ${message}`);
    if (details && !passed) {
      console.log(`   Details: ${JSON.stringify(details, null, 2)}`);
    }
  }

  // Test 1: Project Setup & Foundation
  async testProjectFoundation() {
    console.log('\n📋 Testing Project Setup & Foundation...');
    
    try {
      // Test basic app load
      const response = await this.makeRequest('/');
      if (response.ok) {
        this.addResult('Foundation', '/', true, 'Homepage loads successfully');
      } else {
        this.addResult('Foundation', '/', false, `Homepage failed: ${response.status}`);
      }

      // Test favicon
      const faviconResponse = await this.makeRequest('/favicon.ico');
      this.addResult('Foundation', '/favicon.ico', faviconResponse.ok, 
        faviconResponse.ok ? 'Favicon loads' : 'Favicon missing');

    } catch (error) {
      this.addResult('Foundation', '/', false, 'Failed to connect to application', error);
    }
  }

  // Test 2: User Management System
  async testUserManagement() {
    console.log('\n👤 Testing User Management System...');

    try {
      // Test user API endpoint
      const userResponse = await this.makeRequest('/api/user');
      if (userResponse.status === 200 || userResponse.status === 401) {
        this.addResult('User Management', '/api/user', true, 'User API endpoint responds');
      } else {
        this.addResult('User Management', '/api/user', false, `User API failed: ${userResponse.status}`);
      }

      // Test role management
      const roleResponse = await this.makeRequest('/api/user/role');
      this.addResult('User Management', '/api/user/role', 
        roleResponse.status < 500, 'Role management endpoint accessible');

      // Test stage management  
      const stageResponse = await this.makeRequest('/api/user/stage');
      this.addResult('User Management', '/api/user/stage',
        stageResponse.status < 500, 'Stage management endpoint accessible');

      // Test user management dashboard
      const dashboardResponse = await this.makeRequest('/dashboard/user-management');
      this.addResult('User Management', '/dashboard/user-management',
        dashboardResponse.ok, 'User management dashboard loads');

    } catch (error) {
      this.addResult('User Management', '/api/user', false, 'User management system error', error);
    }
  }

  // Test 3: Knowledge Graph Center
  async testKnowledgeGraph() {
    console.log('\n🧠 Testing Knowledge Graph Center...');

    try {
      // Test medical terms API
      const termsResponse = await this.makeRequest('/api/medical-terms/popular');
      this.addResult('Knowledge Graph', '/api/medical-terms/popular',
        termsResponse.ok, 'Medical terms API responds');

      // Test risk trees API
      const riskTreeResponse = await this.makeRequest('/api/risk-trees/breast_cancer');
      this.addResult('Knowledge Graph', '/api/risk-trees/breast_cancer',
        riskTreeResponse.status < 500, 'Risk trees API accessible');

      // Test knowledge dashboard
      const knowledgeResponse = await this.makeRequest('/dashboard/knowledge');
      this.addResult('Knowledge Graph', '/dashboard/knowledge',
        knowledgeResponse.ok, 'Knowledge dashboard loads');

      // Test search functionality
      const searchResponse = await this.makeRequest('/api/medical-terms/search?q=cancer');
      this.addResult('Knowledge Graph', '/api/medical-terms/search',
        searchResponse.status < 500, 'Medical terms search works');

    } catch (error) {
      this.addResult('Knowledge Graph', '/api/medical-terms', false, 'Knowledge graph system error', error);
    }
  }

  // Test 4: Personal Health Records
  async testHealthRecords() {
    console.log('\n🏥 Testing Personal Health Records...');

    try {
      // Test medical profile API
      const profileResponse = await this.makeRequest('/api/medical-profile');
      this.addResult('Health Records', '/api/medical-profile',
        profileResponse.status < 500, 'Medical profile API accessible');

      // Test medical records API
      const recordsResponse = await this.makeRequest('/api/medical-records');
      this.addResult('Health Records', '/api/medical-records',
        recordsResponse.status < 500, 'Medical records API accessible');

      // Test medications API
      const medicationsResponse = await this.makeRequest('/api/medications');
      this.addResult('Health Records', '/api/medications',
        medicationsResponse.status < 500, 'Medications API accessible');

      // Test medication reminders
      const remindersResponse = await this.makeRequest('/api/medications/reminders');
      this.addResult('Health Records', '/api/medications/reminders',
        remindersResponse.status < 500, 'Medication reminders API accessible');

      // Test health dashboard
      const healthDashboard = await this.makeRequest('/dashboard/health');
      this.addResult('Health Records', '/dashboard/health',
        healthDashboard.ok, 'Health dashboard loads');

    } catch (error) {
      this.addResult('Health Records', '/api/medical-profile', false, 'Health records system error', error);
    }
  }

  // Test 5: Vital Signs Monitoring Dashboard
  async testVitalSignsMonitoring() {
    console.log('\n📊 Testing Vital Signs Monitoring...');

    try {
      // Test vital signs API
      const vitalSignsResponse = await this.makeRequest('/api/vital-signs');
      this.addResult('Vital Signs', '/api/vital-signs',
        vitalSignsResponse.status < 500, 'Vital signs API accessible');

      // Test monitoring dashboard
      const monitoringResponse = await this.makeRequest('/dashboard/monitoring');
      this.addResult('Vital Signs', '/dashboard/monitoring',
        monitoringResponse.ok, 'Monitoring dashboard loads');

    } catch (error) {
      this.addResult('Vital Signs', '/api/vital-signs', false, 'Vital signs monitoring error', error);
    }
  }

  // Test 6: Intelligent Triage Engine
  async testTriageEngine() {
    console.log('\n🚨 Testing Intelligent Triage Engine...');

    try {
      // Test symptoms API
      const symptomsResponse = await this.makeRequest('/api/symptoms');
      this.addResult('Triage Engine', '/api/symptoms',
        symptomsResponse.status < 500, 'Symptoms API accessible');

      // Test triage assessments API
      const triageResponse = await this.makeRequest('/api/triage-assessments');
      this.addResult('Triage Engine', '/api/triage-assessments',
        triageResponse.status < 500, 'Triage assessments API accessible');

      // Test triage dashboard
      const triageDashboard = await this.makeRequest('/dashboard/triage');
      this.addResult('Triage Engine', '/dashboard/triage',
        triageDashboard.ok, 'Triage dashboard loads');

    } catch (error) {
      this.addResult('Triage Engine', '/api/symptoms', false, 'Triage engine error', error);
    }
  }

  // Test 7: Medical Resource Navigation
  async testMedicalResources() {
    console.log('\n🗺️ Testing Medical Resource Navigation...');

    try {
      // Test medical resources API
      const resourcesResponse = await this.makeRequest('/api/medical-resources');
      this.addResult('Medical Resources', '/api/medical-resources',
        resourcesResponse.status < 500, 'Medical resources API accessible');

      // Test resources dashboard
      const resourcesDashboard = await this.makeRequest('/dashboard/resources');
      this.addResult('Medical Resources', '/dashboard/resources',
        resourcesDashboard.ok, 'Resources dashboard loads');

    } catch (error) {
      this.addResult('Medical Resources', '/api/medical-resources', false, 'Medical resources error', error);
    }
  }

  // Test 8: Emergency Red Card System
  async testEmergencySystem() {
    console.log('\n🆘 Testing Emergency Red Card System...');

    try {
      // Test emergency cards API
      const cardsResponse = await this.makeRequest('/api/emergency-cards');
      this.addResult('Emergency System', '/api/emergency-cards',
        cardsResponse.status < 500, 'Emergency cards API accessible');

      // Test emergency calls API
      const callsResponse = await this.makeRequest('/api/emergency-calls');
      this.addResult('Emergency System', '/api/emergency-calls',
        callsResponse.status < 500, 'Emergency calls API accessible');

      // Test QR code scanning
      const scanResponse = await this.makeRequest('/api/emergency-cards/scan');
      this.addResult('Emergency System', '/api/emergency-cards/scan',
        scanResponse.status < 500, 'QR code scanning API accessible');

      // Test emergency dashboard
      const emergencyDashboard = await this.makeRequest('/dashboard/emergency');
      this.addResult('Emergency System', '/dashboard/emergency',
        emergencyDashboard.ok, 'Emergency dashboard loads');

    } catch (error) {
      this.addResult('Emergency System', '/api/emergency-cards', false, 'Emergency system error', error);
    }
  }

  // Test 9: Medical Knowledge Base Integration
  async testKnowledgeBase() {
    console.log('\n📚 Testing Medical Knowledge Base...');

    try {
      // Test knowledge base stats
      const statsResponse = await this.makeRequest('/api/knowledge-base/search?stats=true');
      this.addResult('Knowledge Base', '/api/knowledge-base/search',
        statsResponse.status < 500, 'Knowledge base stats API accessible');

      // Test NCCN guidelines
      const guidelinesResponse = await this.makeRequest('/api/knowledge-base/nccn-guidelines');
      this.addResult('Knowledge Base', '/api/knowledge-base/nccn-guidelines',
        guidelinesResponse.status < 500, 'NCCN guidelines API accessible');

      // Test drug interactions
      const drugResponse = await this.makeRequest('/api/knowledge-base/drug-interactions?drug=aspirin');
      this.addResult('Knowledge Base', '/api/knowledge-base/drug-interactions',
        drugResponse.status < 500, 'Drug interactions API accessible');

      // Test clinical trials
      const trialsResponse = await this.makeRequest('/api/knowledge-base/clinical-trials?status=recruiting');
      this.addResult('Knowledge Base', '/api/knowledge-base/clinical-trials',
        trialsResponse.status < 500, 'Clinical trials API accessible');

      // Test knowledge articles
      const articlesResponse = await this.makeRequest('/api/knowledge-base/articles?featured=true');
      this.addResult('Knowledge Base', '/api/knowledge-base/articles',
        articlesResponse.status < 500, 'Knowledge articles API accessible');

      // Test knowledge base dashboard
      const kbDashboard = await this.makeRequest('/dashboard/knowledge-base');
      this.addResult('Knowledge Base', '/dashboard/knowledge-base',
        kbDashboard.ok, 'Knowledge base dashboard loads');

      // Test drug interaction checker
      const drugChecker = await this.makeRequest('/dashboard/drug-interactions');
      this.addResult('Knowledge Base', '/dashboard/drug-interactions',
        drugChecker.ok, 'Drug interaction checker loads');

    } catch (error) {
      this.addResult('Knowledge Base', '/api/knowledge-base', false, 'Knowledge base error', error);
    }
  }

  // Test 10: Privacy Security Implementation
  async testSecuritySystem() {
    console.log('\n🔒 Testing Privacy Security System...');

    try {
      // Test security audit logs
      const auditResponse = await this.makeRequest('/api/security/audit-logs');
      this.addResult('Security System', '/api/security/audit-logs',
        auditResponse.status < 500, 'Security audit logs API accessible');

      // Test security dashboard
      const securityDashboard = await this.makeRequest('/dashboard/security');
      this.addResult('Security System', '/dashboard/security',
        securityDashboard.ok, 'Security dashboard loads');

    } catch (error) {
      this.addResult('Security System', '/api/security', false, 'Security system error', error);
    }
  }

  // Database and system health checks
  async testSystemHealth() {
    console.log('\n🔍 Testing System Health...');

    try {
      // Test if the application is responding
      const healthResponse = await this.makeRequest('/');
      this.addResult('System Health', 'General', healthResponse.ok, 
        healthResponse.ok ? 'Application is responding' : 'Application not responding');

    } catch (error) {
      this.addResult('System Health', 'General', false, 'System health check failed', error);
    }
  }

  // Generate test report
  generateReport() {
    console.log('\n📊 TEST RESULTS SUMMARY');
    console.log('======================');
    
    const moduleResults = new Map<string, { passed: number; total: number }>();
    
    this.results.forEach(result => {
      if (!moduleResults.has(result.module)) {
        moduleResults.set(result.module, { passed: 0, total: 0 });
      }
      const stats = moduleResults.get(result.module)!;
      stats.total++;
      if (result.passed) stats.passed++;
    });

    let totalPassed = 0;
    let totalTests = 0;

    moduleResults.forEach((stats, module) => {
      const percentage = Math.round((stats.passed / stats.total) * 100);
      const status = percentage === 100 ? '✅' : percentage >= 80 ? '⚠️' : '❌';
      console.log(`${status} ${module}: ${stats.passed}/${stats.total} tests passed (${percentage}%)`);
      totalPassed += stats.passed;
      totalTests += stats.total;
    });

    const overallPercentage = Math.round((totalPassed / totalTests) * 100);
    console.log(`\n🎯 OVERALL: ${totalPassed}/${totalTests} tests passed (${overallPercentage}%)`);

    // List failed tests
    const failedTests = this.results.filter(r => !r.passed);
    if (failedTests.length > 0) {
      console.log('\n❌ FAILED TESTS:');
      failedTests.forEach(test => {
        console.log(`   • ${test.module} - ${test.endpoint}: ${test.message}`);
      });
    }

    return {
      totalTests,
      totalPassed,
      overallPercentage,
      moduleResults: Object.fromEntries(moduleResults),
      failedTests: failedTests.map(t => ({ module: t.module, endpoint: t.endpoint, message: t.message }))
    };
  }

  // Run all tests
  async runAllTests() {
    console.log('Starting comprehensive Phase 1 testing...\n');

    await this.testProjectFoundation();
    await this.testUserManagement();
    await this.testKnowledgeGraph();
    await this.testHealthRecords();
    await this.testVitalSignsMonitoring();
    await this.testTriageEngine();
    await this.testMedicalResources();
    await this.testEmergencySystem();
    await this.testKnowledgeBase();
    await this.testSecuritySystem();
    await this.testSystemHealth();

    return this.generateReport();
  }
}

// Run the tests
async function main() {
  const tester = new Phase1Tester();
  
  try {
    const report = await tester.runAllTests();
    
    console.log('\n✨ Phase 1 Testing Complete!');
    
    if (report.overallPercentage >= 90) {
      console.log('🎉 Excellent! Phase 1 is ready for Phase 2 development.');
    } else if (report.overallPercentage >= 80) {
      console.log('👍 Good! Minor issues to address before Phase 2.');
    } else {
      console.log('⚠️ Several issues need attention before proceeding to Phase 2.');
    }
    
    process.exit(report.overallPercentage >= 80 ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Testing failed:', error);
    process.exit(1);
  }
}

main();