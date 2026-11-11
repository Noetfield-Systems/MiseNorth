import {createHash} from "node:crypto";
import {query} from "./db";

let cleanupCounter=0;

function clientAddress(req:Request):string {
  const direct=req.headers.get("x-real-ip")||req.headers.get("cf-connecting-ip");
  if(direct&&direct.length<=128)return direct.trim();
  const forwarded=req.headers.get("x-forwarded-for");
  if(forwarded){
    const first=forwarded.split(",")[0]?.trim();
    if(first&&first.length<=128)return first;
  }
  return "unknown";
}

export async function enforceRateLimit(
  req:Request,
  scope:string,
  maxHits:number,
  windowSeconds:number,
  identity="",
):Promise<void>{
  if(!Number.isInteger(maxHits)||maxHits<1||!Number.isInteger(windowSeconds)||windowSeconds<1){
    throw new Error("INVALID_RATE_LIMIT_CONFIGURATION");
  }
  const address=clientAddress(req);
  const normalizedIdentity=String(identity||"").trim().toLowerCase().slice(0,240);
  const bucketHash=createHash("sha256")
    .update(["misenorth-rate-v1",scope,address,normalizedIdentity].join("|"))
    .digest("hex");
  const windowMs=windowSeconds*1000;
  const start=new Date(Math.floor(Date.now()/windowMs)*windowMs);
  const result=await query<{hit_count:number}>(
    `INSERT INTO api_rate_limits(bucket_hash,window_start,hit_count,expires_at)
     VALUES($1,$2,1,$2::timestamptz + make_interval(secs=>$3::int))
     ON CONFLICT(bucket_hash,window_start)
     DO UPDATE SET hit_count=api_rate_limits.hit_count+1
     RETURNING hit_count`,
    [bucketHash,start.toISOString(),windowSeconds],
  );
  const hits=Number(result.rows[0]?.hit_count||0);
  if(hits>maxHits)throw new Error("RATE_LIMITED");
  cleanupCounter+=1;
  if(cleanupCounter%100===0){
    await query(
      `WITH stale AS (
         SELECT ctid FROM api_rate_limits
         WHERE expires_at<now()
         ORDER BY expires_at
         LIMIT 500
       )
       DELETE FROM api_rate_limits WHERE ctid IN (SELECT ctid FROM stale)`,
    );
  }
}
