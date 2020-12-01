import { BlockStmt, Expr, Program, Stmt } from "./ast.ts";

type Optional<T> = T | undefined;

type ValueData =
  | number
  | string
  | boolean
  | (Value | undefined)[]
  | Map<Value, Value>
  | Func
  | Builtin
  | Value;

interface Func {
  args: string[];
  block: BlockStmt;
  env: Env;
}

interface Builtin {
  args: number;
  func: (obj: Value[]) => Value;
}

interface Value {
  type: ValueType;
  value: ValueData;
}
enum ValueType {
  Int,
  String,
  Bool,
  Array,
  Hash,
  Func,
  Builtin,
  Null,
  ReturnValue,
  Error,
}

export class Env {
  store: Map<string, Value>;
  outer?: Env;
  constructor() {
    this.store = new Map();
  }

  get(name: string): Value | undefined {
    let item = this.store.get(name);
    if (!item && this.outer) {
      return this.outer.get(name);
    } else {
      return item;
    }
  }

  set(name: string, value: Value) {
    this.store.set(name, value);
  }
}

export class Evaluator {
  env: Env;
  constructor(env: Env) {
    this.env = env;
  }

  is_truthy(obj: Value): boolean {
    return obj.type == ValueType.Bool && obj.value == true;
  }

  error(msg: string): Value {
    return { type: ValueType.Error, value: msg } as Value;
  }

  is_error(obj?: Value): boolean {
    if (!obj) return true;
    return obj.type == ValueType.Error;
  }

  eval(program: Program): Value | null | undefined {
    let result;

    for (const stmt of program) {
      if (stmt.type == "blank") {
        continue;
      }

      let val = this.eval_stmt(stmt);
      result = val;
    }

    return result;
  }

  eval_block_stmt(stmts: BlockStmt): Optional<Value> {
    let result;

    for (const stmt of stmts) {
      if (stmt.type == "blank") {
        continue;
      }

      let val = this.eval_stmt(stmt);
      result = val;
    }

    return result;
  }

  eval_stmt(stmt: Stmt): Optional<Value> {
    if (stmt.expr == null) return;
    console.log(stmt)
    switch (stmt.type) {
      case "let":
        if ("expr" in stmt.expr) {
          let value = this.eval_expr(stmt.expr.expr);
          if (this.is_error(value)) {
            return value;
          } else {
            if (stmt.expr && "name" in stmt.expr) {
              if (!value) return;
              if(typeof stmt.expr.name !== "string") {
                this.env.set(stmt.expr.name.name as string, value);
              } else {
                this.env.set(stmt.expr.name as string, value);
              }
            }
            return;
          }
        }
        break;
      case "expr":
        if ("value" in stmt.expr) {
          return this.eval_expr(stmt.expr);
        }
        break;
      case "return":
        if ("expr" in stmt.expr) {
          return this.eval_expr(stmt.expr.expr);
        } else if("value" in stmt.expr) {
          return this.eval_expr(stmt.expr);
        }
        break;
      default:
        return;
        break;
    }
  }

  eval_expr(expr: Expr): Optional<Value> {
    console.log(expr)
    switch (expr.type) {
      case "ident":
        if (!("name" in expr.value)) return;
        let name = (typeof expr.value.name == "string")
          ? expr.value.name
          : expr.value.name.name;
        let val = this.env.get(name);
        if (val) {
          return val;
        } else {
          return this.error(`identifier not found \`${expr.value.name}\` `);
        }
        break;
      case "int":
        if(typeof expr.value !== "number") return;
        return { type: ValueType.Int, value: expr.value };
        break;
      case "string":
          if(typeof expr.value !== "string") return;
          return { type: ValueType.String, value: expr.value };
      break;
      case "literal":
        if(!("type" in expr.value) || !("value" in expr.value)) return;
        switch (expr.value.type) {
          case "int":
            if(typeof expr.value.value !== "number") return;
            return { type: ValueType.Int, value: expr.value.value };
            break;
          case "string":
            if(typeof expr.value.value !== "string") return;
            return { type: ValueType.String, value: expr.value.value };
          case "bool":
            if(typeof expr.value.value !== "boolean") return;
            return { type: ValueType.Bool, value: expr.value.value };
          case "array":
            if(!Array.isArray(expr.value.value)) return;
            let value = expr.value.value.map((e: Expr) => this.eval_expr(e));
            return { type: ValueType.Array, value }
          break;

          default:
            break;
        }
        break;
      default:
        return;
        break;
    }
  }
}
