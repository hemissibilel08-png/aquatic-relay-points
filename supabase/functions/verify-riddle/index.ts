import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { riddle_id, answer, hint_used, centre_profile } = await req.json()

    // Récupérer la solution de l'énigme
    const { data: riddle, error: riddleError } = await supabaseClient
      .from('riddle')
      .select('solution, points_base, hint_malus_elem, hint_malus_mat')
      .eq('id', riddle_id)
      .single()

    if (riddleError) {
      throw new Error('Énigme non trouvée')
    }

    // Vérifier la réponse (insensible à la casse et aux espaces)
    const is_correct = answer.toLowerCase().trim() === riddle.solution.toLowerCase().trim()

    // Calculer les points
    let points = 0
    if (is_correct) {
      points = riddle.points_base
      if (hint_used) {
        const malus = centre_profile === 'maternelle' 
          ? riddle.hint_malus_mat 
          : riddle.hint_malus_elem
        points += malus // malus est négatif
      }
    }

    return new Response(
      JSON.stringify({ 
        is_correct, 
        points,
        message: is_correct ? 'Bonne réponse !' : 'Réponse incorrecte'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})