
import { supabase } from '@/integrations/supabase/client';

export interface HIBClause {
  id: string;
  hibSection: string;
  hibClause: number;
  hibClauseDescription: string; // Renamed from suggestedArtefacts
  suggestedArtefacts: string; // New column
  implementationStatus: 'No' | 'Yes' | 'Partially' | '';
  remarks: string;
  additionalInformationI: string;
  additionalInformationII: string;
  additionalInformationIII: string;
  sectionNumber?: number; // New column
}

export const getInitialClauses = (): HIBClause[] => [
  {
    id: '1',
    hibSection: 'Section 4.1',
    hibClause: 1,
    hibClauseDescription: 'The organisation shall develop a policy to prioritise the implementation of critical software updates from established software companies or legitimate sources for operating systems or applications (e.g., security patches) to be applied as soon as possible.',
    suggestedArtefacts: 'Software Update Policy, Patch Management Procedures',
    implementationStatus: 'No',
    remarks: '',
    additionalInformationI: 'Data Security/Enterprise Data Management Planning',
    additionalInformationII: 'Implementation Planning',
    additionalInformationIII: 'Technology',
    sectionNumber: 1
  },
  {
    id: '2',
    hibSection: 'Section 4.2',
    hibClause: 2,
    hibClauseDescription: 'When determining the patch timeline in the patch policy, Organisation shall take into consideration.',
    suggestedArtefacts: 'Risk Assessment Documentation, Patch Timeline Matrix',
    implementationStatus: 'No',
    remarks: '',
    additionalInformationI: 'https://www.csa.gov.sg/our-...',
    additionalInformationII: 'Cloud Security for Organisations',
    additionalInformationIII: '',
    sectionNumber: 2
  }
];

export const loadHIBData = async (userId: string): Promise<HIBClause[]> => {
  const { data, error } = await supabase
    .from('hib_checklist')
    .select('*')
    .order('hib_clause', { ascending: true })
    .order('hib_section', { ascending: true });

  if (error) throw error;

  if (data && data.length > 0) {
    return data.map(item => ({
      id: item.id,
      hibSection: item.hib_section,
      hibClause: item.hib_clause,
      hibClauseDescription: item.hib_clause_description || '',
      suggestedArtefacts: item.suggested_artefacts || '',
      implementationStatus: (item.implementation_status || 'No') as 'No' | 'Yes' | 'Partially' | '',
      remarks: item.remarks || '',
      additionalInformationI: item.additional_information_i || '',
      additionalInformationII: item.additional_information_ii || '',
      additionalInformationIII: item.additional_information_iii || '',
      sectionNumber: item.section_number || undefined
    }));
  }

  return [];
};

export const saveHIBData = async (userId: string, clausesToSave: HIBClause[]): Promise<void> => {
  // Delete existing entries for this user
  await supabase
    .from('hib_checklist')
    .delete()
    .eq('user_id', userId);

  // Insert new entries
  const dataToInsert = clausesToSave.map(clause => ({
    user_id: userId,
    hib_section: clause.hibSection,
    hib_clause: clause.hibClause,
    hib_clause_description: clause.hibClauseDescription,
    suggested_artefacts: clause.suggestedArtefacts,
    implementation_status: clause.implementationStatus || 'No',
    remarks: clause.remarks,
    additional_information_i: clause.additionalInformationI,
    additional_information_ii: clause.additionalInformationII,
    additional_information_iii: clause.additionalInformationIII,
    section_number: clause.sectionNumber
  }));

  const { error } = await supabase
    .from('hib_checklist')
    .insert(dataToInsert);

  if (error) throw error;
};

export const updateHIBClause = async (userId: string, id: string, updates: Partial<HIBClause>): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('updateHIBClause called with:', { userId, id, updates });
    
    const updateData = {
      hib_section: updates.hibSection,
      hib_clause: updates.hibClause,
      hib_clause_description: updates.hibClauseDescription,
      suggested_artefacts: updates.suggestedArtefacts,
      implementation_status: updates.implementationStatus || 'No',
      remarks: updates.remarks,
      additional_information_i: updates.additionalInformationI,
      additional_information_ii: updates.additionalInformationII,
      additional_information_iii: updates.additionalInformationIII,
      section_number: updates.sectionNumber
    };
    
    console.log('Supabase update data:', updateData);
    
    const { data, error } = await supabase
      .from('hib_checklist')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select();

    console.log('Supabase update result:', { data, error });

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('updateHIBClause error:', error);
    return { success: false, error: error.message };
  }
};

export const createHIBClause = async (userId: string, data: Partial<HIBClause>): Promise<{ success: boolean; error?: string; data?: HIBClause }> => {
  try {
    const newClause = {
      user_id: userId,
      hib_section: data.hibSection || '',
      hib_clause: data.hibClause || 0,
      hib_clause_description: data.hibClauseDescription || '',
      suggested_artefacts: data.suggestedArtefacts || '',
      implementation_status: data.implementationStatus || 'No',
      remarks: data.remarks || '',
      additional_information_i: data.additionalInformationI || '',
      additional_information_ii: data.additionalInformationII || '',
      additional_information_iii: data.additionalInformationIII || '',
      section_number: data.sectionNumber || null
    };

    const { data: insertedData, error } = await supabase
      .from('hib_checklist')
      .insert([newClause])
      .select()
      .single();

    if (error) throw error;

    const formattedClause: HIBClause = {
      id: insertedData.id,
      hibSection: insertedData.hib_section,
      hibClause: insertedData.hib_clause,
      hibClauseDescription: insertedData.hib_clause_description || '',
      suggestedArtefacts: insertedData.suggested_artefacts || '',
      implementationStatus: (insertedData.implementation_status || 'No') as 'No' | 'Yes' | 'Partially' | '',
      remarks: insertedData.remarks || '',
      additionalInformationI: insertedData.additional_information_i || '',
      additionalInformationII: insertedData.additional_information_ii || '',
      additionalInformationIII: insertedData.additional_information_iii || '',
      sectionNumber: insertedData.section_number || undefined
    };

    return { success: true, data: formattedClause };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const deleteHIBClause = async (userId: string, id: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('hib_checklist')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};
