
import React from "react";
import { Award, Calendar, Building, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Profile } from '@/hooks/useProfile';

interface Certificate {
  name: string;
  issuedBy: string;
  dateAcquired: string;
  expiryDate: string | null;
  credentialId?: string;
}

interface EditableCertificatesProps {
  profile: Profile & {
    certificates: Certificate[];
  };
  onUpdate?: (certificateId: string, updates: any) => void;
  onDataChange?: () => void;
}

const EditableCertificates: React.FC<EditableCertificatesProps> = ({ profile }) => {
  const { certificates } = profile;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No expiry";
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Valid': return 'bg-green-500';
      case 'Expired': return 'bg-red-500';
      case 'Pending': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  const getTypeIcon = (type?: string) => {
    return type === 'Document' ? <FileText className="h-5 w-5 text-primary flex-shrink-0" /> : <Award className="h-5 w-5 text-primary flex-shrink-0" />;
  };

  const getTypeColor = (type?: string) => {
    return type === 'Document' ? 'bg-blue-500' : 'bg-purple-500';
  };

  // Determine validity based on expiry date
  const getValidityStatus = (expiryDate: string | null) => {
    if (!expiryDate) return 'Valid'; // No expiry means always valid
    
    const expiry = new Date(expiryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to compare dates only
    
    if (expiry < today) {
      return 'Expired';
    } else if (expiry <= new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)) {
      // Expires within 30 days
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

  // Filter certificates to only show those where org_cert is false
  const filteredCertificates = certificates.filter(cert => 
    (cert as any).org_cert === false
  );

  return (
    <div className="space-y-4 animate-fade-in">
      {filteredCertificates.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No certificates yet</p>
      ) : (
        <div className="space-y-4">
          {filteredCertificates.map((cert, index) => {
            const validityStatus = getValidityStatus(cert.expiryDate);
            
            return (
              <div key={index} className="border rounded-lg p-4">
                {/* Top line with name and type badge */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {getTypeIcon((cert as any).type)}
                    <h3 className="font-semibold text-lg truncate">{cert.name}</h3>
                  </div>
                  
                  <div className="flex items-center flex-shrink-0">
                    <Badge className={`${getTypeColor((cert as any).type)} text-white text-sm px-2 py-1`}>
                      {(cert as any).type || 'Certificate'}
                    </Badge>
                  </div>
                </div>
                
                {/* Bottom section with aligned information */}
                <div className="grid grid-cols-4 gap-4 text-sm ml-8">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-foreground">{cert.issuedBy}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Issued:</span>
                    <span className="font-medium">{formatDate(cert.dateAcquired)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Expires:</span>
                    <span className="font-medium">{formatDate(cert.expiryDate)}</span>
                  </div>
                  
                  <div className="flex items-center justify-end">
                    <Badge className={`${getValidityStatusColor(validityStatus)} text-white`}>
                      {validityStatus}
                    </Badge>
                  </div>
                </div>
                
                {/* ID information on separate line if present */}
                {cert.credentialId && (
                  <div className="text-sm ml-8 mt-2">
                    <span className="text-muted-foreground">ID: </span>
                    <span className="font-medium">{cert.credentialId}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EditableCertificates;
