import type {WebsiteReport} from "./grader-core.mjs";
export function isPublicAddress(address:string):boolean;
export function fetchPublicHtml(input:string):Promise<{html:string;finalUrl:string}>;
export function buildHtmlReport(inputUrl:string,finalUrl:string,html:string):WebsiteReport;
