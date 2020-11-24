// import { IType } from '../../interfaces';
import { nil } from '../utils';

export const LOCATION = Symbol('_location_');

export type Statement = (SelectStatement
    | CreateTableStatement
    | CreateIndexStatement
    | CreateExtensionStatement
    | CommitStatement
    | InsertStatement
    | UpdateStatement
    | DeleteStatement
    | RollbackStatement
    | AlterTableStatement
    | StartTransactionStatement) & {
        [LOCATION]?: StatementLocation;
    };

export interface StatementLocation {
    /** Location of the last ";" prior to this statement */
    start?: number;
    /** Location of the first ";" after this statement (if any) */
    end?: number;
}

export interface StartTransactionStatement {
    type: 'start transaction';
}
export interface CommitStatement {
    type: 'commit';
}
export interface RollbackStatement {
    type: 'rollback';
}


export interface DeleteStatement {
    type: 'delete';
    from: TableRefAliased;
    returning?: SelectedColumn[] | nil;
    where?: Expr | nil;
}

export interface InsertStatement {
    type: 'insert';
    into: TableRefAliased;
    returning?: SelectedColumn[] | nil;
    columns?: string[] | nil;
    /** Insert values */
    values?: (Expr | 'default')[][] | nil;
    /** Insert into select */
    select?: SelectStatement | nil;
    onConflict?: OnConflictAction | nil;
}

export interface OnConflictAction {
    on?: Expr[] | nil;
    do: 'do nothing' | {
        sets: SetStatement[];
    };
}

export interface AlterTableStatement {
    type: 'alter table';
    table: TableRefAliased;
    ifExists?: boolean;
    change: TableAlteration;
}

export interface TableAlterationRename {
    type: 'rename';
    to: string;
}

export interface TableAlterationRenameColumn {
    type: 'rename column';
    column: string;
    to: string;
}
export interface TableAlterationRenameConstraint {
    type: 'rename constraint';
    constraint: string;
    to: string;
}
export interface TableAlterationAddColumn {
    type: 'add column';
    ifNotExists?: boolean;
    column: CreateColumnDef;
}

export interface TableAlterationDropColumn {
    type: 'drop column';
    ifExists?: boolean;
    column: string;
}

export interface TableAlterationAlterColumn {
    type: 'alter column',
    column: string;
    alter: AlterColumn
}

export interface TableAlterationAddConstraint {
    type: 'add constraint',
    constraintName?: string;
    constraint: ConstraintDef;
}

export type TableAlteration = TableAlterationRename
    | TableAlterationRenameColumn
    | TableAlterationRenameConstraint
    | TableAlterationAddColumn
    | TableAlterationDropColumn
    | TableAlterationAlterColumn
    | TableAlterationAddConstraint

export interface AlterColumnSetType {
    type: 'set type';
    dataType: DataTypeDef;
}

export interface AlterColumnSetDefault {
    type: 'set default';
    default: Expr;
    updateExisting?: boolean;
}

export interface AlterColumnSimple {
    type: 'drop default' | 'set not null' | 'drop not null';
};

export type AlterColumn = AlterColumnSetType
    | AlterColumnSetDefault
    | AlterColumnSimple;


export type ConstraintDef
    = ConstraintForeignKeyDef
    | ConstraintPrimaryKeyDef
    | {
        type: never;
    }

export interface ConstraintPrimaryKeyDef {
    type: 'primary key';
    columns: string[];
}

export interface ConstraintForeignKeyDef {
    type: 'foreign key';
    localColumns: string[];
    foreignTable: string;
    foreignColumns: string[];
    onDelete: ConstraintAction
    onUpdate: ConstraintAction
}

/**
 * FROM https://www.postgresql.org/docs/12/ddl-constraints.html
 *
 * Restricting and cascading deletes are the two most common options.
 * RESTRICT prevents deletion of a referenced row.
 * NO ACTION means that if any referencing rows still exist when the constraint is checked,
 * an error is raised; this is the default behavior if you do not specify anything.
 * (The essential difference between these two choices is that NO ACTION allows the check to be deferred until later in the transaction, whereas RESTRICT does not.)
 * CASCADE specifies that when a referenced row is deleted,
 * row(s) referencing it should be automatically deleted as well.
 * There are two other options: SET NULL and SET DEFAULT.
 * These cause the referencing column(s) in the referencing row(s) to be set to nulls or their default values, respectively, when the referenced row is deleted.
 * Note that these do not excuse you from observing any constraints.
 * For example, if an action specifies SET DEFAULT but the default value would not satisfy the foreign key constraint, the operation will fail.
 */
export type ConstraintAction = 'cascade'
    | 'no action'
    | 'restrict'
    | 'set null'
    | 'set default';

export interface CreateIndexStatement {
    type: 'create index';
    table: string;
    expressions: IndexExpression[];
    unique?: true;
    ifNotExists?: true;
    indexName?: string;
}

export interface CreateExtensionStatement {
    type: 'create extension';
    extension: string;
    ifNotExists?: true;
    schema?: string;
    version?: string;
    from?: string;
}

export interface IndexExpression {
    expression: Expr;
    order?: 'asc' | 'desc';
    nulls?: 'first' | 'last';
}

export interface CreateTableStatement {
    type: 'create table';
    name: string;
    ifNotExists?: true;
    columns: CreateColumnDef[];
    /** Constraints not defined inline */
    constraints?: TableConstraint[];
}

export interface CreateColumnDef {
    name: string;
    dataType: DataTypeDef;
    // collate?: string; (todo)
    constraint?: ColumnConstraint;
    default?: Expr | nil;
}

export interface DataTypeDef {
    type: string;
    length?: number;
    arrayOf?: DataTypeDef;
}

export type ColumnConstraint = UniqueConstraint | PrimaryConstraint | NotNullConstraint;

export interface NotNullConstraint {
    type: 'not null';
}

export interface PrimaryConstraint {
    type: 'primary key';
}

export interface UniqueConstraint {
    type: 'unique';
    notNull?: boolean;
}

export type TableConstraint = (PrimaryConstraint | UniqueConstraint) & {
    constraintName?: string;
    columns: string[];
}


export interface SelectStatement {
    type: 'select',
    columns?: SelectedColumn[] | nil;
    from?: From[] | nil;
    where?: Expr | nil;
    groupBy?: Expr[] | nil;
    limit?: LimitStatement | nil;
    orderBy?: OrderByStatement[] | nil;
}

export interface OrderByStatement {
    by: Expr;
    order: 'ASC' | 'DESC';
}

export interface LimitStatement {
    limit?: number;
    offset?: number;
}


export interface UpdateStatement {
    type: 'update';
    table: TableRefAliased;
    sets: SetStatement[];
    where?: Expr | nil;
    returning?: SelectedColumn[] | nil;
}

export interface SetStatement {
    column: string;
    value: Expr | 'default';
}

export interface SelectedColumn {
    expr: Expr;
    alias?: string;
}

export type From = FromTable | FromStatement;

export interface TableRef {
    table: string;
    db?: string;
}

export interface TableRefAliased extends TableRef {
    alias?: string;
}

export interface FromTable extends TableRefAliased {
    type: 'table',
    join?: JoinClause | nil;
}

export interface FromStatement {
    type: 'statement';
    statement: SelectStatement;
    alias: string;
    db?: null | nil;
    join?: JoinClause | nil;
}

export interface JoinClause {
    type: JoinType;
    on?: Expr | nil;
}

export type JoinType = 'INNER JOIN'
    | 'LEFT JOIN'
    | 'RIGHT JOIN'
    | 'FULL JOIN';

export type Expr = ExprRef
    | ExprList
    | ExprNull
    | ExprInteger
    | ExprMember
    | ExprArrayIndex
    | ExprNumeric
    | ExprString
    | ExprCase
    | ExprBinary
    | ExprUnary
    | ExprCast
    | ExprBool
    | ExprCall
    | SelectStatement
    | ExprConstant
    | ExprTernary;


export type LogicOperator = 'OR' | 'AND';
export type EqualityOperator = 'IN' | 'NOT IN' | 'LIKE' | 'NOT LIKE' | 'ILIKE' | 'NOT ILIKE' | '=' | '!=';
export type ComparisonOperator = '>' | '>=' | '<' | '<=' | '@>' | '<@' | '?' | '?|' | '?&';
export type AdditiveOperator = '||' | '-' | '#-' | '&&' | '+';
export type MultiplicativeOperator = '*' | '%' | '/';
export type BinaryOperator = LogicOperator
    | EqualityOperator
    | ComparisonOperator
    | AdditiveOperator
    | MultiplicativeOperator
    | '^'

export interface ExprBinary {
    type: 'binary';
    left: Expr;
    right: Expr;
    op: BinaryOperator;
}

export interface ExprConstant {
    type: 'constant';
    dataType: DataTypeDef, // | IType;
    value: any;
}

export type ExprLiteral = ExprConstant | ExprInteger | ExprNumeric | ExprString | ExprBool | ExprNull;


export interface ExprTernary {
    type: 'ternary';
    value: Expr;
    lo: Expr;
    hi: Expr;
    op: 'BETWEEN' | 'NOT BETWEEN';
}

export interface ExprCast {
    type: 'cast';
    to: DataTypeDef;
    operand: Expr;
}


export type UnaryOperator = '+' | '-' | 'NOT' | 'IS NULL' | 'IS NOT NULL' | 'IS TRUE' | 'IS FALSE' | 'IS NOT TRUE' | 'IS NOT FALSE';
export interface ExprUnary {
    type: 'unary';
    operand: Expr;
    op: UnaryOperator;
}

export interface ExprRef {
    type: 'ref';
    table?: string;
    name: string | '*';
}

export interface ExprMember {
    type: 'member';
    operand: Expr;
    op: '->' | '->>';
    member: string | number;
}

export interface ExprCall {
    type: 'call';
    function: string;
    args: Expr[];
}

export interface ExprList {
    type: 'list';
    expressions: Expr[];
}

export interface ExprArrayIndex {
    type: 'arrayIndex',
    array: Expr;
    index: Expr;
}

export interface ExprNull {
    type: 'null';
}

export interface ExprInteger {
    type: 'integer';
    value: number;
}

export interface ExprNumeric {
    type: 'numeric';
    value: number;
}

export interface ExprString {
    type: 'string';
    value: string;
}

export interface ExprBool {
    type: 'boolean';
    value: boolean;
}

export interface ExprCase {
    type: 'case';
    value?: Expr | nil;
    whens: ExprWhen[];
    else?: Expr | nil;
}

export interface ExprWhen {
    when: Expr;
    value: Expr;
}