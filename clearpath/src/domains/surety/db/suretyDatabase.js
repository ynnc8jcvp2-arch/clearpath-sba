/**
 * Surety Database Service
 * Handles persistence of analyses, applications, and documents
 *
 * Note: This requires Supabase client initialization
 * Set VITE_SUPABASE_URL and VITE_SUPABASE_KEY in .env
 */

let supabase = null;

/**
 * Initialize Supabase client
 */
export function initializeSuretyDB(supabaseClient) {
  supabase = supabaseClient;
}

/**
 * Store a new surety application with analysis
 */
export async function createApplication(applicationData) {
  if (!supabase) throw new Error('Supabase not initialized');

  const {
    documentId,
    documentName,
    documentType,
    applicantName,
    businessType,
    industry,
    analysis,
  } = applicationData;

  try {
    // Insert application
    const { data: appData, error: appError } = await supabase
      .from('surety_applications')
      .insert([
        {
          document_id: documentId,
          applicant_name: applicantName,
          business_type: businessType,
          industry,
          analysis_type: analysis.metadata?.analysisType || 'full',
          overall_risk_level: analysis.underwritingSummary?.overallRiskLevel,
          as_allowed_net_income: analysis.underwritingSummary?.keyMetrics?.asAllowedNetIncome,
          as_allowed_margin_percent: analysis.underwritingSummary?.keyMetrics?.asAllowedMarginPercent,
          total_wip: analysis.underwritingSummary?.keyMetrics?.totalWIP,
          active_contracts: analysis.underwritingSummary?.keyMetrics?.activeContracts,
          average_gross_margin: analysis.underwritingSummary?.keyMetrics?.averageGrossMargin,
          total_bond_value: analysis.underwritingSummary?.keyMetrics?.totalBondValue,
          bonds_at_risk_percent: analysis.underwritingSummary?.keyMetrics?.bondsAtRiskPercent,
          analysis_result: analysis,
        },
      ])
      .select();

    if (appError) throw appError;

    const applicationId = appData[0].id;

    // Insert analysis details
    const { error: analysisError } = await supabase
      .from('surety_analyses')
      .insert([
        {
          application_id: applicationId,
          spreading_analysis: analysis.spreadingAnalysis,
          wip_analysis: analysis.wipAnalysis,
          underwriting_summary: analysis.underwritingSummary,
          normalized_data: analysis.parsed?.normalized,
          raw_data: analysis.parsed?.raw,
        },
      ]);

    if (analysisError) throw analysisError;

    // Insert document metadata
    if (documentName) {
      const { error: docError } = await supabase
        .from('surety_documents')
        .insert([
          {
            application_id: applicationId,
            document_name: documentName,
            document_type: documentType,
            extracted_at: new Date().toISOString(),
            extraction_confidence: analysis.metadata?.parseQuality?.confidence || 0.75,
          },
        ]);

      if (docError) console.warn('Document insert warning:', docError);
    }

    // Insert risk factors
    if (analysis.underwritingSummary?.warnings?.length > 0) {
      const analysisId = (
        await supabase
          .from('surety_analyses')
          .select('id')
          .eq('application_id', applicationId)
          .single()
      ).data.id;

      const riskFactors = analysis.underwritingSummary.warnings.map((warning) => ({
        application_id: applicationId,
        analysis_id: analysisId,
        source: warning.source,
        code: warning.code,
        severity: warning.severity,
        message: warning.message,
        affected_contracts: warning.contractIds,
      }));

      const { error: riskError } = await supabase
        .from('surety_risk_factors')
        .insert(riskFactors);

      if (riskError) console.warn('Risk factors insert warning:', riskError);
    }

    // Insert recommendations
    if (analysis.underwritingSummary?.recommendations?.length > 0) {
      const analysisId = (
        await supabase
          .from('surety_analyses')
          .select('id')
          .eq('application_id', applicationId)
          .single()
      ).data.id;

      const recommendations = analysis.underwritingSummary.recommendations.map(
        (rec, index) => ({
          application_id: applicationId,
          analysis_id: analysisId,
          priority: index,
          recommendation: rec,
        })
      );

      const { error: recError } = await supabase
        .from('surety_recommendations')
        .insert(recommendations);

      if (recError) console.warn('Recommendations insert warning:', recError);
    }

    return {
      success: true,
      applicationId,
    };
  } catch (error) {
    console.error('Failed to create application:', error);
    throw error;
  }
}

/**
 * Retrieve an application with all related data
 */
export async function getApplication(applicationId) {
  if (!supabase) throw new Error('Supabase not initialized');

  try {
    const { data: app, error: appError } = await supabase
      .from('surety_applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (appError) throw appError;

    // Get analyses
    const { data: analyses } = await supabase
      .from('surety_analyses')
      .select('*')
      .eq('application_id', applicationId)
      .order('created_at', { ascending: false });

    // Get documents
    const { data: documents } = await supabase
      .from('surety_documents')
      .select('*')
      .eq('application_id', applicationId);

    // Get risk factors
    const { data: risks } = await supabase
      .from('surety_risk_factors')
      .select('*')
      .eq('application_id', applicationId)
      .order('severity');

    // Get recommendations
    const { data: recommendations } = await supabase
      .from('surety_recommendations')
      .select('*')
      .eq('application_id', applicationId)
      .order('priority', { ascending: false });

    return {
      application: app,
      analyses: analyses || [],
      documents: documents || [],
      riskFactors: risks || [],
      recommendations: recommendations || [],
    };
  } catch (error) {
    console.error('Failed to get application:', error);
    throw error;
  }
}

/**
 * List all applications with filters
 */
export async function listApplications(filters = {}) {
  if (!supabase) throw new Error('Supabase not initialized');

  try {
    let query = supabase.from('surety_applications').select('*');

    // Apply filters
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.riskLevel) query = query.eq('overall_risk_level', filters.riskLevel);
    if (filters.applicantName)
      query = query.ilike('applicant_name', `%${filters.applicantName}%`);
    if (filters.startDate)
      query = query.gte('created_at', new Date(filters.startDate).toISOString());
    if (filters.endDate)
      query = query.lte('created_at', new Date(filters.endDate).toISOString());

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Failed to list applications:', error);
    throw error;
  }
}

/**
 * Update application status
 */
export async function updateApplicationStatus(applicationId, status, notes = null) {
  if (!supabase) throw new Error('Supabase not initialized');

  try {
    const { data, error } = await supabase
      .from('surety_applications')
      .update({
        status,
        notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', applicationId)
      .select();

    if (error) throw error;

    return data[0];
  } catch (error) {
    console.error('Failed to update application status:', error);
    throw error;
  }
}

/**
 * Mark risk factor as reviewed/resolved
 */
export async function resolveRiskFactor(riskFactorId, reviewedBy, reviewNotes = null) {
  if (!supabase) throw new Error('Supabase not initialized');

  try {
    const { data, error } = await supabase
      .from('surety_risk_factors')
      .update({
        is_resolved: true,
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewedBy,
        review_notes: reviewNotes,
      })
      .eq('id', riskFactorId)
      .select();

    if (error) throw error;

    return data[0];
  } catch (error) {
    console.error('Failed to resolve risk factor:', error);
    throw error;
  }
}

/**
 * Complete a recommendation
 */
export async function completeRecommendation(recommendationId, completedBy) {
  if (!supabase) throw new Error('Supabase not initialized');

  try {
    const { data, error } = await supabase
      .from('surety_recommendations')
      .update({
        completed_at: new Date().toISOString(),
        completed_by: completedBy,
      })
      .eq('id', recommendationId)
      .select();

    if (error) throw error;

    return data[0];
  } catch (error) {
    console.error('Failed to complete recommendation:', error);
    throw error;
  }
}

/**
 * Get analytics summary
 */
export async function getAnalyticsSummary(dateRange = null) {
  if (!supabase) throw new Error('Supabase not initialized');

  try {
    let query = supabase
      .from('surety_applications')
      .select('overall_risk_level, status, created_at');

    if (dateRange) {
      const { startDate, endDate } = dateRange;
      query = query
        .gte('created_at', new Date(startDate).toISOString())
        .lte('created_at', new Date(endDate).toISOString());
    }

    const { data, error } = await query;

    if (error) throw error;

    // Calculate summary stats
    const stats = {
      total: data.length,
      byRiskLevel: {
        critical: data.filter((d) => d.overall_risk_level === 'critical').length,
        high: data.filter((d) => d.overall_risk_level === 'high').length,
        moderate: data.filter((d) => d.overall_risk_level === 'moderate').length,
        low: data.filter((d) => d.overall_risk_level === 'low').length,
      },
      byStatus: {
        new: data.filter((d) => d.status === 'new').length,
        in_review: data.filter((d) => d.status === 'in_review').length,
        approved: data.filter((d) => d.status === 'approved').length,
        rejected: data.filter((d) => d.status === 'rejected').length,
      },
    };

    return stats;
  } catch (error) {
    console.error('Failed to get analytics summary:', error);
    throw error;
  }
}
