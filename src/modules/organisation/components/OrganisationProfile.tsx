import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Edit, Save, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import SearchableProfileField from './SearchableProfileField';

interface OrganisationData {
  id?: string;
  organisation_name?: string;
  organisation_name_short?: string;
  acra_uen_number?: string;
  charity_registration_number?: string;
  address?: string;
  telephone?: string;
  annual_turnover?: string;
  number_of_employees?: number;
  number_of_executives?: number;
  appointed_certification_body?: string;
}

interface SignatoryRole {
  id?: string;
  role_type: string;
  signatory_name?: string;
  signatory_title?: string;
  signatory_email?: string;
}

interface SignatoryData {
  name_signatory_cem?: string;
  title_signatory_cem?: string;
  email_signatory_cem?: string;
  name_signatory_hib?: string;
  title_signatory_hib?: string;
  email_signatory_hib?: string;
  name_signatory_dpe?: string;
  title_signatory_dpe?: string;
  email_signatory_dpe?: string;
  dpo_name?: string;
  dpo_email?: string;
  iso_name?: string;
  iso_email?: string;
  head_it_name?: string;
  head_it_email?: string;
  it_manager_name?: string;
  it_manager_email?: string;
}

const OrganisationProfile: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [organisationData, setOrganisationData] = useState<OrganisationData>({});
  const [signatoryData, setSignatoryData] = useState<SignatoryData>({});
  
  // Phone validation function
  const validatePhoneInput = (input: string): string => {
    return input.replace(/[^0-9+\s\-\(\)]/g, '');
  };

  const handleTelephoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const validatedValue = validatePhoneInput(e.target.value);
    setOrganisationData(prev => ({ ...prev, telephone: validatedValue }));
  };
  useEffect(() => {
    fetchOrganisationData();
  }, []);

  const fetchOrganisationData = async () => {
    try {
      setLoading(true);
      
      // Fetch organisation profile data
      const { data: orgProfile, error: orgError } = await supabase
        .from('org_profile')
        .select('*')
        .maybeSingle();

      if (orgError) {
        throw orgError;
      }

      if (orgProfile) {
        setOrganisationData(orgProfile);
      }

      // Fetch signatory roles data
      const { data: sigRoles, error: sigError } = await supabase
        .from('org_sig_roles')
        .select('*');

      if (sigError) {
        throw sigError;
      }

      if (sigRoles && sigRoles.length > 0) {
        const sigData: SignatoryData = {};
        
        sigRoles.forEach((role: any) => {
          switch (role.role_type) {
            case 'cem':
              sigData.name_signatory_cem = role.signatory_name;
              sigData.title_signatory_cem = role.signatory_title;
              sigData.email_signatory_cem = role.signatory_email;
              break;
            case 'hib':
              sigData.name_signatory_hib = role.signatory_name;
              sigData.title_signatory_hib = role.signatory_title;
              sigData.email_signatory_hib = role.signatory_email;
              break;
            case 'dpe':
              sigData.name_signatory_dpe = role.signatory_name;
              sigData.title_signatory_dpe = role.signatory_title;
              sigData.email_signatory_dpe = role.signatory_email;
              break;
            case 'dpo':
              sigData.dpo_name = role.signatory_name;
              sigData.dpo_email = role.signatory_email;
              break;
            case 'iso':
              sigData.iso_name = role.signatory_name;
              sigData.iso_email = role.signatory_email;
              break;
            case 'head_it':
              sigData.head_it_name = role.signatory_name;
              sigData.head_it_email = role.signatory_email;
              break;
            case 'it_manager':
              sigData.it_manager_name = role.signatory_name;
              sigData.it_manager_email = role.signatory_email;
              break;
          }
        });
        
        setSignatoryData(sigData);
      }

    } catch (error) {
      console.error('Error fetching organisation data:', error);
      toast.error('Failed to load organisation data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Save organisation profile data
      const { error: orgError } = await supabase
        .from('org_profile')
        .upsert(organisationData);

      if (orgError) throw orgError;

      // Update signatory roles data
      const updates = [
        { role_type: 'cem', signatory_name: signatoryData.name_signatory_cem, signatory_title: signatoryData.title_signatory_cem, signatory_email: signatoryData.email_signatory_cem },
        { role_type: 'hib', signatory_name: signatoryData.name_signatory_hib, signatory_title: signatoryData.title_signatory_hib, signatory_email: signatoryData.email_signatory_hib },
        { role_type: 'dpe', signatory_name: signatoryData.name_signatory_dpe, signatory_title: signatoryData.title_signatory_dpe, signatory_email: signatoryData.email_signatory_dpe },
        { role_type: 'dpo', signatory_name: signatoryData.dpo_name, signatory_title: '', signatory_email: signatoryData.dpo_email },
        { role_type: 'iso', signatory_name: signatoryData.iso_name, signatory_title: '', signatory_email: signatoryData.iso_email },
        { role_type: 'head_it', signatory_name: signatoryData.head_it_name, signatory_title: '', signatory_email: signatoryData.head_it_email },
        { role_type: 'it_manager', signatory_name: signatoryData.it_manager_name, signatory_title: '', signatory_email: signatoryData.it_manager_email }
      ];

      for (const update of updates) {
        const { error: sigError } = await supabase
          .from('org_sig_roles')
          .upsert(update, { onConflict: 'role_type' });

        if (sigError) throw sigError;
      }

      toast.success('Organisation profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving organisation data:', error);
      toast.error('Failed to save organisation data');
    } finally {
      setSaving(false);
    }
  };

  const fetchUserEmailAndRole = async (userId: string) => {
    try {
      // Get email using the database function
      const { data: emailData, error: emailError } = await supabase
        .rpc('get_user_email_by_id', { user_id: userId });
      
      if (emailError) {
        console.error('Error fetching user email:', emailError);
        return { email: '', title: '' };
      }
      
      // Get primary role from user_profile_roles + roles
      const { data: roleData, error: roleError } = await supabase
        .from('user_profile_roles')
        .select(`
          roles(name)
        `)
        .eq('user_id', userId)
        .eq('is_primary', true)
        .maybeSingle();
      
      if (roleError) {
        console.error('Error fetching user role:', roleError);
        return { email: emailData || '', title: '' };
      }
      
      return {
        email: emailData || '',
        title: roleData?.roles?.name || ''
      };
      
    } catch (error) {
      console.error('Error in fetchUserEmailAndRole:', error);
      return { email: '', title: '' };
    }
  };

  const handleProfileSelect = async (role: string, profile: any) => {
    if (!profile) {
      // Clear the selection
      switch (role) {
        case 'cem':
          setSignatoryData(prev => ({ 
            ...prev, 
            name_signatory_cem: '', 
            title_signatory_cem: '',
            email_signatory_cem: '' 
          }));
          break;
        case 'hib':
          setSignatoryData(prev => ({ 
            ...prev, 
            name_signatory_hib: '', 
            title_signatory_hib: '',
            email_signatory_hib: '' 
          }));
          break;
        case 'dpe':
          setSignatoryData(prev => ({ 
            ...prev, 
            name_signatory_dpe: '', 
            title_signatory_dpe: '',
            email_signatory_dpe: '' 
          }));
          break;
        case 'dpo':
          setSignatoryData(prev => ({ 
            ...prev, 
            dpo_name: '', 
            dpo_email: '' 
          }));
          break;
        case 'iso':
          setSignatoryData(prev => ({ 
            ...prev, 
            iso_name: '', 
            iso_email: '' 
          }));
          break;
        case 'head_it':
          setSignatoryData(prev => ({ 
            ...prev, 
            head_it_name: '', 
            head_it_email: '' 
          }));
          break;
        case 'it_manager':
          setSignatoryData(prev => ({ 
            ...prev, 
            it_manager_name: '', 
            it_manager_email: '' 
          }));
          break;
      }
      return;
    }

    // Get user's email and primary role
    const { email, title } = await fetchUserEmailAndRole(profile.id);
    
    switch (role) {
      case 'cem':
        setSignatoryData(prev => ({ 
          ...prev, 
          name_signatory_cem: profile.full_name, 
          title_signatory_cem: title,
          email_signatory_cem: email 
        }));
        break;
      case 'hib':
        setSignatoryData(prev => ({ 
          ...prev, 
          name_signatory_hib: profile.full_name, 
          title_signatory_hib: title,
          email_signatory_hib: email 
        }));
        break;
      case 'dpe':
        setSignatoryData(prev => ({ 
          ...prev, 
          name_signatory_dpe: profile.full_name, 
          title_signatory_dpe: title,
          email_signatory_dpe: email 
        }));
        break;
      case 'dpo':
        setSignatoryData(prev => ({ 
          ...prev, 
          dpo_name: profile.full_name, 
          dpo_email: email 
        }));
        break;
      case 'iso':
        setSignatoryData(prev => ({ 
          ...prev, 
          iso_name: profile.full_name, 
          iso_email: email 
        }));
        break;
      case 'head_it':
        setSignatoryData(prev => ({ 
          ...prev, 
          head_it_name: profile.full_name, 
          head_it_email: email 
        }));
        break;
      case 'it_manager':
        setSignatoryData(prev => ({ 
          ...prev, 
          it_manager_name: profile.full_name, 
          it_manager_email: email 
        }));
        break;
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    fetchOrganisationData(); // Reset to original data
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Organisation Profile</h2>
          <p className="text-muted-foreground">Manage organisation details and signatory information</p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} variant="outline" size="icon">
            <Edit className="h-4 w-4" />
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving} size="icon">
              <Save className="h-4 w-4" />
            </Button>
            <Button onClick={handleCancel} variant="outline" disabled={saving} size="icon">
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* General Organisation Information */}
      <Card>
        <CardHeader>
          <CardTitle>General Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-left">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="org-name">Organisation Name</Label>
              <Input
                id="org-name"
                value={organisationData.organisation_name || ''}
                onChange={(e) => setOrganisationData(prev => ({ ...prev, organisation_name: e.target.value }))}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-name-short">Organisation Name (Short)</Label>
              <Input
                id="org-name-short"
                value={organisationData.organisation_name_short || ''}
                onChange={(e) => setOrganisationData(prev => ({ ...prev, organisation_name_short: e.target.value }))}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="acra-uen">ACRA Number/Unique Entity Number (UEN)</Label>
              <Input
                id="acra-uen"
                value={organisationData.acra_uen_number || ''}
                onChange={(e) => setOrganisationData(prev => ({ ...prev, acra_uen_number: e.target.value }))}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="charity-reg">Charity Registration Number</Label>
              <Input
                id="charity-reg"
                value={organisationData.charity_registration_number || ''}
                onChange={(e) => setOrganisationData(prev => ({ ...prev, charity_registration_number: e.target.value }))}
                disabled={!isEditing}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={organisationData.address || ''}
              onChange={(e) => setOrganisationData(prev => ({ ...prev, address: e.target.value }))}
              disabled={!isEditing}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telephone">Telephone</Label>
              <Input
                id="telephone"
                value={organisationData.telephone || ''}
                onChange={handleTelephoneChange} // Use the new handler
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="annual-turnover">Annual Turnover</Label>
              <Input
                id="annual-turnover"
                value={organisationData.annual_turnover || ''}
                onChange={(e) => setOrganisationData(prev => ({ ...prev, annual_turnover: e.target.value }))}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="num-employees">Number of Employees</Label>
              <Input
                id="num-employees"
                type="number"
                value={organisationData.number_of_employees || ''}
                onChange={(e) => setOrganisationData(prev => ({ ...prev, number_of_employees: parseInt(e.target.value) || 0 }))}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="num-executives">Number of Executives</Label>
              <Input
                id="num-executives"
                type="number"
                value={organisationData.number_of_executives || ''}
                onChange={(e) => setOrganisationData(prev => ({ ...prev, number_of_executives: parseInt(e.target.value) || 0 }))}
                disabled={!isEditing}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cert-body">Appointed Certification Body</Label>
            <Input
              id="cert-body"
              value={organisationData.appointed_certification_body || ''}
              onChange={(e) => setOrganisationData(prev => ({ ...prev, appointed_certification_body: e.target.value }))}
              disabled={!isEditing}
            />
          </div>
        </CardContent>
      </Card>

      {/* Signatory Information */}
      <Card>
        <CardHeader>
          <CardTitle>Signatory Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-left">
          {/* CEM Declaration Signatory */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">CEM Declaration</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cem-name">Name of Signatory to CEM Declaration</Label>
                <SearchableProfileField
                  value={signatoryData.name_signatory_cem}
                  onSelect={(profile) => handleProfileSelect('cem', profile)}
                  placeholder="Select CEM signatory..."
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cem-title">Title of Signatory to CEM Declaration</Label>
                <Input
                  id="cem-title"
                  value={signatoryData.title_signatory_cem || ''}
                  onChange={(e) => setSignatoryData(prev => ({ ...prev, title_signatory_cem: e.target.value }))}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cem-email">Email of Signatory to CEM Declaration</Label>
                <Input
                  id="cem-email"
                  type="email"
                  value={signatoryData.email_signatory_cem || ''}
                  onChange={(e) => setSignatoryData(prev => ({ ...prev, email_signatory_cem: e.target.value }))}
                  disabled={!isEditing}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* HIB Pledge Signatory */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">HIB Pledge</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hib-name">Name of Signatory to HIB Pledge</Label>
                <SearchableProfileField
                  value={signatoryData.name_signatory_hib}
                  onSelect={(profile) => handleProfileSelect('hib', profile)}
                  placeholder="Select HIB signatory..."
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hib-title">Title of Signatory to HIB Pledge</Label>
                <Input
                  id="hib-title"
                  value={signatoryData.title_signatory_hib || ''}
                  onChange={(e) => setSignatoryData(prev => ({ ...prev, title_signatory_hib: e.target.value }))}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hib-email">Email of Signatory to HIB Pledge</Label>
                <Input
                  id="hib-email"
                  type="email"
                  value={signatoryData.email_signatory_hib || ''}
                  onChange={(e) => setSignatoryData(prev => ({ ...prev, email_signatory_hib: e.target.value }))}
                  disabled={!isEditing}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* DPE Pledge Signatory */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">DPE Pledge</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dpe-name">Name of Signatory to DPE Pledge</Label>
                <SearchableProfileField
                  value={signatoryData.name_signatory_dpe}
                  onSelect={(profile) => handleProfileSelect('dpe', profile)}
                  placeholder="Select DPE signatory..."
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dpe-title">Title of Signatory to DPE Pledge</Label>
                <Input
                  id="dpe-title"
                  value={signatoryData.title_signatory_dpe || ''}
                  onChange={(e) => setSignatoryData(prev => ({ ...prev, title_signatory_dpe: e.target.value }))}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dpe-email">Email of Signatory to DPE Pledge</Label>
                <Input
                  id="dpe-email"
                  type="email"
                  value={signatoryData.email_signatory_dpe || ''}
                  onChange={(e) => setSignatoryData(prev => ({ ...prev, email_signatory_dpe: e.target.value }))}
                  disabled={!isEditing}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Other Personnel */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Key Personnel</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dpo-name">DPO Name</Label>
                <SearchableProfileField
                  value={signatoryData.dpo_name}
                  onSelect={(profile) => handleProfileSelect('dpo', profile)}
                  placeholder="Select DPO..."
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dpo-email">DPO Email</Label>
                <Input
                  id="dpo-email"
                  type="email"
                  value={signatoryData.dpo_email || ''}
                  onChange={(e) => setSignatoryData(prev => ({ ...prev, dpo_email: e.target.value }))}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="iso-name">ISO Name</Label>
                <SearchableProfileField
                  value={signatoryData.iso_name}
                  onSelect={(profile) => handleProfileSelect('iso', profile)}
                  placeholder="Select ISO..."
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="iso-email">ISO Email</Label>
                <Input
                  id="iso-email"
                  type="email"
                  value={signatoryData.iso_email || ''}
                  onChange={(e) => setSignatoryData(prev => ({ ...prev, iso_email: e.target.value }))}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="head-it-name">Head of IT Name</Label>
                <SearchableProfileField
                  value={signatoryData.head_it_name}
                  onSelect={(profile) => handleProfileSelect('head_it', profile)}
                  placeholder="Select Head of IT..."
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="head-it-email">Head of IT Email</Label>
                <Input
                  id="head-it-email"
                  type="email"
                  value={signatoryData.head_it_email || ''}
                  onChange={(e) => setSignatoryData(prev => ({ ...prev, head_it_email: e.target.value }))}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="it-manager-name">IT Manager Name</Label>
                <SearchableProfileField
                  value={signatoryData.it_manager_name}
                  onSelect={(profile) => handleProfileSelect('it_manager', profile)}
                  placeholder="Select IT Manager..."
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="it-manager-email">IT Manager Email</Label>
                <Input
                  id="it-manager-email"
                  type="email"
                  value={signatoryData.it_manager_email || ''}
                  onChange={(e) => setSignatoryData(prev => ({ ...prev, it_manager_email: e.target.value }))}
                  disabled={!isEditing}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrganisationProfile;
