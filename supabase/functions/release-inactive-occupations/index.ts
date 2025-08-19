import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Starting inactive occupations release process');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Calculate cutoff time (20 minutes ago)
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - 20);
    const cutoffISO = cutoffTime.toISOString();

    console.log(`📅 Releasing occupations older than: ${cutoffISO}`);

    // Find stations occupied for more than 20 minutes
    const { data: staleOccupations, error: findError } = await supabase
      .from('occupation')
      .select(`
        id,
        station_id,
        status,
        by_centre_id,
        since,
        station!inner (
          name,
          activity (
            requires_facilitator
          )
        )
      `)
      .eq('status', 'occupee')
      .lt('since', cutoffISO);

    if (findError) {
      console.error('❌ Error finding stale occupations:', findError);
      throw findError;
    }

    console.log(`🔍 Found ${staleOccupations?.length || 0} stale occupations`);

    if (!staleOccupations || staleOccupations.length === 0) {
      console.log('✅ No stale occupations found');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No stale occupations found',
          released: 0 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const results = [];
    
    for (const occupation of staleOccupations) {
      const isSupervised = occupation.station.activity?.requires_facilitator;
      
      // Check if supervised station has active facilitator
      let newStatus = 'libre';
      
      if (isSupervised) {
        const { data: activeFacilitator } = await supabase
          .from('presence')
          .select('id')
          .eq('station_id', occupation.station_id)
          .is('ended_at', null)
          .limit(1);
        
        if (!activeFacilitator || activeFacilitator.length === 0) {
          newStatus = 'fermee'; // Supervised without facilitator = closed
        }
      }

      // Update occupation status
      const { error: updateError } = await supabase
        .from('occupation')
        .update({
          status: newStatus,
          by_centre_id: null,
          since: new Date().toISOString()
        })
        .eq('id', occupation.id);

      if (updateError) {
        console.error(`❌ Error updating occupation ${occupation.id}:`, updateError);
        results.push({
          station: occupation.station.name,
          success: false,
          error: updateError.message
        });
      } else {
        console.log(`✅ Released station "${occupation.station.name}" -> ${newStatus}`);
        results.push({
          station: occupation.station.name,
          success: true,
          previousStatus: 'occupee',
          newStatus: newStatus,
          wasInactiveFor: `${Math.round((Date.now() - new Date(occupation.since).getTime()) / (1000 * 60))} minutes`
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`🎯 Successfully released ${successCount}/${results.length} stations`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Released ${successCount} inactive occupations`,
        released: successCount,
        details: results
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('💥 Function error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});