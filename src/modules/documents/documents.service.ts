import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

type Document = Database['public']['Tables']['documents']['Row'];
type DocumentInsert = Database['public']['Tables']['documents']['Insert'];
type DocumentUpdate = Database['public']['Tables']['documents']['Update'];

interface DocumentFilters {
  vendor_id?: string;
  document_type?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

export async function getDocuments(
  orgId: string,
  filters: DocumentFilters = {}
) {
  const supabase = await createClient();
  const { vendor_id, document_type, search, page = 1, per_page = 20 } = filters;
  const from = (page - 1) * per_page;
  const to = from + per_page - 1;

  let query = supabase
    .from('documents')
    .select('*, vendors(id, name)', { count: 'exact' })
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false });

  if (vendor_id) {
    query = query.eq('vendor_id', vendor_id);
  }

  if (document_type) {
    query = query.eq('document_type', document_type as any);
  }

  if (search) {
    query = query.or(
      `name.ilike.%${search}%,description.ilike.%${search}%`
    );
  }

  query = query.range(from, to);

  const { data, error, count } = await query;

  return {
    data,
    error,
    count,
    page,
    per_page,
    total_pages: count ? Math.ceil(count / per_page) : 0,
  };
}

export async function getDocumentById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('documents')
    .select('*, vendors(id, name)')
    .eq('id', id)
    .single();

  return { data, error };
}

export async function createDocument(data: DocumentInsert) {
  const supabase = await createClient();

  const { data: document, error } = await supabase
    .from('documents')
    .insert(data)
    .select()
    .single();

  return { data: document, error };
}

export async function updateDocument(id: string, data: DocumentUpdate) {
  const supabase = await createClient();

  const { data: document, error } = await supabase
    .from('documents')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  return { data: document, error };
}

export async function deleteDocument(id: string) {
  const supabase = await createClient();

  // First get the document to find the storage path
  const { data: doc, error: fetchError } = await supabase
    .from('documents')
    .select('file_url')
    .eq('id', id)
    .single();

  if (fetchError) {
    return { data: null, error: fetchError };
  }

  // Delete from storage if a path exists
  if (doc?.file_url) {
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([doc.file_url]);

    if (storageError) {
      return { data: null, error: storageError };
    }
  }

  // Delete the database record
  const { error: deleteError } = await supabase
    .from('documents')
    .delete()
    .eq('id', id);

  return { data: { id }, error: deleteError };
}

export async function uploadFile(orgId: string, file: File, path: string) {
  const supabase = await createClient();

  const storagePath = `${orgId}/${path}`;

  const { data, error } = await supabase.storage
    .from('documents')
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    return { data: null, error };
  }

  return {
    data: {
      path: data.path,
      fullPath: data.fullPath,
    },
    error: null,
  };
}

export async function getFileUrl(path: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(path, 3600); // 1 hour expiry

  if (error) {
    return { data: null, error };
  }

  return { data: { signedUrl: data.signedUrl }, error: null };
}
