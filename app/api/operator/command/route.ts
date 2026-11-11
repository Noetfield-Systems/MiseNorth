import {requireOperator} from "../../../../lib/operator-auth";
import {operatorGrowthSnapshot} from "../../../../lib/growth-command";
import {fail,json} from "../../../../lib/api";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(){
  try{await requireOperator();return json(await operatorGrowthSnapshot());}
  catch(error){return fail(error);}
}
