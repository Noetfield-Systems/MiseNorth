import type {Metadata} from "next";
import OperatorConsole from "./operator-console";
export const metadata:Metadata={title:"Private Operator Inbox",robots:{index:false,follow:false,noarchive:true}};
export default function OperatorPage(){return <OperatorConsole/>;}
