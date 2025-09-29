import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { lessonId, languageCode } = await req.json();

    if (!lessonId) {
      throw new Error('Missing required parameter: lessonId');
    }

    // Check if lesson translation exists
    const { data: lessonTranslation, error: lessonError } = await supabaseClient
      .from('lesson_translations')
      .select('*')
      .eq('lesson_id', lessonId)
      .eq('language_code', languageCode || 'en')
      .single();

    // Get total number of nodes
    const { count: totalNodes, error: totalNodesError } = await supabaseClient
      .from('lesson_nodes')
      .select('*', { count: 'exact', head: true })
      .eq('lesson_id', lessonId);

    if (totalNodesError) {
      console.error('Error counting nodes:', totalNodesError);
      throw new Error('Failed to count lesson nodes');
    }

    // Get number of translated nodes
    const { count: translatedNodes, error: translatedError } = await supabaseClient
      .from('lesson_node_translations')
      .select('node_id', { count: 'exact', head: true })
      .eq('language_code', languageCode || 'en')
      .in('node_id', await supabaseClient
        .from('lesson_nodes')
        .select('id')
        .eq('lesson_id', lessonId)
        .then(({ data }) => data?.map(n => n.id) || [])
      );

    if (translatedError) {
      console.error('Error counting translated nodes:', translatedError);
      throw new Error('Failed to count translated nodes');
    }

    const nodeProgress = totalNodes && totalNodes > 0 ? (translatedNodes || 0) / totalNodes : 0;
    const lessonTranslated = !!lessonTranslation && !lessonError;
    const overallProgress = lessonTranslated ? (nodeProgress * 0.8 + 0.2) : (nodeProgress * 0.8);
    const isComplete = lessonTranslated && nodeProgress === 1;

    return new Response(JSON.stringify({
      success: true,
      lessonTranslated,
      totalNodes: totalNodes || 0,
      translatedNodes: translatedNodes || 0,
      nodeProgress: Math.round(nodeProgress * 100) / 100,
      overallProgress: Math.round(overallProgress * 100) / 100,
      isComplete
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Translation status error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});