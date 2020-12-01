import { Literals, TokenLit } from "./token.ts";

const alphabets = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
];

const numbers = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "0",
];

export class Lexer {
  input: string;
  pos: number = 0;
  next_pos: number = 0;
  ch: string | 0 = 0;

  constructor(input: string) {
    this.input = input;
    this.read_char();
  }

  read_char() {
    if (this.next_pos >= this.input.length) {
      this.ch = 0;
    } else {
      this.ch = this.input[this.next_pos];
    }
    this.pos = this.next_pos;
    this.next_pos += 1;
  }

  nextch(): string | 0 {
    if (this.next_pos >= this.input.length) {
      return 0;
    } else {
      return this.input[this.next_pos];
    }
  }

  nextch_is(ch: string): boolean {
    return this.nextch() == ch;
  }

  skip_whitespace() {
    loop:
    for (;;) {
      switch (this.ch) {
        case " " || "\t":
          this.read_char();
          break;
        default:
          break loop;
      }
    }
  }

  next_token(): TokenLit {
    this.skip_whitespace();
    let tok = Literals.Illegal;
    switch (this.ch) {
      case "=":
        if (this.nextch_is("=")) {
          this.read_char();
          tok = Literals.Equal;
        } else {
          tok = Literals.Assign;
        }
        break;
      case "!":
        if (this.nextch_is("=")) {
          this.read_char();
          tok = Literals.NotEqual;
        } else {
          tok = Literals.Bang;
        }
        break;
      case "<":
        if (this.nextch_is("=")) {
          this.read_char();
          tok = Literals.LessThanEqual;
        } else {
          tok = Literals.LessThan;
        }
        break;
      case ">":
        if (this.nextch_is("=")) {
          this.read_char();
          tok = Literals.GreaterThanEqual;
        } else {
          tok = Literals.GreaterThan;
        }
        break;
      case "\n":
        if (this.nextch_is("\n")) {
          tok = Literals.Blank;
        } else {
          this.read_char();
          return this.next_token();
        }
        break;
      case "+":
        tok = Literals.Plus;
        break;
      case "-":
        tok = Literals.Minus;
        break;
      case "/":
        tok = Literals.Slash;
        break;
      case "*":
        tok = Literals.Asterisk;
        break;
      case "(":
        tok = Literals.Lparen;
        break;
      case ")":
        tok = Literals.Rparen;
        break;
      case "{":
        tok = Literals.Lbrace;
        break;
      case "}":
        tok = Literals.Rbrace;
        break;
      case "[":
        tok = Literals.Lbracket;
        break;
      case "]":
        tok = Literals.Rbracket;
        break;
      case ",":
        tok = Literals.Comma;
        break;
      case ";":
        tok = Literals.Semicolon;
        break;
      case ":":
        tok = Literals.Colon;
        break;
      case '"':
        return this.consume_string();
        break;
      case 0:
        tok = Literals.Eof;
        break;
      default:
        if (alphabets.includes(this.ch.toString())) {
          return this.consume_identifier();
        } else if (numbers.includes(this.ch.toString())) {
          return this.consume_number();
        }
        break;
    }
    this.read_char();
    return { type: tok };
  }

  consume_identifier(): TokenLit {
    let start_pos = this.pos;
    loop:
    for (;;) {
      if (alphabets.includes(this.ch.toString())) {
        this.read_char();
      } else {
        break loop;
      }
    }

    let literal = this.input.substring(start_pos, this.pos);

    let tok: TokenLit = { type: Literals.Ident, value: literal };

    switch (literal) {
      case "fn":
        tok.type = Literals.Func;
        break;
      case "let":
        tok.type = Literals.Let;
        break;
      case "if":
        tok.type = Literals.If;
        break;
      case "else":
        tok.type = Literals.Else;
        break;
      case "return":
        tok.type = Literals.Return;
        break;
      case "true":
        tok.type = Literals.Bool;
        tok.value = true;
        break;
      case "false":
        tok.type = Literals.Bool;
        tok.value = false;
        break;
      default:
        break;
    }
    return tok;
  }

  consume_number(): TokenLit {
    let start_pos = this.pos;
    loop:
    for (;;) {
      if (this.ch == 0) break loop;
      if (numbers.includes(this.ch)) {
        this.read_char();
      } else {
        break loop;
      }
    }

    let literal = this.input.substring(start_pos, this.pos);
    return { type: Literals.Int, value: parseInt(literal) };
  }

  consume_string(): TokenLit {
    this.read_char();
    let start_pos = this.pos;
    for (;;) {
      if (this.ch == '"' || this.ch === 0) {
        break;
      } else {
        this.read_char();
      }
    }
    let literal = this.input.substring(start_pos, this.pos);
    this.read_char();
    return { type: Literals.String, value: literal };
  }
}
