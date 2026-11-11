import type {Metadata,Viewport} from "next";
import type {ReactNode} from "react";
import "./globals.css";
const origin=process.env.NEXT_PUBLIC_APP_URL||"https://misenorth-growth-production.up.railway.app";
export const metadata:Metadata={
 metadataBase:new URL(origin),
 title:{default:"MiseNorth | Restaurant Websites, Ordering & Guest Growth",template:"%s | MiseNorth"},
 description:"A restaurant growth and digital operations platform built in Vancouver. Branded restaurant websites, digital menus, QR links, direct guest requests, reservations and CRM.",
 applicationName:"MiseNorth",
 keywords:["restaurant website","restaurant online ordering","restaurant guest management","QR menu","restaurant software Vancouver"],
 openGraph:{type:"website",locale:"en_CA",siteName:"MiseNorth",title:"Your restaurant. Your guests. Your growth.",description:"Branded restaurant websites, direct guest requests, reservations and an easy way to keep relationships.",url:"/"},
 twitter:{card:"summary",title:"MiseNorth — Restaurant Growth Platform",description:"Your restaurant. Your guests. Your growth."},
 icons:{icon:"/icon.svg",shortcut:"/icon.svg"},
 appleWebApp:{capable:true,title:"MiseNorth",statusBarStyle:"black-translucent"},
 robots:{index:true,follow:true}
};
export const viewport:Viewport={width:"device-width",initialScale:1,themeColor:"#123829"};
export default function RootLayout({children}:{children:ReactNode}){return <html lang="en-CA"><body>{children}</body></html>;}
