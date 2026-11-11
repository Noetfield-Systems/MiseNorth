import type {Metadata} from "next";
import "./growth-command.css";
import OperatorConsole from "./operator-console";
export const metadata:Metadata={title:"Growth Command",robots:{index:false,follow:false,noarchive:true}};
export default function OperatorPage(){return <OperatorConsole/>;}
