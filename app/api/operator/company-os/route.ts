import {requireOperator} from "../../../../lib/operator-auth";
import {fail,json} from "../../../../lib/api";
import {miseNorthCompanyOs} from "../../../../lib/misenorth-company-os";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(){try{await requireOperator();return json(await miseNorthCompanyOs());}catch(e){return fail(e);}}
