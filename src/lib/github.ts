const CACHE_KEY   = 'github_stats_cache';
const CACHE_TTL   = 60 * 60 * 1000;
const GITHUB_USER = 'sthitiprajnya';

export interface GitHubStats {
  followers:   number;
  publicRepos: number;
  totalStars:  number;
  totalForks:  number;
  languages:   Record<string, number>;
  topRepos:    TopRepo[];
  fetchedAt:   number;
}

export interface TopRepo {
  name:        string;
  description: string | null;
  stars:       number;
  forks:       number;
  language:    string | null;
  url:         string;
}

export interface GitHubApiRepo {
  name: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  html_url: string;
}

const GITHUB_FALLBACK_DATA: GitHubStats = {
  followers: 0,
  publicRepos: 10,
  totalStars: 0,
  totalForks: 0,
  languages: { Python: 4, Shell: 3, JavaScript: 2 },
  topRepos: [],
  fetchedAt: Date.now(),
};

export async function fetchGitHubStats(): Promise<GitHubStats> {
  if (typeof window === 'undefined') return GITHUB_FALLBACK_DATA;

  let cached: string | null = null;
  try {
    cached = localStorage.getItem(CACHE_KEY);
  } catch (e) {
    try {
      cached = sessionStorage.getItem(CACHE_KEY);
    } catch (e2) {
      cached = (window as any).__fallbackGithubCache || null;
    }
    console.warn('Failed to access GitHub stats cache from storage.', e);
  }

  if (cached) {
    try {
      const parsed: GitHubStats = JSON.parse(cached);
      if (Date.now() - parsed.fetchedAt < CACHE_TTL) return parsed;
    } catch (e) {
      console.warn('Failed to parse cached GitHub stats, clearing cache.', e);
      try {
        localStorage.removeItem(CACHE_KEY);
      } catch {
        // Ignore
      }
    }
  }

  const headers = { 'Accept': 'application/vnd.github.v3+json' };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const [userRes, reposRes] = await Promise.all([
      fetch(`https://api.github.com/users/${GITHUB_USER}`, { headers, signal: controller.signal }),
      fetch(`https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=updated`, { headers, signal: controller.signal }),
    ]);

    clearTimeout(timeoutId);

    if (!userRes.ok || !reposRes.ok) {
      return GITHUB_FALLBACK_DATA;
    }

    const user  = await userRes.json();
    const repos: GitHubApiRepo[] = await reposRes.json();

    let totalStars = 0;
    let totalForks = 0;
    const languages: Record<string, number> = Object.create(null);

    let top1: GitHubApiRepo | null = null;
    let top2: GitHubApiRepo | null = null;
    let top3: GitHubApiRepo | null = null;

    let minTopStars = -1;

    for (let i = 0; i < repos.length; i++) {
      const r = repos[i];
      const stars = r.stargazers_count;
      const forks = r.forks_count;
      const lang = r.language;

      totalStars += stars;
      totalForks += forks;

      if (lang) {
        languages[lang] = (languages[lang] || 0) + 1;
      }

      if (stars > minTopStars) {
          if (!top1 || stars > top1.stargazers_count) {
              top3 = top2;
              top2 = top1;
              top1 = r;
          } else if (!top2 || stars > top2.stargazers_count) {
              top3 = top2;
              top2 = r;
          } else if (!top3 || stars > top3.stargazers_count) {
              top3 = r;
          }
          if (top3) minTopStars = top3.stargazers_count;
      }
    }

    const topReposArr = [];
    if (top1) topReposArr.push(top1);
    if (top2) topReposArr.push(top2);
    if (top3) topReposArr.push(top3);

    const topRepos = topReposArr.map(r => ({
        name:        r.name,
        description: r.description,
        stars:       r.stargazers_count,
        forks:       r.forks_count,
        language:    r.language,
        url:         r.html_url,
    }));

    const stats: GitHubStats = {
      followers: user.followers,
      publicRepos: user.public_repos,
      totalStars,
      totalForks,
      languages,
      topRepos,
      fetchedAt: Date.now(),
    };

    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(stats));
    } catch (e) {
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(stats));
      } catch (e2) {
        (window as any).__fallbackGithubCache = JSON.stringify(stats);
      }
      console.warn('Failed to save GitHub stats to storage cache.', e);
    }
    return stats;
  } catch (error) {
    console.error('Failed to fetch github stats', error);
    return GITHUB_FALLBACK_DATA;
  }
}