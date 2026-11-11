import type {MetadataRoute} from "next";
export default function robots():MetadataRoute.Robots{
 const base=(process.env.NEXT_PUBLIC_APP_URL||"https://misenorth-web-production.up.railway.app").replace(/\/$/,"");
 return {rules:[{userAgent:"*",allow:"/",disallow:["/admin","/api/","/grader/report/","/login","/signup","/reset-password","/forgot-password"]}],sitemap:base+"/sitemap.xml"};
}
