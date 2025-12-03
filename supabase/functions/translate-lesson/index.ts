import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Variable preservation utilities
const VARIABLE_REGEX = /\{\{[^}]+\}\}/g;
const PLACEHOLDER_PREFIX = "LOVABLE_VAR_";

interface VariableMap {
  [placeholder: string]: string;
}

function extractAndReplaceVariables(text: string): { processedText: string; variableMap: VariableMap } {
  const variableMap: VariableMap = {};
  let counter = 0;
  
  const processedText = text.replace(VARIABLE_REGEX, (match) => {
    const placeholder = `${PLACEHOLDER_PREFIX}${counter}`;
    variableMap[placeholder] = match;
    counter++;
    return placeholder;
  });
  
  return { processedText, variableMap };
}

function restoreVariables(translatedText: string, variableMap: VariableMap): string {
  let restoredText = translatedText;
  
  Object.entries(variableMap).forEach(([placeholder, originalVariable]) => {
    restoredText = restoredText.replace(new RegExp(placeholder, 'g'), originalVariable);
  });
  
  return restoredText;
}

async function translateWithGoogle(text: string, targetLanguage: string): Promise<string> {
  const apiKey = Deno.env.get('GOOGLE_TRANSLATE_API_KEY');
  if (!apiKey) {
    throw new Error('Google Translate API key not configured');
  }

  const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      q: text,
      target: targetLanguage,
      format: 'text'
    }),
  });

  if (!response.ok) {
    throw new Error(`Google Translate API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data.translations[0].translatedText;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { lessonId, targetLanguage, translateNodes = true } = await req.json();

    console.log('=== TRANSLATION FUNCTION START ===');
    console.log('Request:', { lessonId, targetLanguage, translateNodes });

    if (!lessonId || !targetLanguage) {
      throw new Error('Missing required parameters: lessonId and targetLanguage');
    }

    // Get lesson data
    const { data: lesson, error: lessonError } = await supabaseClient
      .from('lessons')
      .select('*')
      .eq('id', lessonId)
      .single();

    if (lessonError || !lesson) {
      console.error('Error fetching lesson:', lessonError);
      throw new Error('Lesson not found');
    }

    console.log(`📚 Found lesson: ${lesson.title}`);

    // Translate lesson title and description
    const titleVariables = extractAndReplaceVariables(lesson.title || '');
    const descVariables = extractAndReplaceVariables(lesson.description || '');

    let translatedTitle = lesson.title;
    let translatedDescription = lesson.description;

    if (titleVariables.processedText && titleVariables.processedText !== lesson.title) {
      const titleTranslation = await translateWithGoogle(titleVariables.processedText, targetLanguage);
      translatedTitle = restoreVariables(titleTranslation, titleVariables.variableMap);
    } else if (lesson.title) {
      translatedTitle = await translateWithGoogle(lesson.title, targetLanguage);
    }

    if (descVariables.processedText && descVariables.processedText !== lesson.description) {
      const descTranslation = await translateWithGoogle(descVariables.processedText, targetLanguage);
      translatedDescription = restoreVariables(descTranslation, descVariables.variableMap);
    } else if (lesson.description) {
      translatedDescription = await translateWithGoogle(lesson.description, targetLanguage);
    }

    // Store lesson translation
    const { error: lessonTransError } = await supabaseClient
      .from('lesson_translations')
      .upsert({
        lesson_id: lessonId,
        language_code: targetLanguage,
        title_translated: translatedTitle,
        description_translated: translatedDescription,
        engine_used: 'google',
        status: 'completed',
        character_count: (lesson.title?.length || 0) + (lesson.description?.length || 0),
        translation_cost: 0.0001 * ((lesson.title?.length || 0) + (lesson.description?.length || 0)),
        is_outdated: false
      });

    if (lessonTransError) {
      console.error('Error storing lesson translation:', lessonTransError);
    }

    let translatedNodeCount = 0;
    let translatedAnswerCount = 0;

    if (translateNodes) {
      // Get lesson nodes
      const { data: nodes, error: nodesError } = await supabaseClient
        .from('lesson_nodes')
        .select('*')
        .eq('lesson_id', lessonId);

      if (nodesError) {
        console.error('Error fetching nodes:', nodesError);
        throw new Error('Failed to fetch lesson nodes');
      }

      console.log(`🔄 Translating ${nodes.length} nodes...`);

      // Translate each node
      for (const node of nodes) {
        if (!node.content) continue;

        console.log(`📝 Translating node ${node.id}: "${node.content}"`);

        // Extract variables before translation
        const { processedText, variableMap } = extractAndReplaceVariables(node.content);
        
        console.log(`🔍 Variables found:`, Object.values(variableMap));
        console.log(`📝 Text to translate: "${processedText}"`);

        // Translate the processed text
        const translatedContent = await translateWithGoogle(processedText, targetLanguage);
        
        console.log(`🌐 Google translation: "${translatedContent}"`);

        // Restore variables in the translated text
        const finalTranslation = restoreVariables(translatedContent, variableMap);
        
        console.log(`✅ Final translation: "${finalTranslation}"`);

        // Store node translation with content hash for tracking changes
        const contentHash = await crypto.subtle.digest(
          'SHA-256',
          new TextEncoder().encode(node.content)
        );
        const hashHex = Array.from(new Uint8Array(contentHash))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');

        const { error: nodeTransError } = await supabaseClient
          .from('lesson_node_translations')
          .upsert({
            node_id: node.id,
            language_code: targetLanguage,
            content_translated: finalTranslation,
            media_alt_translated: node.media_alt ? await translateWithGoogle(node.media_alt, targetLanguage) : null,
            engine_used: 'google',
            status: 'completed',
            character_count: node.content.length,
            translation_cost: 0.0001 * node.content.length,
            content_hash: hashHex,
            is_outdated: false
          }, {
            onConflict: 'node_id,language_code'
          });

        if (nodeTransError) {
          console.error('Error storing node translation:', nodeTransError);
          // Still count as translated if it's just a duplicate key error (translation already exists)
          if (nodeTransError.code === '23505') {
            console.log('Translation already exists, counting as successful');
            translatedNodeCount++;
          }
        } else {
          translatedNodeCount++;
        }
      }

      // Now translate lesson answers
      console.log('🔄 Fetching and translating lesson answers...');
      
      // Get all answers for this lesson's nodes
      const nodeIds = nodes.map(node => node.id);
      const { data: answers, error: answersError } = await supabaseClient
        .from('lesson_answers')
        .select('*')
        .in('node_id', nodeIds);

      if (answersError) {
        console.error('Error fetching answers:', answersError);
      } else if (answers && answers.length > 0) {
        console.log(`🔄 Translating ${answers.length} answers...`);

        for (const answer of answers) {
          if (!answer.text) continue;

          console.log(`📝 Translating answer ${answer.id}: "${answer.text}"`);

          // Extract variables before translation
          const { processedText, variableMap } = extractAndReplaceVariables(answer.text);
          
          // Translate the processed text
          const translatedText = await translateWithGoogle(processedText, targetLanguage);
          
          // Restore variables in the translated text
          const finalTranslatedText = restoreVariables(translatedText, variableMap);
          
          console.log(`✅ Final answer translation: "${finalTranslatedText}"`);

          // Translate explanation if it exists
          let translatedExplanation = null;
          if (answer.explanation) {
            const explanationVars = extractAndReplaceVariables(answer.explanation);
            const translatedExp = await translateWithGoogle(explanationVars.processedText, targetLanguage);
            translatedExplanation = restoreVariables(translatedExp, explanationVars.variableMap);
          }

          // Create content hash for the answer
          const answerContentHash = await crypto.subtle.digest(
            'SHA-256',
            new TextEncoder().encode(answer.text + (answer.explanation || ''))
          );
          const answerHashHex = Array.from(new Uint8Array(answerContentHash))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');

          // Store answer translation
          const { error: answerTransError } = await supabaseClient
            .from('lesson_answer_translations')
            .upsert({
              answer_id: answer.id,
              language_code: targetLanguage,
              text_translated: finalTranslatedText,
              explanation_translated: translatedExplanation,
              engine_used: 'google',
              status: 'completed',
              character_count: answer.text.length + (answer.explanation?.length || 0),
              translation_cost: 0.0001 * (answer.text.length + (answer.explanation?.length || 0)),
              content_hash: answerHashHex,
              is_outdated: false
            }, {
              onConflict: 'answer_id,language_code'
            });

          if (answerTransError) {
            console.error('Error storing answer translation:', answerTransError);
            // Still count as translated if it's just a duplicate key error
            if (answerTransError.code === '23505') {
              console.log('Answer translation already exists, counting as successful');
              translatedAnswerCount++;
            }
          } else {
            translatedAnswerCount++;
          }
        }
      }
    }

    console.log(`✅ Translation complete: ${translatedNodeCount} nodes and ${translatedAnswerCount} answers translated`);
    console.log('=== TRANSLATION FUNCTION END ===');

    return new Response(JSON.stringify({
      success: true,
      message: `Successfully translated lesson to ${targetLanguage}. ${translatedNodeCount} nodes and ${translatedAnswerCount} answers translated.`,
      translation: {
        lessonId,
        targetLanguage,
        translatedTitle,
        translatedDescription,
        nodesTranslated: translatedNodeCount,
        answersTranslated: translatedAnswerCount
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Translation error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});