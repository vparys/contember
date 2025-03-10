import { Acl, Input, Model, Value } from '@contember/schema'
import { InsertBuilder as DbInsertBuilder, QueryBuilder, Value as DbValue } from '@contember/database'
import { PathFactory, WhereBuilder } from '../select'
import { getColumnName, getColumnType } from '@contember/schema-utils'
import { ColumnValue, normalizeDbValue } from '../ColumnValue'
import { PredicateFactory } from '../../acl'
import { AfterInsertEvent, BeforeInsertEvent } from '../EventManager'
import { Mapper } from '../Mapper'

export interface InsertResult {
	values: ColumnValue[]
	executed: boolean
	primaryValue: Value.PrimaryValue | null
}

export class InsertBuilder {
	private rowData: Map<string, ColumnValue> = new Map()
	private where: { and: Input.OptionalWhere[] } = { and: [] }

	constructor(
		private readonly schema: Model.Schema,
		private readonly entity: Model.Entity,
		private readonly whereBuilder: WhereBuilder,
		private readonly pathFactory: PathFactory,
		private readonly predicateFactory: PredicateFactory,
	) {}

	public addFieldValue(
		fieldName: string,
		value: Value.FieldValue | undefined,
	): void {
		if (value === undefined) {
			return
		}
		const columnName = getColumnName(this.schema, this.entity, fieldName)
		const columnType = getColumnType(this.schema, this.entity, fieldName)
		this.rowData.set(columnName, { columnName, value, columnType, fieldName })
	}

	public addPredicates(fields: string[]): void {
		const where = this.predicateFactory.create(this.entity, Acl.Operation.create, fields)
		this.addWhere(where)
	}

	public addWhere(where: Input.OptionalWhere): void {
		this.where.and.push(where)
	}

	public async execute(mapper: Mapper): Promise<InsertResult> {
		try {
			const resolvedData = [...this.rowData.values()]

			const insertData = resolvedData.reduce<QueryBuilder.ColumnExpressionMap>(
				(result, item) => ({ ...result, [item.columnName]: expr => expr.select(['root_', item.columnName]) }),
				{},
			)
			const qb = DbInsertBuilder.create()
				.with('root_', qb => {
					return resolvedData.reduce(
						(qb, value) =>
							qb.select(
								expr => expr.selectValue(
									normalizeDbValue(value.value, value.columnType),
									value.columnType,
								),
								value.columnName,
							),
						qb,
					)
				})
				.into(this.entity.tableName)
				.values(insertData)
				.from(qb => {
					qb = qb.from('root_')
					return this.whereBuilder.build(qb, this.entity, this.pathFactory.create([]), this.where)
				})
				.returning(this.entity.primaryColumn)

			const beforeInsertEvent = new BeforeInsertEvent(this.entity, resolvedData)
			await mapper.eventManager.fire(beforeInsertEvent)

			const returning = (await qb.execute(mapper.db)).map(it => it[this.entity.primaryColumn])
			const result = returning.length === 1 ? returning[0] : null

			const afterInsertEvent = new AfterInsertEvent(this.entity, resolvedData, result)
			beforeInsertEvent.afterEvent = afterInsertEvent
			await mapper.eventManager.fire(afterInsertEvent)

			return { values: resolvedData, executed: true, primaryValue: result }
		} catch (e) {
			throw e
		}
	}
}
