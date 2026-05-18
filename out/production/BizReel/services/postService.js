import { supabase } from '../lib/supabase'

export const getPosts = async () => {
  return await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })
}

export const createPost = async (post) => {
  return await supabase
    .from('posts')
    .insert(post)
}