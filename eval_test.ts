import { Lexer } from "./lexer.ts";
import { Parser } from "./parser.ts";

import { Evaluator, Env } from "./eval.ts";

let lexer = new Lexer(`
 let a = "Hello World";
 return a;
`)
let ast = new Parser(lexer).parse();

let e = new Evaluator(new Env())
console.log(e.eval(ast))
