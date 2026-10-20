export const THEME_KEY = "qda2-lab-theme";
export const PRESENT_KEY = "qda2-lab-present";

/** Every localStorage key the site writes. The privacy page lists them and can delete them. */
export const STORAGE_KEYS = {
  progress: "qda2-lab-progress-v1",
  theme: THEME_KEY,
  presentation: PRESENT_KEY,
  sopranosNotes: "qda2-sopranos-notes-v1",
} as const;

/**
 * Inline script run before paint so the stored theme and presentation mode apply without a flash.
 * `?present=1` / `?present=0` in the URL switches presentation mode on or off and remembers it.
 */
export const themeInitScript = `(function(){var c=document.documentElement.classList;try{var t=localStorage.getItem('${THEME_KEY}');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)c.add('dark');}catch(e){}try{var q=new URLSearchParams(location.search).get('present');var p=q==='1'||q==='0'?q:localStorage.getItem('${PRESENT_KEY}');if(p==='1')c.add('present');if(q==='1'||q==='0')localStorage.setItem('${PRESENT_KEY}',q);}catch(e){}})();`;
