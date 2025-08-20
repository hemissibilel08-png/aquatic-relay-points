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

    console.log('🔄 Checking for inactive occupations...')

    // Définir le seuil d'inactivité à 20 minutes
    const cutoffTime = new Date(Date.now() - 20 * 60 * 1000).toISOString()

    // Récupérer les occupations inactives depuis plus de 20 minutes
    const { data: staleOccupations, error: fetchError } = await supabaseClient
      .from('occupation')
      .select(`
        id,
        station_id,
        by_centre_id,
        since,
        station!inner (
          id,
          name,
          activity!inner (
            requires_facilitator
          )
        )
      `)
      .eq('status', 'occupee')
      .lt('since', cutoffTime)

    if (fetchError) {
      throw new Error(`Erreur lors de la récupération des occupations: ${fetchError.message}`)
    }

    let releasedCount = 0
    let closedCount = 0

    if (staleOccupations && staleOccupations.length > 0) {
      console.log(`📋 Trouvé ${staleOccupations.length} occupation(s) inactive(s)`)

      for (const occupation of staleOccupations) {
        const station = occupation.station
        const needsFacilitator = station.activity?.requires_facilitator

        let newStatus = 'libre'

        // Si l'activité nécessite un facilitateur, vérifier s'il y en a un présent
        if (needsFacilitator) {
          const { data: activeFacilitators, error: facilitatorError } = await supabaseClient
            .from('presence')
            .select(`
              id,
              staff!inner (
                id,
                role,
                is_active
              )
            `)
            .eq('station_id', station.id)
            .is('ended_at', null)
            .eq('staff.role', 'facilitateur')
            .eq('staff.is_active', true)

          if (facilitatorError) {
            console.error(`❌ Erreur vérification facilitateur pour station ${station.name}:`, facilitatorError)
            continue
          }

          // Si pas de facilitateur présent, fermer la station
          if (!activeFacilitators || activeFacilitators.length === 0) {
            newStatus = 'fermee'
            closedCount++
          } else {
            releasedCount++
          }
        } else {
          releasedCount++
        }

        // Mettre à jour le statut de l'occupation
        const { error: updateError } = await supabaseClient
          .from('occupation')
          .update({
            status: newStatus,
            by_centre_id: null,
            since: new Date().toISOString()
          })
          .eq('id', occupation.id)

        if (updateError) {
          console.error(`❌ Erreur lors de la mise à jour de l'occupation ${occupation.id}:`, updateError)
        } else {
          console.log(`✅ Station "${station.name}" → ${newStatus === 'libre' ? 'libérée' : 'fermée'}`)
        }
      }
    }

    console.log(`🎯 Auto-release terminé: ${releasedCount} libérées, ${closedCount} fermées`)

    return new Response(
      JSON.stringify({ 
        success: true,
        processed: staleOccupations?.length || 0,
        released: releasedCount,
        closed: closedCount,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('💥 Erreur dans release-inactive-occupations:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})