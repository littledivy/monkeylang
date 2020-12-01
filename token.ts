export interface Token {
  token: TokenLit;
  ch: string;
  loc: number;
}

export type Ident = string;
export type Int = number;
export type Bool = boolean;
export type String = string;

export type Value = Ident | Int | Bool | String;

export interface TokenLit {
  type: Literals;
  value?: Value;
}

export enum Literals {
  Ident,
  Int,
  Bool,
  String,
  Illegal,
  Blank,
  Eof,
  Assign,
  If,
  Else,
  While,
  Plus,
  Minus,
  Bang,
  Asterisk,
  Slash,
  Caret,
  Dot,
  Let,
  Percent,
  Equal,
  NotEqual,
  LessThan,
  LessThanEqual,
  GreaterThan,
  GreaterThanEqual,
  Comma,
  Colon,
  Semicolon,
  Lparen,
  Rparen,
  Lbrace,
  Rbrace,
  Lbracket,
  Rbracket,
  Func,
  Return,
  Import,
}
