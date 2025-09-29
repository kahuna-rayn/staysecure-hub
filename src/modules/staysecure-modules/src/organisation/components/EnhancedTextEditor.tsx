import React, { useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { EmojiPicker } from './EmojiPicker';
import { TextSubstitution } from './TextSubstitution';

interface EnhancedTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  rows?: number;
}

export const EnhancedTextEditor = ({ 
  value, 
  onChange, 
  placeholder, 
  label, 
  rows = 4 
}: EnhancedTextEditorProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertAtCursor = (textToInsert: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = value.substring(0, start) + textToInsert + value.substring(end);
    
    onChange(newValue);

    // Set cursor position after insertion
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + textToInsert.length, start + textToInsert.length);
    }, 0);
  };

  const handleEmojiSelect = (emoji: string) => {
    insertAtCursor(emoji);
  };

  const handleVariableInsert = (variable: string) => {
    insertAtCursor(variable);
  };

  return (
    <div className="space-y-2">
      {label && <Label htmlFor="enhanced-editor">{label}</Label>}
      
      <div className="space-y-2">
        <div className="flex gap-2">
          <EmojiPicker onEmojiSelect={handleEmojiSelect} />
          <TextSubstitution onVariableInsert={handleVariableInsert} />
        </div>
        
        <Textarea
          id="enhanced-editor"
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="resize-none"
        />
      </div>
      
      <div className="text-xs text-muted-foreground">
        Use the buttons above to insert emojis and dynamic variables into your content.
      </div>
    </div>
  );
};