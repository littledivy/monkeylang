export type Int = number;
export type Bool = boolean;
export type String = string;
export type Array = Expr[];
export type Hash = Map<Expr, Expr>;

export interface Literal {
  type: "int" | "bool" | "string" | "array" | "hash";
  value: Int | Bool | String | Array | Hash;
}

export enum Prefix {
  Plus,
  Minus,
  Not,
}

export enum Infix {
  Plus,
  Minus,
  Divide,
  Multiply,
  Equal,
  NotEqual,
  GreaterThanEqual,
  GreaterThan,
  LessThanEqual,
  LessThan,
}

export enum Precedence {
  Lowest,
  Equals, // ==
  LessGreater, // > or <
  Sum, // +
  Product, // *
  Prefix, // -X or !X
  Call, // myFunction(x)
  Index, // array[index]
}

export interface Ident {
  name: string;
}

export interface Let {
  name: string | Ident;
  expr: Expr;
}
export interface Return {
  expr: Expr;
}
export interface PrefixExpr {
  prefix: Prefix;
  expr: Expr;
}
export interface InfixExpr {
  infix: Infix;
  left: Expr;
  expr: Expr;
}
export interface Index {
  index: Expr;
  left: Expr;
}

export interface If {
  cond: Expr;
  consequence: BlockStmt;
  alternative?: BlockStmt;
}

export interface Call {
  func: Expr;
  args: Expr[];
}

export interface Func {
  params: string[];
  body: BlockStmt;
  name: string;
}

export interface Import {
  name: string;
}

export interface Stmt {
  type: "blank" | "let" | "return" | "expr";
  expr?: Let | Return | Expr;
}
export interface Expression {
  type:
    | "ident"
    | "let"
    | "literal"
    | "prefix"
    | "call"
    | "func"
    | "infix"
    | "index"
    | "if";
  value:
    | Ident
    | Let
    | Literal
    | PrefixExpr
    | Call
    | Func
    | InfixExpr
    | Index
    | If;
}

export type Expr = Literal | Expression;

export type BlockStmt = Stmt[];
export type Program = BlockStmt;
