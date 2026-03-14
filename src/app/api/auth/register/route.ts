import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { user_id, email, first_name, last_name, organization_name } = body

    if (!user_id || !email || !first_name || !last_name || !organization_name) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id, email, first_name, last_name, organization_name' },
        { status: 400 }
      )
    }

    // Use admin client to bypass RLS for registration
    const supabase = createAdminClient()

    // Generate a URL-friendly slug from the organization name
    const slug = organization_name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    // Create the organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: organization_name,
        slug,
      })
      .select()
      .single()

    if (orgError) {
      // Handle duplicate slug by appending a random suffix
      if (orgError.code === '23505') {
        const uniqueSlug = `${slug}-${Date.now().toString(36)}`
        const { data: retryOrg, error: retryError } = await supabase
          .from('organizations')
          .insert({
            name: organization_name,
            slug: uniqueSlug,
          })
          .select()
          .single()

        if (retryError) {
          console.error('Failed to create organization (retry):', retryError)
          return NextResponse.json(
            { error: 'Failed to create organization' },
            { status: 500 }
          )
        }

        // Create user profile with the retried org
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: user_id,
            organization_id: retryOrg.id,
            role: 'owner',
            first_name,
            last_name,
            email,
          })
          .select()
          .single()

        if (profileError) {
          console.error('Failed to create user profile:', profileError)
          // Clean up the created organization
          await supabase.from('organizations').delete().eq('id', retryOrg.id)
          return NextResponse.json(
            { error: 'Failed to create user profile' },
            { status: 500 }
          )
        }

        return NextResponse.json({ organization: retryOrg, profile })
      }

      console.error('Failed to create organization:', orgError)
      return NextResponse.json(
        { error: 'Failed to create organization' },
        { status: 500 }
      )
    }

    // Create the user profile linked to the new organization
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: user_id,
        organization_id: org.id,
        role: 'owner',
        first_name,
        last_name,
        email,
      })
      .select()
      .single()

    if (profileError) {
      console.error('Failed to create user profile:', profileError)
      // Clean up the created organization
      await supabase.from('organizations').delete().eq('id', org.id)
      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({ organization: org, profile })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred during registration' },
      { status: 500 }
    )
  }
}
