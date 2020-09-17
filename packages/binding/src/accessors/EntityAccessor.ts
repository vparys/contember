import { BindingError } from '../BindingError'
import { Environment } from '../dao'
import { PlaceholderGenerator } from '../markers'
import { QueryLanguage } from '../queryLanguage'
import {
	DesugaredRelativeEntityList,
	DesugaredRelativeSingleEntity,
	DesugaredRelativeSingleField,
	FieldName,
	FieldValue,
	RelativeEntityList,
	RelativeSingleEntity,
	RelativeSingleField,
	SugaredRelativeEntityList,
	SugaredRelativeSingleEntity,
	SugaredRelativeSingleField,
} from '../treeParameters'
import { Accessor } from './Accessor'
import { EntityListAccessor } from './EntityListAccessor'
import { Errorable } from './Errorable'
import { ErrorAccessor } from './ErrorAccessor'
import { FieldAccessor } from './FieldAccessor'
import { GetEntityByKey } from './GetEntityByKey'
import { GetSubTree } from './GetSubTree'

class EntityAccessor extends Accessor implements Errorable {
	public readonly runtimeId: string | EntityAccessor.UnpersistedEntityId

	public constructor(
		key: string | EntityAccessor.UnpersistedEntityId,
		public readonly typeName: string | undefined,
		private readonly fieldData: EntityAccessor.FieldData,
		public readonly errors: ErrorAccessor[],
		public readonly environment: Environment,
		public readonly addEventListener: EntityAccessor.AddEntityEventListener,
		public readonly batchUpdates: EntityAccessor.BatchUpdates,
		public readonly connectEntityAtField: EntityAccessor.ConnectEntityAtField,
		public readonly disconnectEntityAtField: EntityAccessor.DisconnectEntityAtField,
		public readonly deleteEntity: EntityAccessor.DeleteEntity,
	) {
		super()
		this.runtimeId = key || new EntityAccessor.UnpersistedEntityId()
	}

	public get primaryKey(): string | undefined {
		return typeof this.runtimeId === 'string' ? this.runtimeId : undefined
	}

	public get existsOnServer(): boolean {
		return typeof this.runtimeId === 'string'
	}

	public get key(): string {
		return typeof this.runtimeId === 'string' ? this.runtimeId : this.runtimeId.value
	}

	public updateValues(fieldValuePairs: EntityAccessor.FieldValuePairs) {
		this.batchUpdates(getAccessor => {
			const entries = Array.isArray(fieldValuePairs) ? fieldValuePairs : Object.entries(fieldValuePairs)

			for (const [field, value] of entries) {
				getAccessor().getSingleField(field).updateValue(value)
			}
		})
	}

	/**
	 * Please keep in mind that this method signature is literally impossible to implement safely. The generic parameters
	 * are really just a way to succinctly write a type cast. Nothing more, really.
	 */
	public getSingleField<Persisted extends FieldValue = FieldValue, Produced extends Persisted = Persisted>(
		field: SugaredRelativeSingleField | string,
	): FieldAccessor<Persisted, Produced> {
		return this.getRelativeSingleField<Persisted, Produced>(
			QueryLanguage.desugarRelativeSingleField(field, this.environment),
		)
	}

	public getSingleEntity(entity: SugaredRelativeSingleEntity | string): EntityAccessor {
		return this.getRelativeSingleEntity(QueryLanguage.desugarRelativeSingleEntity(entity, this.environment))
	}

	public getEntityList(entityList: SugaredRelativeEntityList | string): EntityListAccessor {
		return this.getRelativeEntityList(QueryLanguage.desugarRelativeEntityList(entityList, this.environment))
	}

	//

	/**
	 * @see EntityAccessor.getSingleField
	 */
	public getRelativeSingleField<Persisted extends FieldValue = FieldValue, Produced extends Persisted = Persisted>(
		field: RelativeSingleField | DesugaredRelativeSingleField,
	): FieldAccessor<Persisted, Produced> {
		return (this.getRelativeSingleEntity(field).retrieveNestedAccessorByPlaceholder(
			PlaceholderGenerator.getFieldPlaceholder(field.field),
		) as unknown) as FieldAccessor<Persisted, Produced>
	}

	public getRelativeSingleEntity(
		relativeSingleEntity: RelativeSingleEntity | DesugaredRelativeSingleEntity,
	): EntityAccessor {
		let relativeTo: EntityAccessor = this

		for (const hasOneRelation of relativeSingleEntity.hasOneRelationPath) {
			relativeTo = relativeTo.retrieveNestedAccessorByPlaceholder(
				PlaceholderGenerator.getHasOneRelationPlaceholder(hasOneRelation),
			) as EntityAccessor
		}
		return relativeTo
	}

	public getRelativeEntityList(entityList: RelativeEntityList | DesugaredRelativeEntityList): EntityListAccessor {
		return this.getRelativeSingleEntity(entityList).retrieveNestedAccessorByPlaceholder(
			PlaceholderGenerator.getHasManyRelationPlaceholder(entityList.hasManyRelation),
		) as EntityListAccessor
	}

	/**
	 * The jarring method name is a not-so-subtle way to inform you that you probably shouldn't be using it.
	 * @internal
	 */
	public retrieveNestedAccessorByPlaceholder(placeholderName: FieldName): EntityAccessor.NestedAccessor {
		const record = this.fieldData.get(placeholderName)
		if (record === undefined) {
			throw new BindingError(
				`EntityAccessor: unknown field placeholder '${placeholderName}'. Unless this is just a typo, this is ` +
					`typically caused by one of the following:\n` +
					`\t• Trying to access a field that has not been registered during static render, and thus lacks a marker and an accessor.\n` +
					`\t• Misusing an EntityAccessor getter. If you used one of the getRelative[…] family, please make sure all ` +
					`parameters match the marker tree exactly.` +
					`\n\nFor more information, please consult the documentation.\n\n`,
			)
		}
		return record.getAccessor()
	}
}

namespace EntityAccessor {
	export class UnpersistedEntityId {
		public readonly value: string

		private static generateId = (() => {
			let id = 0
			return () => id++
		})()

		public constructor() {
			this.value = `unpersistedEntity-${UnpersistedEntityId.generateId()}`
		}
	}

	export interface FieldDatum {
		getAccessor(): NestedAccessor
	}
	export type NestedAccessor = EntityAccessor | EntityListAccessor | FieldAccessor

	export type FieldValuePairs =
		| {
				[field: string]: FieldValue
		  }
		| Array<[SugaredRelativeSingleField | string, FieldValue]>

	export type FieldData = Map<FieldName, FieldDatum>

	export interface BatchUpdatesHandlerExtraProps {
		getEntityByKey: GetEntityByKey
		getSubTree: GetSubTree
	}

	export type BatchUpdates = (performUpdates: EntityAccessor.BatchUpdatesHandler) => void
	export type BatchUpdatesHandler = (
		getAccessor: () => EntityAccessor,
		extraProps: BatchUpdatesHandlerExtraProps,
	) => void
	export type ConnectEntityAtField = (field: FieldName, entityToConnectOrItsKey: EntityAccessor | string) => void
	export type DeleteEntity = () => void
	export type DisconnectEntityAtField = (field: FieldName) => void
	export type UpdateListener = (accessor: EntityAccessor) => void

	export interface EntityEventListenerMap {
		beforePersist: BatchUpdatesHandler
		beforeUpdate: BatchUpdatesHandler
		connectionUpdate: UpdateListener
		initialize: BatchUpdatesHandler
		update: UpdateListener
	}
	export type EntityEventType = keyof EntityEventListenerMap
	export interface AddEntityEventListener {
		(type: 'beforePersist', listener: EntityEventListenerMap['beforePersist']): () => void
		(type: 'beforeUpdate', listener: EntityEventListenerMap['beforeUpdate']): () => void
		(type: 'connectionUpdate', hasOneField: FieldName, listener: EntityEventListenerMap['connectionUpdate']): () => void
		(type: 'initialize', listener: EntityEventListenerMap['initialize']): () => void
		(type: 'update', listener: EntityEventListenerMap['update']): () => void
	}
}

export { EntityAccessor }
