import { Lexer } from "./lexer.ts";
import { Literals, TokenLit } from "./token.ts";
import {
  BlockStmt,
  Call,
  Expr,
  Func,
  Hash,
  Ident,
  If,
  Index,
  Infix,
  InfixExpr,
  Let,
  Literal as ASTLiteral,
  Precedence,
  Prefix,
  PrefixExpr,
  Return,
  Stmt,
} from "./ast.ts";

export class Parser {
  lexer: Lexer;
  current_token: TokenLit = { type: Literals.Eof };
  next_token: TokenLit = { type: Literals.Eof };

  constructor(lexer: Lexer) {
    this.lexer = lexer;

    this.bump();
    this.bump();
  }

  bump() {
    this.current_token = this.next_token;
    this.next_token = this.lexer.next_token();
  }

  current_token_is(token: TokenLit): boolean {
    return this.current_token.type == token.type;
  }

  next_token_is(token: TokenLit): boolean {
    return this.next_token.type == token.type;
  }

  expect_next_token(token: TokenLit): boolean {
    if (this.next_token_is(token)) {
      this.bump();
      return true;
    } else {
      throw new Error(
        `expected next token to be ${Literals[token.type]}, got ${
          Literals[this.next_token.type]
        } instead`,
      );
    }
  }

  token_to_precedence(tok: TokenLit): Precedence {
    switch (tok.type) {
      case Literals.Equal | Literals.NotEqual:
        return Precedence.Equals;
        break;
      case Literals.LessThan | Literals.LessThanEqual:
        return Precedence.LessGreater;
        break;
      case Literals.GreaterThan | Literals.GreaterThanEqual:
        return Precedence.LessGreater;
        break;
      case Literals.Plus | Literals.Minus:
        return Precedence.Sum;
        break;
      case Literals.Slash | Literals.Asterisk:
        return Precedence.Product;
        break;
      case Literals.Lparen:
        return Precedence.Call;
        break;
      case Literals.Lbracket:
        return Precedence.Index;
        break;
      default:
        return Precedence.Lowest;
        break;
    }
  }

  current_token_precedence(): Precedence {
    return this.token_to_precedence(this.current_token);
  }

  next_token_precedence(): Precedence {
    return this.token_to_precedence(this.next_token);
  }

  parse() {
    let program = [];

    while (!this.current_token_is({ type: Literals.Eof })) {
      program.push(this.parse_stmt());
      this.bump();
    }

    return program;
  }

  parse_block_stmt(): BlockStmt {
    this.bump();
    let block: Stmt[] = [];
    while (
      !this.current_token_is({ type: Literals.Rbrace }) &&
      !this.current_token_is({ type: Literals.Eof })
    ) {
      block.push(this.parse_stmt());
      this.bump();
    }

    return block;
  }

  parse_stmt(): Stmt {
    switch (this.current_token.type) {
      case Literals.Let:
        return this.parse_let_stmt();
        break;
      case Literals.Return:
        return this.parse_return_stmt();
        break;
      case Literals.Blank:
        return { type: "blank" };
        break;
      default:
        return this.parse_expr_stmt();
        break;
    }
  }

  parse_let_stmt(): Stmt {
    if (this.next_token.type == Literals.Ident) {
      this.bump();
    } else {
      throw new Error("Expected Ident after `let`");
    }

    let name = this.parse_ident();

    if (
      !this.expect_next_token({ type: Literals.Assign })
    ) {
      throw new Error("Expected `=` after Ident");
    }
    this.bump();

    let expr = this.parse_expr(Precedence.Lowest);

    if (this.next_token_is({ type: Literals.Semicolon })) {
      this.bump();
    }
    let stmt = { name, expr } as Let;
    return { type: "let", expr: stmt } as Stmt;
  }

  parse_return_stmt(): Stmt {
    this.bump();

    let expr = this.parse_expr(Precedence.Lowest);

    if (this.next_token_is({ type: Literals.Semicolon })) {
      this.bump();
    }

    return { type: "return", expr } as Stmt;
  }

  parse_expr_stmt(): Stmt {
    let expr = this.parse_expr(Precedence.Lowest);
    if (this.next_token_is({ type: Literals.Semicolon })) {
      this.bump();
    }
    return { type: "expr", expr };
  }

  parse_expr(precedence: Precedence): Expr {
    // prefix
    let left;
    switch (this.current_token.type) {
      case Literals.Ident:
        left = this.parse_ident_expr();
        break;
      case Literals.Int:
        left = this.parse_int_expr();
        break;
      case Literals.String:
        left = this.parse_string_expr();
        break;
      case Literals.Bool:
        left = this.parse_bool_expr();
        break;
      case Literals.Lbracket:
        left = this.parse_array_expr();
        break;
      case Literals.Lbrace:
        left = this.parse_hash_expr();
        break;
      case Literals.Bang:
      case Literals.Minus:
      case Literals.Plus:
        left = this.parse_prefix_expr();
        break;
      case Literals.Lparen:
        left = this.parse_grouped_expr();
        break;
      case Literals.If:
        left = this.parse_if_expr();
        break;
      case Literals.Func:
        left = this.parse_func_expr();
        break;
      default:
        throw new Error(
          `No prefix parse function for ${Literals[this.current_token.type]}.`,
        );
        break;
    } // infix

    while (
      !this.next_token_is({ type: Literals.Semicolon }) &&
      precedence < this.next_token_precedence()
    ) {
      switch (this.next_token.type) {
        case Literals.Plus |
          Literals.Minus |
          Literals.Slash |
          Literals.Asterisk |
          Literals.Equal |
          Literals.NotEqual |
          Literals.LessThan |
          Literals.LessThanEqual |
          Literals.GreaterThan |
          Literals.GreaterThanEqual:
          this.bump();
          left = this.parse_infix_expr(left);
          break;
        case Literals.Lbracket:
          this.bump();
          left = this.parse_index_expr(left);
          break;
        case Literals.Lparen:
          this.bump();
          left = this.parse_call_expr(left);
          break;
        default:
          return left;
          break;
      }
    }

    return left;
  }

  parse_ident(): Ident {
    let tok = this.current_token;
    if (tok.type == Literals.Ident) {
      return { name: tok.value } as Ident;
    } else {
      throw new Error("Expected ident.");
    }
  }

  parse_ident_expr(): Expr {
    let ident = this.parse_ident();
    return { type: "ident", value: ident } as Expr;
  }

  parse_int_expr(): Expr {
    let tok = this.current_token;
    if (tok.type == Literals.Int) {
      return { type: "int", value: tok.value } as ASTLiteral;
    } else {
      throw new Error("Expected int.");
    }
  }

  parse_string_expr(): Expr {
    let tok = this.current_token;
    if (tok.type == Literals.String) {
      return { type: "string", value: tok.value } as ASTLiteral;
    } else {
      throw new Error("Expected string.");
    }
  }

  parse_bool_expr(): Expr {
    let tok = this.current_token;
    if (tok.type == Literals.Bool) {
      return { type: "bool", value: tok.value } as ASTLiteral;
    } else {
      throw new Error("Expected boolean.");
    }
  }

  parse_array_expr(): Expr {
    let list = this.parse_expr_list({ type: Literals.Rbracket });
    return { type: "array", value: list } as ASTLiteral;
  }

  parse_hash_expr(): Expr {
    let pairs = new Map();

    while (!this.next_token_is({ type: Literals.Rbrace })) {
      this.bump();

      let key = this.parse_expr(Precedence.Lowest);

      if (!this.expect_next_token({ type: Literals.Colon })) {
        throw new Error("Expected `:`.");
      }

      this.bump();

      let value = this.parse_expr(Precedence.Lowest);

      pairs.set(key, value);

      if (
        !this.next_token_is({ type: Literals.Rbrace }) &&
        !this.expect_next_token({ type: Literals.Comma })
      ) {
        throw new Error("Expected `,` or Rbrace.");
      }
    }

    if (!this.expect_next_token({ type: Literals.Rbrace })) {
      throw new Error("Expected Rbrace.");
    }

    return { type: "hash", value: pairs as Hash } as ASTLiteral;
  }

  parse_expr_list(end: TokenLit): Expr[] {
    let list: Expr[] = [];

    if (this.next_token_is(end)) {
      this.bump();
      return list;
    }

    this.bump();

    list.push(this.parse_expr(Precedence.Lowest));

    while (this.next_token_is({ type: Literals.Comma })) {
      this.bump();
      this.bump();

      list.push(this.parse_expr(Precedence.Lowest));
    }

    if (!this.expect_next_token(end)) {
      throw new Error(`Expected ${end}.`);
    }

    return list;
  }

  parse_prefix_expr(): Expr {
    let prefix;
    switch (this.current_token.type) {
      case Literals.Bang:
        prefix = Prefix.Not;
        break;
      case Literals.Minus:
        prefix = Prefix.Minus;
        break;
      case Literals.Plus:
        prefix = Prefix.Plus;
        break;
      default:
        // ?
        throw new Error("Cannot parse prefix expr.");
        break;
    }

    this.bump();

    let expr = this.parse_expr(Precedence.Prefix);
    let value = { prefix, expr } as PrefixExpr;
    return { type: "prefix", value } as Expr;
  }

  parse_infix_expr(left: Expr): Expr {
    let infix;
    switch (this.current_token.type) {
      case Literals.Plus:
        infix = Infix.Plus;
        break;
      case Literals.Minus:
        infix = Infix.Minus;
        break;
      case Literals.Slash:
        infix = Infix.Divide;
        break;
      case Literals.Asterisk:
        infix = Infix.Multiply;
        break;
      case Literals.Equal:
        infix = Infix.Equal;
        break;
      case Literals.NotEqual:
        infix = Infix.NotEqual;
        break;
      case Literals.LessThan:
        infix = Infix.LessThan;
        break;
      case Literals.LessThanEqual:
        infix = Infix.LessThanEqual;
        break;
      case Literals.GreaterThan:
        infix = Infix.GreaterThan;
        break;
      case Literals.GreaterThanEqual:
        infix = Infix.GreaterThanEqual;
        break;
      default:
        // ?
        throw new Error("Cannot parse infix expr.");
        break;
    }

    let precedence = this.current_token_precedence();

    this.bump();

    let expr = this.parse_expr(precedence);

    let value = { infix, left, expr } as InfixExpr;
    return { type: "infix", value } as Expr;
  }

  parse_index_expr(left: Expr): Expr {
    this.bump();

    let index = this.parse_expr(Precedence.Lowest);

    if (!this.expect_next_token({ type: Literals.Rbracket })) {
      throw new Error("Expected next token to be Rbracket.");
    }

    let value = { left, index } as Index;
    return { type: "index", value } as Expr;
  }

  parse_grouped_expr(): Expr {
    this.bump();

    let expr = this.parse_expr(Precedence.Lowest);

    if (!this.expect_next_token({ type: Literals.Lparen })) {
      throw new Error("Expected next token to be Lparen.");
    } else {
      return expr;
    }
  }

  parse_if_expr(): Expr {
    if (!this.expect_next_token({ type: Literals.Lparen })) {
      throw new Error("Expected next token to be Lparen.");
    }

    this.bump();

    let cond = this.parse_expr(Precedence.Lowest);

    if (
      !this.expect_next_token({ type: Literals.Rparen }) ||
      !this.expect_next_token({ type: Literals.Lbrace })
    ) {
      throw new Error("Expected next token to be Rparen or Lbrace.");
    }

    let consequence = this.parse_block_stmt();
    let alternative;

    // FIX
    if (this.next_token_is({ type: Literals.Else })) {
      this.bump();

      if (!this.expect_next_token({ type: Literals.Lbrace })) {
        throw new Error("Expected next token to be Lbrace.");
      }

      alternative = this.parse_block_stmt();
    }

    let value = {
      cond,
      consequence,
      alternative,
    } as If;
    return { type: "if", value } as Expr;
  }

  parse_func_expr(): Expr {
    if (!this.expect_next_token({ type: Literals.Lparen })) {
      throw new Error("Expected next token to be Lparen.");
    }

    let params = this.parse_func_params();

    if (!this.expect_next_token({ type: Literals.Lbrace })) {
      throw new Error("Expected next token to be Lparen.");
    }

    let value = {
      params,
      body: this.parse_block_stmt(),
    } as Func;
    return { type: "func", value } as Expr;
  }

  parse_func_params(): string[] {
    let params: string[] = [];

    if (this.next_token_is({ type: Literals.Rparen })) {
      this.bump();
      return params;
    }

    this.bump();

    params.push(this.parse_ident().name);

    while (this.next_token_is({ type: Literals.Comma })) {
      this.bump();
      this.bump();

      params.push(this.parse_ident().name);
    }
    if (
      !this.expect_next_token({ type: Literals.Rparen })
    ) {
      throw new Error("Expected next token to be Rparen.");
    }

    return params;
  }

  parse_call_expr(func: Expr): Expr {
    let args = this.parse_expr_list({ type: Literals.Rparen });

    let value = {
      func,
      args,
    } as Call;

    return { type: "call", value } as Expr;
  }
}
