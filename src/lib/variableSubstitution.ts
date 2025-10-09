import { supabase } from '../config/supabase';

export interface TemplateVariable {
  id: string;
  key: string;
  category: string;
  display_name: string;
  is_system: boolean;
  is_active: boolean;
  default_value?: string;
}

export interface SubstitutionContext {
  userId?: string;
  languageCode?: string;
  // Learning-specific context
  lessonData?: {
    lessonId?: string;
    lessonTitle?: string;
    lessonUrl?: string;
    lessonDescription?: string;
    lessonDuration?: string;
  };
  learningTrackData?: {
    trackId?: string;
    trackTitle?: string;
    trackDescription?: string;
    progressPercentage?: number;
    lessonsCompleted?: number;
    totalLessons?: number;
  };
  completionData?: {
    completionDate?: string;
    completionTime?: string;
    completionScore?: number;
    completionPercentage?: number;
  };
  nextLessonData?: {
    isAvailable?: boolean;
    lessonTitle?: string;
    lessonUrl?: string;
    availableDate?: string;
  };
  organizationData?: {
    name?: string;
    supportEmail?: string;
    supportPhone?: string;
    systemName?: string;
    appName?: string;
  };
}

/**
 * Fetches all active template variables with their translations
 */
export const fetchTemplateVariables = async (languageCode: string = 'en'): Promise<TemplateVariable[]> => {
  try {
    // First get the variables
    const { data: variablesData, error: variablesError } = await supabase
      .from('template_variables')
      .select('*')
      .eq('is_active', true);

    if (variablesError) throw variablesError;

    // Then get the translations separately
    const { data: translationsData, error: translationsError } = await supabase
      .from('template_variable_translations')
      .select('variable_id, default_value')
      .eq('language_code', languageCode);

    if (translationsError) throw translationsError;

    // Map translations by variable_id for easy lookup
    const translationsMap = new Map();
    translationsData?.forEach(translation => {
      translationsMap.set(translation.variable_id, translation.default_value);
    });

    return variablesData?.map(variable => ({
      id: variable.id,
      key: variable.key,
      category: variable.category,
      display_name: variable.display_name,
      is_system: variable.is_system,
      is_active: variable.is_active,
      default_value: translationsMap.get(variable.id)
    })) || [];
  } catch (error) {
    console.error('Error fetching template variables:', error);
    return [];
  }
};

/**
 * Get available variables (alias for fetchTemplateVariables for backward compatibility)
 */
export const getAvailableVariables = async (languageCode: string = 'en'): Promise<TemplateVariable[]> => {
  return fetchTemplateVariables(languageCode);
};

/**
 * Substitutes variables in a template string with actual values
 */
export const substituteVariables = async (
  template: string, 
  context: SubstitutionContext = {}
): Promise<string> => {
  try {
    const { 
      userId, 
      languageCode = 'en',
      lessonData,
      learningTrackData,
      completionData,
      nextLessonData,
      organizationData
    } = context;
    
    if (!template) return template;

    // Extract all variable keys from the template
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const matches = template.match(variableRegex);
    
    if (!matches) return template;

    const variableKeys = matches.map(match => match.replace(/\{\{|\}\}/g, '').trim());
    
    if (variableKeys.length === 0) return template;

    // First, get all variable definitions from database (including user-defined ones)
    const { data: allVariables } = await supabase
      .from('template_variables')
      .select('id, key, category, is_system')
      .in('key', variableKeys)
      .eq('is_active', true);

    // Get all translations for these variables
    const variableIds = allVariables?.map(v => v.id) || [];
    const { data: translations } = await supabase
      .from('template_variable_translations')
      .select('variable_id, default_value')
      .in('variable_id', variableIds)
      .eq('language_code', languageCode);

    // Create a map of variable key to default value
    const variableMap = new Map();
    allVariables?.forEach(variable => {
      const translation = translations?.find(t => t.variable_id === variable.id);
      variableMap.set(variable.key, translation?.default_value || `{{${variable.key}}}`);
    });

    // Get user-specific data if userId is provided
    let userData: any = {};
    if (userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      userData = profile || {};
    }

    // Get organization data
    const { data: orgData } = await supabase
      .from('organizations')
      .select('*')
      .single();

    // Substitute variables
    let result = template;
    
    for (const key of variableKeys) {
      let value = variableMap.get(key);
      
      // Handle special cases for user data
      if (userId && userData) {
        switch (key) {
          case 'user_name':
            value = userData.full_name || `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || userData.email;
            break;
          case 'first_name':
            value = userData.first_name || '';
            break;
          case 'last_name':
            value = userData.last_name || '';
            break;
          case 'user_email':
            value = userData.email || '';
            break;
          case 'user_department':
            value = userData.department || '';
            break;
        }
      }
      
      // Handle organization data
      if (orgData) {
        switch (key) {
          case 'org_name':
            value = orgData.name || 'Organization';
            break;
        }
      }
      
      // Handle organization context data
      if (organizationData) {
        switch (key) {
          case 'system_name':
            value = organizationData.systemName || 'RAYN Secure';
            break;
          case 'app_name':
            value = organizationData.appName || 'RAYN Secure Hub';
            break;
          case 'support_email':
            value = organizationData.supportEmail || 'support@raynsecure.com';
            break;
          case 'support_phone':
            value = organizationData.supportPhone || '';
            break;
        }
      }
      
      // Handle learning data
      if (lessonData) {
        switch (key) {
          case 'lesson_title':
            value = lessonData.lessonTitle || '';
            break;
          case 'lesson_url':
            value = lessonData.lessonUrl || '';
            break;
          case 'lesson_description':
            value = lessonData.lessonDescription || '';
            break;
          case 'lesson_duration':
            value = lessonData.lessonDuration || '';
            break;
        }
      }
      
      if (learningTrackData) {
        switch (key) {
          case 'learning_track_title':
            value = learningTrackData.trackTitle || '';
            break;
          case 'learning_track_description':
            value = learningTrackData.trackDescription || '';
            break;
          case 'track_progress_percentage':
            value = learningTrackData.progressPercentage?.toString() || '0';
            break;
          case 'lessons_completed_in_track':
            value = learningTrackData.lessonsCompleted?.toString() || '0';
            break;
          case 'total_lessons_in_track':
            value = learningTrackData.totalLessons?.toString() || '0';
            break;
        }
      }
      
      if (completionData) {
        switch (key) {
          case 'completion_date':
            value = completionData.completionDate || new Date().toLocaleDateString();
            break;
          case 'completion_time':
            value = completionData.completionTime || new Date().toLocaleTimeString();
            break;
          case 'completion_score':
            value = completionData.completionScore?.toString() || '';
            break;
          case 'completion_percentage':
            value = completionData.completionPercentage?.toString() || '';
            break;
        }
      }
      
      if (nextLessonData) {
        switch (key) {
          case 'next_lesson_available':
            value = nextLessonData.isAvailable ? 'true' : 'false';
            break;
          case 'next_lesson_title':
            value = nextLessonData.lessonTitle || '';
            break;
          case 'next_lesson_url':
            value = nextLessonData.lessonUrl || '';
            break;
          case 'next_lesson_available_date':
            value = nextLessonData.availableDate || '';
            break;
        }
      }
      
      // Handle system variables
      switch (key) {
        case 'current_date':
          value = new Date().toLocaleDateString();
          break;
        case 'current_time':
          value = new Date().toLocaleTimeString();
          break;
        case 'notification_date':
          value = new Date().toLocaleDateString();
          break;
        case 'notification_time':
          value = new Date().toLocaleTimeString();
          break;
        case 'login_url':
          value = `${window.location.origin}/login`;
          break;
        case 'dashboard_url':
          value = `${window.location.origin}/dashboard`;
          break;
        case 'profile_url':
          value = `${window.location.origin}/profile`;
          break;
        case 'settings_url':
          value = `${window.location.origin}/settings`;
          break;
      }
      
      // If no specific value found, use the default or keep the placeholder
      if (!value) {
        value = `{{${key}}}`;
      }
      
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    }

    return result;
  } catch (error) {
    console.error('Error substituting variables:', error);
    return template;
  }
};

/**
 * Validates that all variables in a template are defined
 */
export const validateTemplateVariables = async (template: string): Promise<{
  isValid: boolean;
  undefinedVariables: string[];
  validVariables: string[];
}> => {
  try {
    if (!template) {
      return { isValid: true, undefinedVariables: [], validVariables: [] };
    }

    // Extract all variable keys from the template
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const matches = template.match(variableRegex);
    
    if (!matches) {
      return { isValid: true, undefinedVariables: [], validVariables: [] };
    }

    const variableKeys = [...new Set(matches.map(match => match.replace(/\{\{|\}\}/g, '').trim()))];
    
    // Check which variables exist in the database
    const { data: existingVariables } = await supabase
      .from('template_variables')
      .select('key')
      .in('key', variableKeys)
      .eq('is_active', true);

    const validKeys = existingVariables?.map(v => v.key) || [];
    const undefinedVariables = variableKeys.filter(key => !validKeys.includes(key));

    return {
      isValid: undefinedVariables.length === 0,
      undefinedVariables,
      validVariables: validKeys
    };
  } catch (error) {
    console.error('Error validating template variables:', error);
    return { isValid: false, undefinedVariables: [], validVariables: [] };
  }
};

/**
 * Creates a new template variable
 */
export const createTemplateVariable = async (newVariable: {
  key: string;
  category: string;
  display_name: string;
  is_system?: boolean;
}): Promise<{ success: boolean; error?: string }> => {
  try {
    // First get the variable
    const { data: existingVariable, error: variableError } = await supabase
      .from('template_variables')
      .select('id')
      .eq('key', newVariable.key)
      .maybeSingle();

    if (variableError) throw variableError;

    if (existingVariable) {
      return { success: false, error: 'Variable with this key already exists' };
    }

    // Insert variable
    const { data: variableData, error: variableInsertError } = await supabase
      .from('template_variables')
      .insert({
        key: newVariable.key,
        category: newVariable.category,
        display_name: newVariable.display_name,
        is_system: newVariable.is_system || false,
        is_active: true
      })
      .select()
      .single();

    if (variableInsertError) throw variableInsertError;

    // Insert default English translation
    const { error: translationError } = await supabase
      .from('template_variable_translations')
      .insert({
        variable_id: variableData.id,
        language_code: 'en',
        display_name: newVariable.display_name,
        default_value: newVariable.display_name
      });

    if (translationError) throw translationError;

    return { success: true };
  } catch (error: any) {
    console.error('Error creating template variable:', error);
    return { success: false, error: error.message };
  }
};
