
import React from "react";
import { PersonProfile } from "./PersonaProfile";
import { Award, Calendar, Building, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CertificatesProps {
  profile: PersonProfile;
}

const Certificates: React.FC<CertificatesProps> = ({ profile }) => {
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
          {filteredCertificates.map((cert, index) => (
            <div key={index} className="border rounded-lg p-4">
              {/* Top line with name, issuer, ID, type */}
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {getTypeIcon((cert as any).type)}
                  <h3 className="font-semibold text-lg truncate">{cert.name}</h3>
                </div>
                
                {/* Right-aligned issuer, ID, type section */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="text-base font-medium text-foreground">{cert.issuedBy}</span>
                  </div>
                  {cert.credentialId && (
                    <span className="text-base font-medium text-muted-foreground">
                      ID: {cert.credentialId}
                    </span>
                  )}
                  <Badge className={`${getTypeColor((cert as any).type)} text-white text-sm px-2 py-1 flex-shrink-0`}>
                    {(cert as any).type || 'Certificate'}
                  </Badge>
                </div>
              </div>
              
              {/* Bottom line with dates and status */}
              <div className="grid grid-cols-3 gap-4 text-sm ml-8">
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
                  <Badge className={`${getStatusColor(cert.status)} text-white`}>{cert.status}</Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Certificates;
