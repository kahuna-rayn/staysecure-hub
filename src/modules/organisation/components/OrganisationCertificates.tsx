import React, { useState, useEffect } from "react";
import { Award, Calendar, Building, FileText, User, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import AddOrganisationCertificateDialog from "./admin/AddOrganisationCertificateDialog";

interface OrgCertificate {
  id: string;
  type?: string;
  name: string;
  issued_by: string;
  date_acquired: string;
  expiry_date: string | null;
  credential_id: string | null;
  status: string;
  org_cert?: boolean;
  user_id: string;
  created_at: string;
  created_by?: string;
}

interface UserProfile {
  id: string;
  full_name: string;
  username: string;
}

const OrganisationCertificates: React.FC = () => {
  const [certificates, setCertificates] = useState<OrgCertificate[]>([]);
  const [userProfiles, setUserProfiles] = useState<{ [key: string]: UserProfile }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No expiry";
    return new Date(dateString).toLocaleDateString();
  };

  const getTypeIcon = (type?: string) => {
    return type === 'Document' ? <FileText className="h-5 w-5 text-primary flex-shrink-0" /> : <Award className="h-5 w-5 text-primary flex-shrink-0" />;
  };

  const getTypeColor = (type?: string) => {
    return type === 'Document' ? 'bg-blue-500' : 'bg-purple-500';
  };

  const getValidityStatus = (expiryDate: string | null) => {
    if (!expiryDate) return 'Valid';
    
    const expiry = new Date(expiryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (expiry < today) {
      return 'Expired';
    } else if (expiry <= new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)) {
      return 'Expiring Soon';
    } else {
      return 'Valid';
    }
  };

  const getValidityStatusColor = (status: string) => {
    switch (status) {
      case 'Valid': return 'bg-green-500';
      case 'Expired': return 'bg-red-500';
      case 'Expiring Soon': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  const getUserDisplayName = (userId: string) => {
    const profile = userProfiles[userId];
    return profile?.full_name || profile?.username || 'Unknown User';
  };

  const fetchOrganisationCertificates = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch certificates where org_cert is TRUE
      const { data: certificatesData, error: certificatesError } = await supabase
        .from('certificates')
        .select('*')
        .eq('org_cert', true)
        .order('created_at', { ascending: false });

      if (certificatesError) throw certificatesError;

      // Get unique user IDs to fetch profile information
      const userIds = [...new Set(certificatesData?.map(cert => cert.user_id) || [])];
      
      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, username')
          .in('id', userIds);

        if (profilesError) throw profilesError;

        // Create a map of user profiles
        const profilesMap = (profilesData || []).reduce((acc, profile) => {
          acc[profile.id] = profile;
          return acc;
        }, {} as { [key: string]: UserProfile });

        setUserProfiles(profilesMap);
      }

      setCertificates(certificatesData || []);
    } catch (error: any) {
      setError(error.message);
      console.error('Error fetching organisation certificates:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganisationCertificates();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Organisation Certificates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Organisation Certificates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Error loading certificates: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Organisation Certificates
          </CardTitle>
          <Button onClick={() => setIsAddDialogOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Certificate
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {certificates.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No organisation certificates found</p>
          ) : (
            certificates.map((cert) => {
              const validityStatus = getValidityStatus(cert.expiry_date);
              
              return (
                <div key={cert.id} className="border rounded-lg p-4">
                  {/* Top line with name and type badge */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {getTypeIcon(cert.type)}
                      <h3 className="font-semibold text-lg truncate">{cert.name}</h3>
                    </div>
                    
                    <div className="flex items-center flex-shrink-0">
                      <Badge className={`${getTypeColor(cert.type)} text-white text-sm px-2 py-1`}>
                        {cert.type || 'Certificate'}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Main information row - Issuer, ID, Issued, Expires */}
                  <div className="grid grid-cols-4 gap-4 text-sm ml-8">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Issuer:</span>
                      <span className="font-medium text-foreground">{cert.issued_by}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">ID:</span>
                      <span className="font-medium">{cert.credential_id || 'N/A'}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Issued:</span>
                      <span className="font-medium">{formatDate(cert.date_acquired)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Expires:</span>
                      <span className="font-medium">{formatDate(cert.expiry_date)}</span>
                    </div>
                  </div>
                  
                  {/* Second row with Added by and Status */}
                  <div className="flex items-center justify-between ml-8 mt-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Added by:</span>
                      <span className="font-medium">{getUserDisplayName(cert.user_id)}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <Badge className={`${getValidityStatusColor(validityStatus)} text-white`}>
                        {validityStatus}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        <AddOrganisationCertificateDialog
          isOpen={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onSuccess={() => {
            fetchOrganisationCertificates();
          }}
        />
      </CardContent>
    </Card>
  );
};

export default OrganisationCertificates;