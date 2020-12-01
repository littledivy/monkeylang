import { Lexer } from "./lexer.ts";
import { Literals } from "./token.ts";

let lexer = new Lexer(`let a = "Hello World"`);
for (;;) {
  let tok = lexer.next_token();
  console.log(tok);
  if (tok.type == Literals.Eof) {
    break;
  }
}
