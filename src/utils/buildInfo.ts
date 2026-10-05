declare const __COMMIT_SHA__: string;
declare const __GIT_BRANCH__: string;
declare const __BUILD_TIME__: string;

export interface BuildMetadata {
  commitSha: string;
  gitBranch: string;
  buildTime: string;
  dataMode: 'live' | 'mock';
  supabaseProjectRef: string;
}

export function getBuildInfo(): BuildMetadata {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  let projectRef = 'none';
  try {
    if (supabaseUrl) {
      const parsed = new URL(supabaseUrl);
      projectRef = parsed.hostname.split('.')[0] || 'unknown';
    }
  } catch {
    projectRef = 'invalid_url';
  }

  const isLive = Boolean(
    supabaseUrl &&
    import.meta.env.VITE_SUPABASE_ANON_KEY &&
    !supabaseUrl.includes('placeholder')
  );

  return {
    commitSha: typeof __COMMIT_SHA__ !== 'undefined' ? __COMMIT_SHA__ : 'local-dev',
    gitBranch: typeof __GIT_BRANCH__ !== 'undefined' ? __GIT_BRANCH__ : 'fix/persistence-live',
    buildTime: typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : new Date().toISOString(),
    dataMode: isLive ? 'live' : 'mock',
    supabaseProjectRef: projectRef,
  };
}
