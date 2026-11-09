// The only file that knows about Supabase. Everything else uses this contract.
import { config } from '../../config/app.js';

export function createSupabaseBackend() {
  const db = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true },
  });
  const must = ({ data, error }) => { if (error) throw error; return data; };
  let presence = null;

  return {
    async getUser() { return (await db.auth.getSession()).data.session?.user ?? null; },
    signIn: () => db.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: location.origin + location.pathname, queryParams: { prompt: 'select_account' } },
    }),
    async signOut() { if (presence) await db.removeChannel(presence); await db.auth.signOut(); },

    async bootstrap() {
      const result = await db.rpc('ensure_profile');
      if (result.error?.message?.includes('not_allowed')) return null;
      return must(result);
    },
    listPeople: async () => must(await db.from('profiles').select('id,email,name,avatar_url').order('name')),
    listConversations: async () => must(await db.rpc('my_conversations')),
    openDirect: async (other) => must(await db.rpc('open_direct', { other })),
    markRead: async (conv) => must(await db.rpc('mark_read', { conv })),

    async listMessages(conversationId, before) {
      let query = db.from('messages').select('*').eq('conversation_id', conversationId)
        .order('created_at', { ascending: false }).limit(config.pageSize);
      if (before) query = query.lt('created_at', before);
      return must(await query).reverse();
    },
    sendMessage: async (message) => must(await db.from('messages').insert(message).select().single()),

    async uploadAttachment(conversationId, file) {
      const safe = file.name.split('.').pop().replace(/[^\w]/g, '').slice(0, 8);
      const path = `${conversationId}/${crypto.randomUUID()}.${safe || 'bin'}`;
      must(await db.storage.from('attachments').upload(path, file, { contentType: file.type || undefined }));
      return path;
    },
    async attachmentUrl(path, downloadName) {
      const options = downloadName ? { download: downloadName } : undefined;
      return must(await db.storage.from('attachments').createSignedUrl(path, 3600, options)).signedUrl;
    },

    subscribeMessages(callback) {
      const channel = db.channel('family-messages')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' },
          (change) => callback(change.new))
        .subscribe();
      return () => db.removeChannel(channel);
    },
    joinPresence(userId, callback) {
      presence = db.channel('family-online', { config: { presence: { key: userId } } });
      presence.on('presence', { event: 'sync' }, () => callback(new Set(Object.keys(presence.presenceState()))));
      presence.subscribe((status) => { if (status === 'SUBSCRIBED') presence.track({ at: Date.now() }); });
    },

    updateName: async (id, name) => must(await db.from('profiles').update({ name }).eq('id', id)),
    listAllowed: async () => must(await db.from('allowed_emails').select('*').order('added_at')),
    addAllowed: async (email, displayName) =>
      must(await db.from('allowed_emails').insert({ email: email.toLowerCase(), display_name: displayName || null })),
    setBlocked: async (email, blocked) => must(await db.from('allowed_emails').update({ blocked }).eq('email', email)),
    removeAllowed: async (email) => must(await db.from('allowed_emails').delete().eq('email', email)),
  };
}
