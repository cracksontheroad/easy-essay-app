/* ========================================================================
 * EASY ESSAY — Supabase auth + sync layer
 *
 * Anonymous users still get the full app via localStorage.
 * Signed-in users get cross-device persistence in essay_app.* tables.
 *
 * - Settings live in: essay_app.user_settings.settings (JSONB)
 * - Essays    live in: essay_app.essays.data           (JSONB)
 * - Activity  lives in: essay_app.activity_log
 *
 * RLS ensures users only ever see their own rows.
 * The Supabase SDK loads via CDN in index.html and exposes window.supabase.
 *
 * Public surface (window.Sb):
 *   init()              — call once on page load
 *   isSignedIn()        — boolean
 *   currentUser()       — User object or null
 *   signInWithMagicLink(email)
 *   signInWithGoogle()
 *   signOut()
 *   pullAll()           — returns { settings, essays } from server
 *   pushSettings(obj)
 *   pushEssay(essay)
 *   deleteEssay(id)
 *   migrateLocal(settings, essays)  — upload local data on first login
 *
 * Events dispatched on window:
 *   supabase:ready          — once init completes (signed-in OR not)
 *   supabase:auth-change    — { user } when sign-in/out happens
 *   supabase:sync-success   — after a successful write
 *   supabase:sync-error     — { error } when a write fails
 * ====================================================================== */

const SUPABASE_URL      = "https://qilppvnwilcxworlrdjh.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_gkC1J2VNAgucyBFin5-6aw_O1Rzs4Qy";

const Sb = {
  client: null,
  user:   null,
  ready:  false,

  /* Detect Wix-iframe scenario — auth flow won't survive third-party
   * storage blocking. We surface a "Open in own tab" banner instead of
   * letting users hit a frustrating dead-end. */
  inIframe() {
    try { return window.self !== window.top; } catch { return true; }
  },

  init() {
    if (!window.supabase || !window.supabase.createClient) {
      console.warn("[Sb] Supabase SDK not loaded — auth disabled, localStorage-only.");
      this.ready = true;
      window.dispatchEvent(new CustomEvent("supabase:ready", { detail: { available: false } }));
      return;
    }

    this.client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,           // for OAuth + magic-link callbacks
        storage: window.localStorage,
        storageKey: "easy-essay/sb-session"
      },
      db: { schema: "essay_app" },
      global: {
        headers: { "X-Easy-Essay-Client": "browser/v2.8" }
      }
    });

    // React to sign-in / sign-out
    this.client.auth.onAuthStateChange((event, session) => {
      this.user = session?.user || null;
      window.dispatchEvent(new CustomEvent("supabase:auth-change", {
        detail: { user: this.user, event }
      }));
    });

    // Probe existing session
    this.client.auth.getSession().then(({ data }) => {
      this.user = data?.session?.user || null;
      this.ready = true;
      window.dispatchEvent(new CustomEvent("supabase:ready", {
        detail: { available: true, user: this.user }
      }));
    }).catch((err) => {
      console.warn("[Sb] getSession failed:", err);
      this.ready = true;
      window.dispatchEvent(new CustomEvent("supabase:ready", { detail: { available: true, user: null } }));
    });
  },

  isSignedIn() { return !!this.user; },
  currentUser() { return this.user; },

  // ─── Auth flows ─────────────────────────────────────────────────────

  /* Magic-link email sign-in. Sends a one-time email; user clicks the
   * link, browser redirects back here with the session active. */
  async signInWithMagicLink(email) {
    if (!this.client) throw new Error("Auth unavailable — SDK didn't load.");
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Please enter a valid email address.");
    }
    const { error } = await this.client.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin + window.location.pathname,
        shouldCreateUser: true
      }
    });
    if (error) throw new Error(error.message);
    return { sent: true };
  },

  /* Google OAuth — opens Google's sign-in page in a new tab to survive
   * the X-Frame-Options block that prevents OAuth in iframes. */
  async signInWithGoogle() {
    if (!this.client) throw new Error("Auth unavailable.");
    const redirectTo = window.location.origin + window.location.pathname;
    const { data, error } = await this.client.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        skipBrowserRedirect: this.inIframe()  // we'll open in new tab if iframed
      }
    });
    if (error) throw new Error(error.message);
    if (this.inIframe() && data?.url) {
      window.open(data.url, "_blank", "noopener,noreferrer");
      return { newTab: true };
    }
    return { redirected: true };
  },

  /* Email + password sign-in. Works server-side regardless of dashboard
   * config because the email provider is on by default in Supabase. */
  async signInWithPassword(email, password) {
    if (!this.client) throw new Error("Auth unavailable — SDK didn't load.");
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Please enter a valid email address.");
    }
    if (!password || password.length < 6) {
      throw new Error("Password must be at least 6 characters.");
    }
    const { data, error } = await this.client.auth.signInWithPassword({ email, password });
    if (error) {
      if (/invalid login credentials/i.test(error.message)) {
        throw new Error("Email or password is wrong. Use 'Create account' if you're new, or 'Forgot password?' if you used to sign in.");
      }
      throw new Error(error.message);
    }
    return data;
  },

  /* Create a new account with email + password. If email confirmations
   * are ON in the Supabase project, returns { sent: true } (user must
   * click email link). If OFF, returns { confirmed: true } and signs in
   * immediately. */
  async signUpWithPassword(email, password) {
    if (!this.client) throw new Error("Auth unavailable — SDK didn't load.");
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Please enter a valid email address.");
    }
    if (!password || password.length < 6) {
      throw new Error("Pick a password of at least 6 characters.");
    }
    const { data, error } = await this.client.auth.signUp({
      email, password,
      options: { emailRedirectTo: window.location.origin + window.location.pathname }
    });
    if (error) {
      if (/already registered/i.test(error.message)) {
        throw new Error("That email already has an account. Use Sign In instead, or reset your password.");
      }
      throw new Error(error.message);
    }
    return { confirmed: !!data.session, sent: !data.session };
  },

  /* Send a password-reset email. User clicks link → lands back on app
   * with a recovery session active → app should prompt for new password. */
  async sendPasswordReset(email) {
    if (!this.client) throw new Error("Auth unavailable.");
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Please enter a valid email address.");
    }
    const { error } = await this.client.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + window.location.pathname
    });
    if (error) throw new Error(error.message);
    return { sent: true };
  },

  async signOut() {
    if (!this.client) return;
    await this.client.auth.signOut();
    this.user = null;
  },

  // ─── Data sync ──────────────────────────────────────────────────────

  /* Pull settings + all essays from the server. Called after sign-in. */
  async pullAll() {
    if (!this.user) return { settings: null, essays: [] };
    const userId = this.user.id;
    const [sRes, eRes] = await Promise.all([
      this.client.from("user_settings").select("settings, updated_at").eq("user_id", userId).maybeSingle(),
      this.client.from("essays").select("*").eq("user_id", userId).order("updated_at", { ascending: false })
    ]);
    if (sRes.error) console.warn("[Sb] pull settings:", sRes.error);
    if (eRes.error) console.warn("[Sb] pull essays:",   eRes.error);
    return {
      settings: sRes.data?.settings || null,
      essays:   (eRes.data || []).map(row => row.data).filter(Boolean)
    };
  },

  /* Upsert settings JSONB row (one per user). */
  async pushSettings(settings) {
    if (!this.user || !this.client) return;
    try {
      const { error } = await this.client.from("user_settings").upsert({
        user_id: this.user.id,
        settings: settings || {}
      }, { onConflict: "user_id" });
      if (error) throw error;
      window.dispatchEvent(new CustomEvent("supabase:sync-success", { detail: { kind: "settings" } }));
    } catch (err) {
      console.warn("[Sb] pushSettings:", err);
      window.dispatchEvent(new CustomEvent("supabase:sync-error", { detail: { kind: "settings", error: err.message } }));
    }
  },

  /* Upsert a single essay. `essay` is the full local essay object. */
  async pushEssay(essay) {
    if (!this.user || !this.client || !essay || !essay.id) return;
    const title = essay.setup?.title || "Untitled essay";
    const notionPageId = essay.notionPageId || essay.notion_page_id || null;
    try {
      const { error } = await this.client.from("essays").upsert({
        id:             essay.id,
        user_id:        this.user.id,
        title:          title,
        data:           essay,
        notion_page_id: notionPageId
      }, { onConflict: "id" });
      if (error) throw error;
      window.dispatchEvent(new CustomEvent("supabase:sync-success", { detail: { kind: "essay", id: essay.id } }));
    } catch (err) {
      console.warn("[Sb] pushEssay:", err);
      window.dispatchEvent(new CustomEvent("supabase:sync-error", { detail: { kind: "essay", id: essay.id, error: err.message } }));
    }
  },

  /* Push multiple essays in parallel, with concurrency cap to avoid
   * smashing the API. Returns count uploaded. */
  async pushEssaysBatch(essays) {
    if (!this.user || !this.client || !Array.isArray(essays)) return 0;
    const limit = 4;
    let i = 0, ok = 0;
    while (i < essays.length) {
      const batch = essays.slice(i, i + limit);
      const results = await Promise.allSettled(batch.map(e => this.pushEssay(e)));
      ok += results.filter(r => r.status === "fulfilled").length;
      i += limit;
    }
    return ok;
  },

  async deleteEssay(essayId) {
    if (!this.user || !this.client || !essayId) return;
    try {
      const { error } = await this.client.from("essays").delete().eq("id", essayId);
      if (error) throw error;
      window.dispatchEvent(new CustomEvent("supabase:sync-success", { detail: { kind: "delete", id: essayId } }));
    } catch (err) {
      console.warn("[Sb] deleteEssay:", err);
      window.dispatchEvent(new CustomEvent("supabase:sync-error", { detail: { kind: "delete", id: essayId, error: err.message } }));
    }
  },

  /* Migrate local-only data to the user's account on first sign-in.
   * Returns counts so the app can show a friendly "Imported N essays" toast. */
  async migrateLocal(localSettings, localEssays) {
    if (!this.user || !this.client) return { migratedEssays: 0, settingsUploaded: false };
    let settingsUploaded = false;
    if (localSettings && typeof localSettings === "object" && Object.keys(localSettings).length > 0) {
      await this.pushSettings(localSettings);
      settingsUploaded = true;
    }
    const migratedEssays = await this.pushEssaysBatch(Array.isArray(localEssays) ? localEssays : []);
    return { migratedEssays, settingsUploaded };
  }
};

window.Sb = Sb;
