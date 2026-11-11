export interface GradeCategory { key:string;label:string;weight:number;score:number|null }
export interface GradeFinding { id:string;title:string;description:string;status:string;measuredScore:number }
export interface WebsiteReport {auditedUrl:string;finalUrl:string;hostname:string;source:string;sourceVersion:string;auditedAt:string;strategy:string;score:number;grade:string;categories:GradeCategory[];findings:GradeFinding[];coverage:string;advisory:string}
export function normalizeWebsiteUrl(input:string):string;
export function buildWebsiteReport(url:string,raw:unknown):WebsiteReport;
