import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { MessageCircle, HelpCircle, Image, Video, FileImage, ArrowDown, BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface FlowchartNodeProps {
  data: {
    id: string;
    type: 'prompt' | 'question' | 'lesson';
    content: string;
    media_type?: string;
    media_url?: string;
    media_alt?: string;
    embedded_lesson_id?: string;
    nodeNumber?: number;
    isSelected: boolean;
    onClick: () => void;
  };
}

export const FlowchartNode = ({ data }: FlowchartNodeProps) => {
  const { type, content, media_type, media_url, embedded_lesson_id, nodeNumber, isSelected, onClick } = data;

  const getMediaIcon = () => {
    switch (media_type) {
      case 'video':
        return <Video className="w-3 h-3" />;
      case 'image':
        return <Image className="w-3 h-3" />;
      case 'gif':
        return <FileImage className="w-3 h-3" />;
      default:
        return null;
    }
  };

  return (
    <div
      className={`min-w-[200px] max-w-[300px] p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer relative ${
        type === 'question'
          ? 'bg-yellow-50 border-yellow-300 hover:border-yellow-400'
          : type === 'lesson'
          ? 'bg-green-50 border-green-300 hover:border-green-400'
          : 'bg-blue-50 border-blue-300 hover:border-blue-400'
      } ${isSelected ? 'ring-2 ring-learning-accent ring-offset-2' : ''}`}
      onClick={onClick}
    >
      {/* Node Number Badge */}
      {nodeNumber && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-gray-800 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm">
          {nodeNumber}
        </div>
      )}
      
      <Handle 
        type="target" 
        position={Position.Top} 
        id="target"
        className="w-3 h-3 !bg-gray-400 !border-gray-600 hover:!bg-gray-600" 
      />
      
      <div className="flex items-center gap-2 mb-2">
        {type === 'prompt' ? (
          <MessageCircle className="w-4 h-4 text-blue-600" />
        ) : type === 'lesson' ? (
          <BookOpen className="w-4 h-4 text-green-600" />
        ) : (
          <HelpCircle className="w-4 h-4 text-yellow-600" />
        )}
        <Badge variant={type === 'prompt' ? 'default' : type === 'lesson' ? 'outline' : 'secondary'} className="text-xs">
          {type === 'lesson' ? 'module' : type}
        </Badge>
        {media_url && (
          <div className="flex items-center gap-1 text-purple-600">
            {getMediaIcon()}
          </div>
        )}
      </div>
      
      <div className="text-sm font-medium mb-2 line-clamp-3">
        {content || 'Empty node'}
      </div>
      
      {type === 'lesson' && embedded_lesson_id && (
        <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded mt-2">
          Embedded lesson configured
        </div>
      )}

      {media_url && (
        <div className="mt-2 rounded overflow-hidden">
          {media_type === 'video' || media_url.includes('youtube.com') || media_url.includes('youtu.be') ? (
            <div className="w-full h-20 bg-gray-100 flex items-center justify-center text-xs text-gray-600">
              Video: {media_url.includes('youtube.com') || media_url.includes('youtu.be') ? 'YouTube' : 'Video'}
            </div>
          ) : (
            <img 
              className="w-full h-20 object-cover"
              src={media_url}
              alt={data.media_alt || 'Node media'}
              onError={(e) => {
                console.error('Image failed to load:', media_url);
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
        </div>
      )}
      
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="source"
        className="w-3 h-3 !bg-gray-400 !border-gray-600 hover:!bg-gray-600" 
      />
    </div>
  );
};