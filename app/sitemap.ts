import type {MetadataRoute} from "next";
export default function sitemap():MetadataRoute.Sitemap{
 const base=(process.env.NEXT_PUBLIC_APP_URL||"https://misenorth-web-production.up.railway.app").replace(/\/$/,"");
 return ["/","/grader","/pricing","/demo","/restaurants/vancouver","/partners","/investors"].map(path=>({url:base+path,changeFrequency:"weekly" as const,priority:path==="/"?1:path==="/grader"?.9:.65}));
}
